from fastapi import APIRouter, Request, Form, BackgroundTasks, Depends
from sqlalchemy.orm import Session
from app.db_session import get_db
from app.models.database import Meal, User
from app.services.analysis.food_analysis import food_analysis_service
import requests
import os
from datetime import datetime

router = APIRouter()

# Twilio credentials (should be in env, but for now we might mock or read)
# We need to reply to the user.
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_NUMBER = os.getenv("TWILIO_WHATSAPP_NUMBER") 

def send_whatsapp_message(to_number: str, body: str):
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN or not TWILIO_NUMBER:
        print("Twilio credentials missing. Cannot send WhatsApp reply.")
        return

    url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json"
    auth = (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    data = {
        "From": f"whatsapp:{TWILIO_NUMBER}",
        "To": to_number,
        "Body": body
    }
    
    try:
        requests.post(url, auth=auth, data=data)
    except Exception as e:
        print(f"Failed to send WhatsApp message: {e}")

async def process_whatsapp_image(image_url: str, user_phone: str, db: Session):
    # 1. Download image
    try:
        img_resp = requests.get(image_url)
        if img_resp.status_code != 200:
            send_whatsapp_message(user_phone, "Error downloading image.")
            return
        
        image_bytes = img_resp.content

        # 2. Analyze
        result = food_analysis_service.analyze_food_image(image_bytes)
        
        calories = result.get("calories", 0)
        description = result.get("description", "Food")
        
        if calories == 0:
             send_whatsapp_message(user_phone, f"Could not detect food in that image. ({description})")
             return

        # 3. Find User
        # Important: Logic to map Phone -> User. 
        # For MVP, we might hardcode a test user or need a user field for phone number.
        # Let's assume for now there's only one user or we just log it to a specific demo user
        # OR we try to match User by something. The implementation plan didn't specify phone mapping.
        # Let's fallback to the FIRST user in DB for MVP if no mapping exists, or just fail.
        # BETTER: The prompt implies "I send image... it updates".
        # Let's check if User model has phone. It doesn't. 
        # I'll just grab the first user for now as a "single user mode" fallback, 
        # or maybe we can ask the user to add their phone number.
        # Let's try to map by "admin" logic or just hardcode for the main user id found in logs?
        # User ID in logs: 7b2c5289-6328-4e9c-a71a-5883fe291b7c
        target_user_id = "7b2c5289-6328-4e9c-a71a-5883fe291b7c" 
        
        # 4. Save to DB
        meal = Meal(
            user_id=target_user_id,
            name=description,
            calories=calories,
            protein=result.get("protein", 0),
            carbs=result.get("carbs", 0),
            fats=result.get("fats", 0),
            image_url=image_url
        )
        db.add(meal)
        db.commit()
        
        # 5. Reply
        send_whatsapp_message(user_phone, f"✅ Logged: {description} ({calories} kcal)")
        
    except Exception as e:
        print(f"Error processing WhatsApp image: {e}")
        send_whatsapp_message(user_phone, "Error processing your food image.")


@router.post("/whatsapp")
async def whatsapp_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    form_data = await request.form()
    
    # Twilio sends form data: From, Body, NumMedia, MediaUrl0, etc.
    sender = form_data.get("From") # e.g., whatsapp:+1234567890
    num_media = int(form_data.get("NumMedia", 0))
    
    if num_media > 0:
        image_url = form_data.get("MediaUrl0")
        # Process in background to reply fast to Twilio
        # Note: We need a new DB session for background task or manage it carefully. 
        # BackgroundTasks with Depends(get_db) might close the session before task runs.
        # Better to create a new session inside the task or pass the data needed.
        # For simplicity in this rough implementation, we'll try to do it synchronously or 
        # use a separate session generator in the background function if needed.
        # Actually, let's just do it synchronously for the MVP to ensure it works, 
        # or properly handle session. 
        # Ideally: await process_whatsapp_image(...)
        
        # But `process_whatsapp_image` uses `requests` (blocking). 
        # Let's stick to synchronous for MVP to avoid complexity, or just background it
        # and create a fresh session inside.
        
        # Passing `db` to background task is risky as it closes.
        # Let's use `process_whatsapp_image_safe` that creates its own session.
        background_tasks.add_task(process_whatsapp_image_task, image_url, sender)
        
        return {"status": "processing"}
    else:
        # Text message?
        return {"status": "no_image"}

def process_whatsapp_image_task(image_url: str, user_phone: str):
    # Create new session
    from app.db_session import SessionLocal
    db = SessionLocal()
    try:
        # We can't await here easily if not async, but `requests` is sync anyway.
        # So we'll just run the sync logic.
        # We need to adapt `process_whatsapp_image` to be sync or run it.
        # Actually `process_whatsapp_image` above is defined async but uses sync requests...
        # Let's make it sync.
        
        # Copied logic for sync execution:
        img_resp = requests.get(image_url)
        if img_resp.status_code != 200:
             send_whatsapp_message(user_phone, "Error downloading image.")
             return
        image_bytes = img_resp.content
        
        result = food_analysis_service.analyze_food_image(image_bytes) # This is sync
        calories = result.get("calories", 0)
        description = result.get("description", "Food")
        
        if calories == 0:
             send_whatsapp_message(user_phone, f"Could not detect food. ({description})")
             return

        target_user_id = "7b2c5289-6328-4e9c-a71a-5883fe291b7c" 

        meal = Meal(
            user_id=target_user_id,
            name=description,
            calories=calories,
            protein=result.get("protein", 0),
            carbs=result.get("carbs", 0),
            fats=result.get("fats", 0),
            image_url=image_url
        )
        db.add(meal)
        db.commit()
        
        send_whatsapp_message(user_phone, f"✅ Logged: {description} ({calories} kcal)")
        
    except Exception as e:
        print(f"Error in background task: {e}")
    finally:
        db.close()
