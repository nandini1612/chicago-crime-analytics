"""
Chicago Crime Database Setup
Integrates with existing main.py and analysis scripts
Downloads data from Chicago Data Portal and creates crimes_clean.db
"""

import sqlite3
import pandas as pd
import os
from datetime import datetime

# Match your main.py configuration
DB_PATH = "data/processed/crimes_clean.db"
CHICAGO_API_URL = "https://data.cityofchicago.org/resource/ijzp-q8t2.csv"


def create_database():
    """Create database matching main.py schema"""
    print("Creating database schema...")

    os.makedirs("data/processed", exist_ok=True)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Drop if exists
    cursor.execute("DROP TABLE IF EXISTS crimes")

    # Schema matching your main.py expectations
    cursor.execute("""
        CREATE TABLE crimes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            case_number TEXT,
            date TEXT NOT NULL,
            crime_type TEXT NOT NULL,
            description TEXT,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            district TEXT,
            ward TEXT,
            beat TEXT,
            year_month TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Indexes for your API queries
    cursor.execute("CREATE INDEX idx_crime_type ON crimes(crime_type)")
    cursor.execute("CREATE INDEX idx_date ON crimes(date)")
    cursor.execute("CREATE INDEX idx_location ON crimes(latitude, longitude)")
    cursor.execute("CREATE INDEX idx_year_month ON crimes(year_month)")
    cursor.execute("CREATE INDEX idx_district ON crimes(district)")

    conn.commit()
    conn.close()

    print(f"✓ Database created: {DB_PATH}")


def download_chicago_data(limit=50000):
    """Download from Chicago Data Portal"""
    print(f"\nDownloading {limit} Chicago crime records...")
    print("This takes 30-60 seconds...")

    try:
        # Build URL - use %20 for space in URL encoding
        url = f"{CHICAGO_API_URL}?$limit={limit}&$order=date%20DESC"

        print(f"Fetching: {url[:100]}...")
        df = pd.read_csv(url)

        print(f"✓ Downloaded {len(df)} records")
        return df

    except Exception as e:
        print(f"✗ Download error: {e}")
        return None


def clean_data(df):
    """Clean and format data for your schema"""
    print("\nCleaning data...")

    original = len(df)

    # Column mapping to your schema
    rename_map = {"primary_type": "crime_type", "location_description": "description"}

    df = df.rename(columns=rename_map)

    # Required columns only
    keep_cols = [
        "case_number",
        "date",
        "crime_type",
        "description",
        "latitude",
        "longitude",
        "district",
        "ward",
        "beat",
    ]

    available = [c for c in keep_cols if c in df.columns]
    df = df[available]

    # Remove nulls
    df = df.dropna(subset=["latitude", "longitude", "date", "crime_type"])
    print(f"  Removed {original - len(df)} invalid records")

    # Validate Chicago bounds
    df = df[
        (df["latitude"] >= 41.64)
        & (df["latitude"] <= 42.02)
        & (df["longitude"] >= -87.94)
        & (df["longitude"] <= -87.52)
    ]

    # Format dates
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df = df.dropna(subset=["date"])

    # Add year_month for your API
    df["year_month"] = df["date"].dt.strftime("%Y-%m")
    df["date"] = df["date"].dt.strftime("%Y-%m-%d")

    # Fill nulls
    df["crime_type"] = df["crime_type"].fillna("UNKNOWN")
    df["district"] = df["district"].astype(str).fillna("0")
    df["description"] = df["description"].fillna("")

    print(f"✓ Cleaned: {len(df)} valid records")

    return df


def load_database(df):
    """Load into crimes_clean.db"""
    print("\nLoading to database...")

    conn = sqlite3.connect(DB_PATH)

    try:
        df.to_sql("crimes", conn, if_exists="append", index=False)

        # Stats
        cursor = conn.cursor()

        cursor.execute("SELECT COUNT(*) FROM crimes")
        total = cursor.fetchone()[0]

        cursor.execute("SELECT COUNT(DISTINCT crime_type) FROM crimes")
        types = cursor.fetchone()[0]

        cursor.execute("SELECT MIN(date), MAX(date) FROM crimes")
        dates = cursor.fetchone()

        print(f"\n{'=' * 60}")
        print(f"✓ DATABASE READY")
        print(f"{'=' * 60}")
        print(f"Records: {total:,}")
        print(f"Crime types: {types}")
        print(f"Date range: {dates[0]} → {dates[1]}")
        print(f"Location: {DB_PATH}")
        print(f"{'=' * 60}\n")

    except Exception as e:
        print(f"✗ Load error: {e}")
    finally:
        conn.close()


def verify_database():
    """Test queries matching your API"""
    print("Verifying database...")

    conn = sqlite3.connect(DB_PATH)

    try:
        # Test 1: Crime types (your /api/crimes/types)
        df = pd.read_sql_query(
            """
            SELECT crime_type, COUNT(*) as count 
            FROM crimes 
            GROUP BY crime_type 
            ORDER BY count DESC 
            LIMIT 5
        """,
            conn,
        )

        print("\n✓ Top crime types:")
        print(df.to_string(index=False))

        # Test 2: Recent data (your /api/crimes/all)
        df = pd.read_sql_query(
            """
            SELECT date, crime_type, district
            FROM crimes 
            ORDER BY date DESC 
            LIMIT 3
        """,
            conn,
        )

        print("\n✓ Recent crimes:")
        print(df.to_string(index=False))

        print("\n✓ Verification passed!")

    except Exception as e:
        print(f"✗ Verification error: {e}")
    finally:
        conn.close()


def main():
    """Main setup workflow"""
    print("=" * 60)
    print("CHICAGO CRIME HEATMAP - DATABASE SETUP")
    print("=" * 60)
    print()

    # Step 1: Create DB
    create_database()

    # Step 2: Download
    df = download_chicago_data(limit=50000)

    if df is None:
        print("\n✗ Setup failed")
        return

    # Step 3: Clean
    df = clean_data(df)

    if len(df) == 0:
        print("\n✗ No valid data")
        return

    # Step 4: Load
    load_database(df)

    # Step 5: Verify
    verify_database()

    print("\n🎉 Setup complete!")
    print("\nNext steps:")
    print("  python src/api/main.py")
    print("  python tests/test_api_simple.py")


if __name__ == "__main__":
    main()
