# check_schema.py
import sqlite3

db_path = "data/processed/crimes_clean.db"

conn = sqlite3.connect(db_path)
cursor = conn.execute("PRAGMA table_info(crimes);")

print("Columns in 'crimes' table:\n")
for col in cursor.fetchall():
    print(f"- {col[1]} ({col[2]})")

conn.close()
