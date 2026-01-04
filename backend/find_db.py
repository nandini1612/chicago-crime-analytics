import os
import sqlite3

print("=" * 60)
print("DATABASE LOCATION FINDER")
print("=" * 60)

# Get the directory of this script
current_dir = os.path.dirname(os.path.abspath(__file__))
print(f"\nCurrent script location: {current_dir}")

# Common locations to check
locations_to_check = [
    os.path.join(current_dir, "data", "processed", "crimes_clean.db"),
    os.path.join(current_dir, "..", "data", "processed", "crimes_clean.db"),
    os.path.join(current_dir, "src", "data", "processed", "crimes_clean.db"),
    os.path.join(current_dir, "data", "crimes_clean.db"),
]

print("\nChecking common locations:")
print("-" * 60)

found = False
for location in locations_to_check:
    abs_path = os.path.abspath(location)
    exists = os.path.exists(abs_path)
    print(f"\n{abs_path}")
    print(f"  Exists: {'✓ YES' if exists else '✗ NO'}")

    if exists:
        found = True
        # Try to connect and get count
        try:
            conn = sqlite3.connect(abs_path)
            cursor = conn.execute("SELECT COUNT(*) FROM crimes")
            count = cursor.fetchone()[0]
            conn.close()
            print(f"  Records: {count:,}")
            print(f"  ✓ THIS IS YOUR DATABASE!")
        except Exception as e:
            print(f"  Error: {e}")

if not found:
    print("\n" + "=" * 60)
    print("DATABASE NOT FOUND in common locations!")
    print("Searching entire backend directory...")
    print("=" * 60)

    for root, dirs, files in os.walk(current_dir):
        for file in files:
            if file == "crimes_clean.db":
                full_path = os.path.join(root, file)
                print(f"\n✓ FOUND: {full_path}")
                try:
                    conn = sqlite3.connect(full_path)
                    cursor = conn.execute("SELECT COUNT(*) FROM crimes")
                    count = cursor.fetchone()[0]
                    conn.close()
                    print(f"  Records: {count:,}")
                except Exception as e:
                    print(f"  Error: {e}")

print("\n" + "=" * 60)
