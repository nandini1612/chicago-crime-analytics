# src/analysis/hotspot_detector.py
import numpy as np
import pandas as pd
from sklearn.neighbors import KernelDensity
from sklearn.cluster import DBSCAN
import geopandas as gpd
from shapely.geometry import Point, Polygon
import matplotlib.pyplot as plt


class ChicagoHotspotDetector:
    def __init__(self, bandwidth=0.01, threshold_percentile=90):
        """
        Initialize hotspot detector

        Args:
            bandwidth: KDE bandwidth in degrees (0.01 ≈ 1.1km)
            threshold_percentile: Percentile threshold for hotspot identification
        """
        self.bandwidth = bandwidth
        self.threshold_percentile = threshold_percentile
        self.kde = None
        self.grid_points = None
        self.density_scores = None
        self.hotspots = None

    def fit(self, locations):
        """
        Fit KDE model on crime locations

        Args:
            locations: numpy array of [lat, lng] coordinates
        """
        print(f"Training KDE on {len(locations)} crime locations...")

        # Initialize and fit KDE
        self.kde = KernelDensity(kernel="gaussian", bandwidth=self.bandwidth)
        self.kde.fit(locations)

        print("KDE training completed!")
        return self

    def create_evaluation_grid(self, bounds, grid_size=50):
        """Create a grid of points for density evaluation"""
        lat_min, lat_max, lon_min, lon_max = bounds

        # Create grid
        lat_range = np.linspace(lat_min, lat_max, grid_size)
        lon_range = np.linspace(lon_min, lon_max, grid_size)

        grid_points = []
        for lat in lat_range:
            for lon in lon_range:
                grid_points.append([lat, lon])

        self.grid_points = np.array(grid_points)
        return self.grid_points

    def calculate_density_scores(self):
        """Calculate density scores for grid points"""
        if self.kde is None:
            raise ValueError("Must fit KDE model first")
        if self.grid_points is None:
            raise ValueError("Must create evaluation grid first")

        print("Calculating density scores...")

        # Calculate log density and convert to density
        log_density = self.kde.score_samples(self.grid_points)
        self.density_scores = np.exp(log_density)

        print("Density calculation completed!")
        return self.density_scores

    def identify_hotspots(self, min_points_per_hotspot=5):
        """Identify hotspot regions using threshold and clustering"""
        if self.density_scores is None:
            raise ValueError("Must calculate density scores first")

        # Apply threshold
        threshold = np.percentile(self.density_scores, self.threshold_percentile)
        high_density_mask = self.density_scores >= threshold
        high_density_points = self.grid_points[high_density_mask]

        print(f"Found {len(high_density_points)} high-density grid points")

        # Cluster high-density points using DBSCAN
        if len(high_density_points) > 0:
            clustering = DBSCAN(eps=0.01, min_samples=min_points_per_hotspot)
            cluster_labels = clustering.fit_predict(high_density_points)

            # Create hotspot polygons
            hotspots = []
            unique_labels = set(cluster_labels) - {-1}  # Remove noise (-1)

            for label in unique_labels:
                cluster_points = high_density_points[cluster_labels == label]

                if len(cluster_points) >= min_points_per_hotspot:
                    # Create convex hull as hotspot boundary
                    from scipy.spatial import ConvexHull

                    try:
                        hull = ConvexHull(cluster_points)
                        hull_points = cluster_points[hull.vertices]
                        polygon = Polygon(hull_points)

                        # Calculate hotspot properties
                        center = polygon.centroid
                        area_sq_km = (
                            polygon.area * 111.32 * 111.32
                        )  # Rough conversion to km²
                        density_score = np.mean(
                            self.density_scores[high_density_mask][
                                cluster_labels == label
                            ]
                        )

                        hotspots.append(
                            {
                                "id": len(hotspots) + 1,
                                "geometry": polygon,
                                "center_lat": center.y,
                                "center_lng": center.x,
                                "area_sq_km": area_sq_km,
                                "density_score": density_score,
                                "num_grid_points": len(cluster_points),
                            }
                        )
                    except Exception as e:
                        print(f"Error creating polygon for cluster {label}: {e}")
                        continue

            self.hotspots = hotspots
            print(f"Identified {len(hotspots)} crime hotspots")

        return self.hotspots

    def analyze_crimes_in_hotspots(self, crimes_gdf):
        """Analyze crimes within identified hotspots"""
        if self.hotspots is None:
            raise ValueError("Must identify hotspots first")

        hotspot_analysis = []

        for hotspot in self.hotspots:
            # Find crimes within this hotspot
            hotspot_polygon = hotspot["geometry"]
            crimes_in_hotspot = crimes_gdf[crimes_gdf.geometry.within(hotspot_polygon)]

            if len(crimes_in_hotspot) > 0:
                # Analyze crime types
                crime_types = crimes_in_hotspot["primary_type"].value_counts()

                # Temporal patterns
                temporal_patterns = {
                    "peak_hour": crimes_in_hotspot["hour"].mode().iloc[0]
                    if len(crimes_in_hotspot) > 0
                    else None,
                    "weekend_percentage": crimes_in_hotspot["is_weekend"].mean() * 100,
                    "seasonal_distribution": crimes_in_hotspot["season"]
                    .value_counts()
                    .to_dict(),
                }

                hotspot_analysis.append(
                    {
                        "hotspot_id": hotspot["id"],
                        "crime_count": len(crimes_in_hotspot),
                        "top_crime_types": crime_types.head(3).to_dict(),
                        "temporal_patterns": temporal_patterns,
                        "area_sq_km": hotspot["area_sq_km"],
                        "crimes_per_sq_km": len(crimes_in_hotspot)
                        / max(hotspot["area_sq_km"], 0.001),
                    }
                )

        return hotspot_analysis

    def visualize_results(self, bounds, crimes_gdf, figsize=(15, 10)):
        """Visualize hotspot detection results"""
        fig, axes = plt.subplots(2, 2, figsize=figsize)

        # 1. Original crime distribution
        axes[0, 0].scatter(
            crimes_gdf["longitude"], crimes_gdf["latitude"], alpha=0.5, s=1, c="red"
        )
        axes[0, 0].set_title("Original Crime Distribution")
        axes[0, 0].set_xlabel("Longitude")
        axes[0, 0].set_ylabel("Latitude")

        # 2. Density heatmap
        if self.density_scores is not None and self.grid_points is not None:
            lat_min, lat_max, lon_min, lon_max = bounds
            grid_size = int(np.sqrt(len(self.grid_points)))

            density_grid = self.density_scores.reshape(grid_size, grid_size)
            extent = [lon_min, lon_max, lat_min, lat_max]

            im = axes[0, 1].imshow(
                density_grid, extent=extent, origin="lower", cmap="YlOrRd", alpha=0.7
            )
            axes[0, 1].set_title("Crime Density Heatmap")
            axes[0, 1].set_xlabel("Longitude")
            axes[0, 1].set_ylabel("Latitude")
            plt.colorbar(im, ax=axes[0, 1])

        # 3. Identified hotspots
        if self.hotspots is not None:
            # Plot crime points
            axes[1, 0].scatter(
                crimes_gdf["longitude"],
                crimes_gdf["latitude"],
                alpha=0.3,
                s=1,
                c="lightgray",
                label="Crimes",
            )

            # Plot hotspot boundaries
            from shapely.plotting import plot_polygon

            for i, hotspot in enumerate(self.hotspots):
                x, y = hotspot["geometry"].exterior.xy
                axes[1, 0].plot(x, y, linewidth=2, label=f"Hotspot {hotspot['id']}")

                # Mark center
                axes[1, 0].plot(
                    hotspot["center_lng"], hotspot["center_lat"], "ko", markersize=8
                )

            axes[1, 0].set_title("Identified Crime Hotspots")
            axes[1, 0].set_xlabel("Longitude")
            axes[1, 0].set_ylabel("Latitude")
            axes[1, 0].legend(bbox_to_anchor=(1.05, 1), loc="upper left")

            # 4. Hotspot statistics
            hotspot_stats = pd.DataFrame(
                [
                    {
                        "Hotspot": h["id"],
                        "Area (km²)": round(h["area_sq_km"], 2),
                        "Density Score": round(h["density_score"], 4),
                    }
                    for h in self.hotspots
                ]
            )

            axes[1, 1].axis("tight")
            axes[1, 1].axis("off")
            table = axes[1, 1].table(
                cellText=hotspot_stats.values,
                colLabels=hotspot_stats.columns,
                cellLoc="center",
                loc="center",
            )
            table.auto_set_font_size(False)
            table.set_fontsize(9)
            axes[1, 1].set_title("Hotspot Statistics")

        plt.tight_layout()
        return fig


# Usage and testing script
if __name__ == "__main__":
    import sqlite3

    # Load crime data from database
    conn = sqlite3.connect("../../data/processed/chicago_crimes.db")
    query = "SELECT latitude, longitude, primary_type, hour, is_weekend, season FROM crimes LIMIT 10000"
    df = pd.read_sql_query(query, conn)

    # Convert to GeoDataFrame
    from src.analysis.geo_utils import ChicagoGeoProcessor

    processor = ChicagoGeoProcessor()
    crimes_gdf = processor.create_gdf_from_crimes(df)

    # Chicago bounds
    bounds = (41.6, 42.1, -87.9, -87.5)  # lat_min, lat_max, lon_min, lon_max

    # Initialize and run hotspot detection
    detector = ChicagoHotspotDetector(bandwidth=0.01, threshold_percentile=85)

    # Extract coordinates
    locations = np.array(
        [[row.geometry.y, row.geometry.x] for idx, row in crimes_gdf.iterrows()]
    )

    # Run complete hotspot detection pipeline
    print("Starting hotspot detection pipeline...")
    detector.fit(locations)
    detector.create_evaluation_grid(bounds, grid_size=40)
    detector.calculate_density_scores()
    hotspots = detector.identify_hotspots()

    # Analyze crimes in hotspots
    hotspot_analysis = detector.analyze_crimes_in_hotspots(crimes_gdf)

    # Save results
    if hotspots:
        hotspots_gdf = gpd.GeoDataFrame(hotspots)
        hotspots_gdf.to_file(
            "../../data/processed/chicago_crime_hotspots.geojson", driver="GeoJSON"
        )

        # Save analysis results
        analysis_df = pd.DataFrame(hotspot_analysis)
        analysis_df.to_csv("../../data/processed/hotspot_analysis.csv", index=False)

        print(f"\nHotspot Detection Results:")
        print(f"- Identified {len(hotspots)} hotspots")
        print(f"- Analysis saved to hotspot_analysis.csv")
        print(f"- Hotspot boundaries saved to chicago_crime_hotspots.geojson")

    # Create visualization
    fig = detector.visualize_results(bounds, crimes_gdf)
    plt.savefig(
        "../../data/exports/hotspot_detection_results.png", dpi=300, bbox_inches="tight"
    )
    plt.show()

    conn.close()
    print("Hotspot detection completed!")
