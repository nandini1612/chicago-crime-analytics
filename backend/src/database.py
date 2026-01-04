# backend/src/database.py
import sqlite3
import os

# ==============================================================
# DATABASE CONFIGURATION
# ==============================================================

# Construct the correct database path (relative to this file)
DB_PATH = os.path.join(
    os.path.dirname(__file__),  # backend/src/
    "..",  # backend/
    "data",  # backend/data/
    "processed",  # backend/data/processed/
    "crimes_clean.db",  # backend/data/processed/crimes_clean.db
)

# Resolve to an absolute path
DB_PATH = os.path.abspath(DB_PATH)

# Log only once for debugging (can be toggled off in production)
print(f"✓ Database path resolved: {DB_PATH}")


# ==============================================================
# DATABASE CONNECTION
# ==============================================================


def get_db_connection():
    """Establish and return a SQLite database connection."""
    try:
        if not os.path.exists(DB_PATH):
            raise FileNotFoundError(f"Database not found at: {DB_PATH}")

        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row  # Enables dict-like row access
        return conn
    except Exception as e:
        # Minimal production-safe logging
        print(f"❌ Database connection error: {e}")
        raise
