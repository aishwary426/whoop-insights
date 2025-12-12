import sqlite3
import os

# Database path
DB_PATH = "backend/whoop.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    print(f"Connecting to database at {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Columns to add
    new_columns = {
        "strain_baseline_7d": "FLOAT",
        "strain_baseline_30d": "FLOAT",
        "recovery_baseline_7d": "FLOAT",
        "recovery_baseline_30d": "FLOAT",
        "sleep_baseline_7d": "FLOAT",
        "sleep_baseline_30d": "FLOAT",
        "hrv_baseline_7d": "FLOAT",
        "hrv_baseline_30d": "FLOAT",
        "rhr_baseline_7d": "FLOAT",
        "rhr_baseline_30d": "FLOAT",
        "recovery_z_score": "FLOAT",
        "strain_z_score": "FLOAT",
        "sleep_z_score": "FLOAT",
        "hrv_z_score": "FLOAT",
        "rhr_z_score": "FLOAT",
        "acute_chronic_ratio": "FLOAT",
        "sleep_debt": "FLOAT",
        "consistency_score": "FLOAT"
    }

    # Get existing columns
    cursor.execute("PRAGMA table_info(daily_metrics)")
    existing_columns = [row[1] for row in cursor.fetchall()]
    
    print(f"Existing columns: {existing_columns}")

    for col_name, col_type in new_columns.items():
        if col_name not in existing_columns:
            print(f"Adding column: {col_name} ({col_type})")
            try:
                cursor.execute(f"ALTER TABLE daily_metrics ADD COLUMN {col_name} {col_type}")
            except sqlite3.OperationalError as e:
                print(f"Error adding {col_name}: {e}")
        else:
            print(f"Column {col_name} already exists.")

    conn.commit()
    conn.close()
    print("Migration completed.")

if __name__ == "__main__":
    migrate()
