# src/database/schema.py
import sqlite3
import os
import pandas as pd


class ChicagoCrimeDB:
    def __init__(self, db_path=None):
        if db_path is None:
            db_path = os.path.join(
                os.path.dirname(__file__),
                "..",
                "..",
                "data",
                "processed",
                "chicago_crimes.db",
            )
        self.db_path = os.path.abspath(db_path)
        self.conn = None

    def connect(self):
        """Create database connection"""
        self.conn = sqlite3.connect(self.db_path)
        self.conn.execute("PRAGMA foreign_keys = ON")
        return self.conn

    def create_tables(self):
        """Create database schema"""
        if not self.conn:
            self.connect()

        create_crimes_table = """
        CREATE TABLE IF NOT EXISTS crimes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            case_number TEXT UNIQUE,
            date TEXT NOT NULL,
            primary_type TEXT NOT NULL,
            description TEXT,
            crime_category TEXT,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            beat TEXT,
            district TEXT,
            ward TEXT,
            year INTEGER,
            month INTEGER,
            hour INTEGER,
            day_of_week TEXT,
            is_weekend INTEGER,
            season TEXT,
            arrest INTEGER,
            domestic INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """

        create_indexes = [
            "CREATE INDEX IF NOT EXISTS idx_crimes_date ON crimes(date);",
            "CREATE INDEX IF NOT EXISTS idx_crimes_type ON crimes(primary_type);",
            "CREATE INDEX IF NOT EXISTS idx_crimes_location ON crimes(latitude, longitude);",
            "CREATE INDEX IF NOT EXISTS idx_crimes_district ON crimes(district);",
            "CREATE INDEX IF NOT EXISTS idx_crimes_year_month ON crimes(year, month);",
        ]

        try:
            self.conn.execute(create_crimes_table)
            for sql in create_indexes:
                self.conn.execute(sql)
            self.conn.commit()
            print("✓ Database schema created successfully!")
        except Exception as e:
            print(f"Error creating schema: {e}")

    def insert_crimes(self, df):
        """Insert cleaned crime data into database"""
        if not self.conn:
            self.connect()

        try:
            df_insert = df.copy()
            df_insert["arrest"] = df_insert.get("arrest", False).astype(int)
            df_insert["domestic"] = df_insert.get("domestic", False).astype(int)
            if "is_weekend" in df_insert.columns:
                df_insert["is_weekend"] = df_insert["is_weekend"].astype(int)

            df_insert.to_sql("crimes", self.conn, if_exists="append", index=False)
            self.conn.commit()
            print(f"✓ Inserted {len(df_insert)} records into database")
        except Exception as e:
            print(f"Error inserting data: {e}")

    def get_crime_summary(self):
        """Get basic statistics from database"""
        if not self.conn:
            self.connect()

        queries = {
            "total_crimes": "SELECT COUNT(*) as count FROM crimes",
            "date_range": "SELECT MIN(date) as min_date, MAX(date) as max_date FROM crimes",
            "top_crime_types": """
                SELECT primary_type, COUNT(*) as count 
                FROM crimes 
                GROUP BY primary_type 
                ORDER BY count DESC 
                LIMIT 10
            """,
            "crimes_by_year": """
                SELECT year, COUNT(*) as count 
                FROM crimes 
                GROUP BY year 
                ORDER BY year
            """,
        }

        results = {}
        for name, query in queries.items():
            cursor = self.conn.execute(query)
            results[name] = cursor.fetchall()

        return results


if __name__ == "__main__":
    db = ChicagoCrimeDB()
    db.create_tables()

    # Optional: load sample data if you have it
    csv_path = os.path.join(
        os.path.dirname(__file__),
        "..",
        "..",
        "data",
        "processed",
        "chicago_crimes_clean.csv",
    )
    if os.path.exists(csv_path):
        df_clean = pd.read_csv(csv_path)
        db.insert_crimes(df_clean)
        print("\n=== DATABASE SUMMARY ===")
        summary = db.get_crime_summary()
        for key, value in summary.items():
            print(f"{key}: {value}")
    else:
        print("⚠ No CSV file found to insert data.")
