# src/utils/data_cleaner.py
import pandas as pd
import numpy as np


class ChicagoCrimeDataCleaner:
    def __init__(self):
        self.chicago_bounds = {
            "lat_min": 41.6,
            "lat_max": 42.1,
            "lon_min": -87.9,
            "lon_max": -87.5,
        }

    def clean_dataset(self, df):
        """Comprehensive data cleaning"""
        print(f"Initial dataset size: {len(df)}")

        # 1. Remove rows with missing essential data
        essential_cols = ["latitude", "longitude", "primary_type", "date"]
        df_clean = df.dropna(subset=essential_cols).copy()
        print(f"After removing missing essential data: {len(df_clean)}")

        # 2. Validate coordinates are within Chicago bounds
        df_clean = self.validate_coordinates(df_clean)
        print(f"After coordinate validation: {len(df_clean)}")

        # 3. Standardize crime types
        df_clean = self.standardize_crime_types(df_clean)

        # 4. Parse and validate dates
        df_clean = self.clean_dates(df_clean)

        # 5. Add derived columns
        df_clean = self.add_derived_columns(df_clean)

        return df_clean

    def validate_coordinates(self, df):
        """Remove coordinates outside Chicago bounds"""
        bounds = self.chicago_bounds
        mask = (
            (df["latitude"] >= bounds["lat_min"])
            & (df["latitude"] <= bounds["lat_max"])
            & (df["longitude"] >= bounds["lon_min"])
            & (df["longitude"] <= bounds["lon_max"])
        )
        return df[mask].copy()

    def standardize_crime_types(self, df):
        """Standardize crime type names"""
        crime_mapping = {
            "BATTERY": "ASSAULT/BATTERY",
            "ASSAULT": "ASSAULT/BATTERY",
            "THEFT": "THEFT",
            "CRIMINAL DAMAGE": "VANDALISM",
            "NARCOTICS": "DRUG_RELATED",
            "BURGLARY": "BURGLARY",
            "ROBBERY": "ROBBERY",
            "MOTOR VEHICLE THEFT": "VEHICLE_THEFT",
        }

        df["crime_category"] = df["primary_type"].map(crime_mapping).fillna("OTHER")
        return df

    def clean_dates(self, df):
        """Parse and validate dates"""
        df["date"] = pd.to_datetime(df["date"], errors="coerce")
        df = df.dropna(subset=["date"])

        # Remove future dates and very old dates (before 2008)
        current_date = pd.Timestamp.now()
        df = df[(df["date"] >= "2008-01-01") & (df["date"] <= current_date)]
        return df

    def add_derived_columns(self, df):
        """Add useful derived columns"""
        df["year"] = df["date"].dt.year
        df["month"] = df["date"].dt.month
        df["day_of_week"] = df["date"].dt.day_name()
        df["hour"] = df["date"].dt.hour
        df["is_weekend"] = df["date"].dt.weekday >= 5

        # Season
        df["season"] = df["month"].map(
            {
                12: "Winter",
                1: "Winter",
                2: "Winter",
                3: "Spring",
                4: "Spring",
                5: "Spring",
                6: "Summer",
                7: "Summer",
                8: "Summer",
                9: "Fall",
                10: "Fall",
                11: "Fall",
            }
        )

        return df


# Usage script
if __name__ == "__main__":
    cleaner = ChicagoCrimeDataCleaner()

    # Clean sample data
    df_raw = pd.read_csv("../data/raw/chicago_crimes_sample.csv")
    df_clean = cleaner.clean_dataset(df_raw)

    # Save cleaned data
    df_clean.to_csv("../data/processed/chicago_crimes_clean.csv", index=False)
    print("Data cleaning completed!")
