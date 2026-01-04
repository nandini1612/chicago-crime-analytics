# src/analysis/hotspot_experiments.py
import numpy as np
import pandas as pd
import json
from datetime import datetime
import os


class HotspotExperimentRunner:
    def __init__(self, crimes_gdf, bounds, results_dir="data/experiments"):
        self.crimes_gdf = crimes_gdf
        self.bounds = bounds
        self.results_dir = results_dir
        self.locations = np.array(
            [[row.geometry.y, row.geometry.x] for idx, row in crimes_gdf.iterrows()]
        )

        # Create results directory
        os.makedirs(results_dir, exist_ok=True)

    def run_bandwidth_experiments(self, bandwidths=[0.005, 0.01, 0.015, 0.02, 0.025]):
        """Test different KDE bandwidths"""
        results = []

        print("Running bandwidth experiments...")

        for bandwidth in bandwidths:
            print(f"Testing bandwidth: {bandwidth}")

            try:
                detector = ChicagoHotspotDetector(
                    bandwidth=bandwidth, threshold_percentile=85
                )

                # Run detection
                detector.fit(self.locations)
                detector.create_evaluation_grid(self.bounds, grid_size=30)
                detector.calculate_density_scores()
                hotspots = detector.identify_hotspots()

                # Calculate metrics
                metrics = self.calculate_metrics(detector, hotspots)
                metrics["bandwidth"] = bandwidth

                results.append(metrics)

            except Exception as e:
                print(f"Error with bandwidth {bandwidth}: {e}")
                continue

        # Save results
        results_df = pd.DataFrame(results)
        results_df.to_csv(f"{self.results_dir}/bandwidth_experiments.csv", index=False)

        return results_df

    def run_threshold_experiments(self, thresholds=[80, 85, 90, 95]):
        """Test different density thresholds"""
        results = []

        print("Running threshold experiments...")

        for threshold in thresholds:
            print(f"Testing threshold: {threshold}%")

            try:
                detector = ChicagoHotspotDetector(
                    bandwidth=0.01, threshold_percentile=threshold
                )

                # Run detection
                detector.fit(self.locations)
                detector.create_evaluation_grid(self.bounds, grid_size=30)
                detector.calculate_density_scores()
                hotspots = detector.identify_hotspots()

                # Calculate metrics
                metrics = self.calculate_metrics(detector, hotspots)
                metrics["threshold_percentile"] = threshold

                results.append(metrics)

            except Exception as e:
                print(f"Error with threshold {threshold}: {e}")
                continue

        # Save results
        results_df = pd.DataFrame(results)
        results_df.to_csv(f"{self.results_dir}/threshold_experiments.csv", index=False)

        return results_df

    def calculate_metrics(self, detector, hotspots):
        """Calculate evaluation metrics for hotspot detection"""
        if not hotspots:
            return {
                "num_hotspots": 0,
                "total_hotspot_area": 0,
                "coverage_percentage": 0,
                "avg_hotspot_size": 0,
                "crimes_in_hotspots": 0,
                "hotspot_efficiency": 0,
            }

        # Basic metrics
        num_hotspots = len(hotspots)
        total_area = sum(h["area_sq_km"] for h in hotspots)
        avg_size = total_area / num_hotspots if num_hotspots > 0 else 0

        # Coverage analysis
        crimes_in_hotspots = 0
        for hotspot in hotspots:
            crimes_in_polygon = self.crimes_gdf[
                self.crimes_gdf.geometry.within(hotspot["geometry"])
            ]
            crimes_in_hotspots += len(crimes_in_polygon)

        coverage_percentage = (crimes_in_hotspots / len(self.crimes_gdf)) * 100

        # Efficiency: crimes captured per km²
        efficiency = crimes_in_hotspots / max(total_area, 0.001)

        return {
            "num_hotspots": num_hotspots,
            "total_hotspot_area": round(total_area, 2),
            "coverage_percentage": round(coverage_percentage, 2),
            "avg_hotspot_size": round(avg_size, 3),
            "crimes_in_hotspots": crimes_in_hotspots,
            "hotspot_efficiency": round(efficiency, 2),
        }

    def find_optimal_parameters(self):
        """Find best parameter combination"""
        bandwidth_results = self.run_bandwidth_experiments()
        threshold_results = self.run_threshold_experiments()

        # Find best bandwidth (highest efficiency with reasonable coverage)
        bandwidth_results["score"] = (
            bandwidth_results["hotspot_efficiency"] * 0.6
            + bandwidth_results["coverage_percentage"] * 0.4
        )
        best_bandwidth = bandwidth_results.loc[
            bandwidth_results["score"].idxmax(), "bandwidth"
        ]

        # Find best threshold
        threshold_results["score"] = (
            threshold_results["hotspot_efficiency"] * 0.6
            + threshold_results["coverage_percentage"] * 0.4
        )
        best_threshold = threshold_results.loc[
            threshold_results["score"].idxmax(), "threshold_percentile"
        ]

        optimal_params = {
            "bandwidth": best_bandwidth,
            "threshold_percentile": best_threshold,
            "experiment_date": datetime.now().isoformat(),
        }

        # Save optimal parameters
        with open(f"{self.results_dir}/optimal_parameters.json", "w") as f:
            json.dump(optimal_params, f, indent=2)

        print(f"Optimal parameters found:")
        print(f"- Bandwidth: {best_bandwidth}")
        print(f"- Threshold: {best_threshold}%")

        return optimal_params


# Experiment runner script
if __name__ == "__main__":
    import sqlite3
    import geopandas as gpd
    from src.analysis.geo_utils import ChicagoGeoProcessor

    # Load data
    conn = sqlite3.connect("../../data/processed/chicago_crimes.db")
    query = "SELECT * FROM crimes LIMIT 20000"  # Larger sample for experiments
    df = pd.read_sql_query(query, conn)

    processor = ChicagoGeoProcessor()
    crimes_gdf = processor.create_gdf_from_crimes(df)
    bounds = (41.6, 42.1, -87.9, -87.5)

    # Run experiments
    experiment_runner = HotspotExperimentRunner(crimes_gdf, bounds)
    optimal_params = experiment_runner.find_optimal_parameters()

    print("Parameter tuning completed!")
    conn.close()
