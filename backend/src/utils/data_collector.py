# src/utils/data_collector.py
import requests
import pandas as pd
import os

class ChicagoCrimeCollector:
    def __init__(self, data_dir="data/raw"):
        self.data_dir = data_dir
        self.base_url = "https://data.cityofchicago.org/resource/ijzp-q8t2.csv"
        
    def download_recent_crimes(self, limit=50000):
        """Download recent crime data from Chicago Data Portal"""
        try:
            url = f"{self.base_url}?$limit={limit}&$order=date DESC"
            print(f"Downloading {limit} records from Chicago Data Portal...")
            
            df = pd.read_csv(url)
            
            # Save to raw data
            output_path = os.path.join(self.data_dir, "chicago_crimes_recent.csv")
            df.to_csv(output_path, index=False)
            print(f"Downloaded {len(df)} records to {output_path}")
            
            return df
        except Exception as e:
            print(f"Error downloading data: {e}")
            return None
    
    def get_sample_data(self, n=1000):
        """Get a small sample for development"""
        url = f"{self.base_url}?$limit={n}"
        return pd.read_csv(url)

if __name__ == "__main__":
    collector = ChicagoCrimeCollector()
    # Start with small sample
    sample_df = collector.get_sample_data(5000)
    sample_df.to_csv("data/raw/chicago_crimes_sample.csv", index=False)
    print("Sample data ready for exploration!")