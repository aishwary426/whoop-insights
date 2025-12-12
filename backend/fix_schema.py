
import sqlite3

def fix_schema():
    db_path = "whoop.db"  # Found via search
    # Check if db exists here or in backend/
    import os
    if not os.path.exists(db_path):
        db_path = "backend/whoop.db"
    
    if not os.path.exists(db_path):
        # Fallback to absolute path search if needed, but relative should work in backend dir
        db_path = "/Users/aishwary/Downloads/zenith/backend/whoop.db"
        print(f"Database not found at {db_path}")
        return

    print(f"Connecting to {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Check if column exists
        cursor.execute("PRAGMA table_info(meals)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if "date" not in columns:
            print("Adding 'date' column to 'meals' table...")
            cursor.execute("ALTER TABLE meals ADD COLUMN date DATE")
            conn.commit()
            print("Column added successfully.")
            
            # Optional: Backfill date from timestamp
            print("Backfilling date from timestamp...")
            cursor.execute("UPDATE meals SET date = date(timestamp)")
            conn.commit()
            print("Backfill complete.")
        else:
            print("'date' column already exists.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    fix_schema()
