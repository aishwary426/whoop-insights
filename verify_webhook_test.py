import requests
import json
import time

def verify():
    # 1. Simulate WhatsApp webhook with an image
    print("Simulating WhatsApp webhook...")
    
    # Use a dummy food image URL
    image_url = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c" # Salad image
    
    payload = {
        "From": "whatsapp:+1234567890",
        "NumMedia": "1",
        "MediaUrl0": image_url
    }
    
    try:
        response = requests.post("http://localhost:8000/api/v1/webhook/whatsapp", data=payload)
        print(f"Webhook Response: {response.status_code} {response.json()}")
        
        if response.status_code != 200:
            print("❌ Webhook failed")
            return

        # 2. Check if meal was added to DB via GET /api/v1/meals
        print("Waiting for processing...")
        time.sleep(5) # Wait for background/sync processing (it was sync in my code)
        
        # We need a token or just call it if auth is open. 
        # In my code: `current_user = Depends(get_current_user)`
        # If I don't provide a token, it might fail if `get_current_user` enforces it.
        # Let's see if I can use the existing `whoop.db` user logged in or mock it.
        # The webhook bypasses auth (it's open for Twilio), but GET /meals needs auth.
        
        # Checking if I can verify another way. Maybe check logs or `sqlite3`.
        print("Verifying database update via SQLite...")
        import sqlite3
        conn = sqlite3.connect('backend/whoop.db')
        c = conn.cursor()
        c.execute("SELECT * FROM meals ORDER BY id DESC LIMIT 1")
        row = c.fetchone()
        
        if row:
            print(f"✅ Found meal in DB: {row}")
        else:
            print("❌ No meal found in DB.")
            
    except Exception as e:
        print(f"Verification failed: {e}")

if __name__ == "__main__":
    verify()
