# src/analysis/geo_utils.py
import geopandas as gpd
import pandas as pd
import numpy as np
from shapely.geometry import Point
import requests
import json


class ChicagoGeoProcessor:
    def __init__(self):
        self.chicago_center = (41.8781, -87.6298)
        self.chicago_bounds = None

    def create_gdf_from_crimes(self, df):
        """Convert crime DataFrame to GeoDataFrame"""
        # Create Point geometries
        geometry = [Point(xy) for xy in zip(df["longitude"], df["latitude"])]
        gdf = gpd.GeoDataFrame(df, geometry=geometry, crs="EPSG:4326")
        return gdf

    def download_chicago_boundaries(self):
        """Download Chicago ward/district boundaries"""
        try:
            # Chicago ward boundaries
            wards_url = "https://data.cityofchicago.org/resource/sp34-6z76.geojson"
            wards_gdf = gpd.read_file(wards_url)
            wards_gdf.to_file("data/external/chicago_wards.geojson", driver="GeoJSON")
            print("Downloaded Chicago ward boundaries")

            # Police districts
            districts_url = "https://data.cityofchicago.org/resource/fthy-xz3r.geojson"
            districts_gdf = gpd.read_file(districts_url)
            districts_gdf.to_file(
                "data/external/chicago_police_districts.geojson", driver="GeoJSON"
            )
            print("Downloaded Chicago police district boundaries")

            return wards_gdf, districts_gdf
        except Exception as e:
            print(f"Error downloading boundaries: {e}")
            return None, None

    def spatial_join_crimes_to_districts(self, crimes_gdf, districts_gdf):
        """Join crimes to police districts"""
        # Ensure same CRS
        if crimes_gdf.crs != districts_gdf.crs:
            districts_gdf = districts_gdf.to_crs(crimes_gdf.crs)

        # Spatial join
        crimes_with_districts = gpd.sjoin(
            crimes_gdf, districts_gdf[["geometry", "dist_num"]], how="left", op="within"
        )

        return crimes_with_districts

    def create_chicago_grid(self, cell_size_km=1):
        """Create a grid over Chicago for analysis"""
        from shapely.geometry import box

        # Chicago approximate bounds
        minx, miny = -87.9, 41.6
        maxx, maxy = -87.5, 42.1

        # Convert km to degrees (approximate)
        cell_size_deg = cell_size_km / 111.0  # 1 degree ≈ 111 km

        # Create grid
        x_coords = np.arange(minx, maxx, cell_size_deg)
        y_coords = np.arange(miny, maxy, cell_size_deg)

        grid_cells = []
        for x in x_coords:
            for y in y_coords:
                grid_cells.append(
                    {
                        "geometry": box(x, y, x + cell_size_deg, y + cell_size_deg),
                        "grid_id": f"{x:.3f}_{y:.3f}",
                    }
                )

        grid_gdf = gpd.GeoDataFrame(grid_cells, crs="EPSG:4326")
        return grid_gdf


# Usage script
if __name__ == "__main__":
    processor = ChicagoGeoProcessor()

    # Load crime data
    df = pd.read_csv("../data/processed/chicago_crimes_clean.csv")
    crimes_gdf = processor.create_gdf_from_crimes(df)

    # Download boundaries
    wards_gdf, districts_gdf = processor.download_chicago_boundaries()

    if districts_gdf is not None:
        # Spatial join
        crimes_with_districts = processor.spatial_join_crimes_to_districts(
            crimes_gdf, districts_gdf
        )
        crimes_with_districts.to_file(
            "data/processed/crimes_with_districts.geojson", driver="GeoJSON"
        )
        print("Created crimes with district boundaries")

    print("Geospatial processing completed!")
