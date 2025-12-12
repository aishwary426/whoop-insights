import logging
import json
import os
from typing import Optional
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db_session import get_db
from app.core_config import get_settings
from app.models.database import User

# Initialize logger first
logger = logging.getLogger(__name__)

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    # Load .env from backend directory
    env_path = Path(__file__).parent.parent.parent.parent.parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)
        logger.info(f"Loaded .env file from: {env_path}")
    else:
        # Also try loading from current directory
        load_dotenv()
except ImportError:
    logger.warning("python-dotenv not installed, environment variables must be set manually")

router = APIRouter(tags=["zenith"])


class ZenithChatRequest(BaseModel):
    question: str
    user_data: Optional[dict] = None


class ZenithChatResponse(BaseModel):
    message: str


def format_user_data_for_prompt(summary: Optional[dict] = None, trends: Optional[dict] = None, user: Optional[User] = None) -> str:
    """Format user's WHOOP data into a readable string for the AI prompt."""
    data_parts = []
    
    # Add user information if available
    if user:
        # Check if name is invalid (default name, "-", or empty)
        is_invalid_name = False
        if user.name:
            # Check if it's a dash/hyphen (invalid placeholder)
            if user.name.strip() == "-":
                is_invalid_name = True
            # Check if it matches the pattern "User {uuid}" where uuid is 36 chars (with dashes)
            elif user.name.startswith("User ") and len(user.name) > 40:
                # Extract the part after "User "
                potential_id = user.name[5:].strip()
                # Check if it matches the user's actual ID (UUID format)
                if potential_id == user.id or (len(potential_id) == 36 and potential_id.count('-') == 4):
                    is_invalid_name = True
        else:
            is_invalid_name = True
        
        data_parts.append(f"=== USER INFORMATION ===")
        if user.name and not is_invalid_name:
            data_parts.append(f"Name: {user.name}")
        else:
            data_parts.append(f"Name: Not set in profile")
        if user.age:
            data_parts.append(f"Age: {user.age}")
        if user.nationality:
            data_parts.append(f"Nationality: {user.nationality}")
        if user.goal:
            data_parts.append(f"Goal: {user.goal}")
        # Never include User ID in the prompt - it's internal only
        data_parts.append("")  # Empty line for spacing
    
    if summary and isinstance(summary, dict):
        today = summary.get('today', {}) or {}
        recommendation = summary.get('recommendation', {}) or {}
        tomorrow = summary.get('tomorrow', {}) or {}
        scores = summary.get('scores', {}) or {}
        
        # Ensure today, recommendation, tomorrow, and scores are dictionaries
        if not isinstance(today, dict):
            today = {}
        if not isinstance(recommendation, dict):
            recommendation = {}
        if not isinstance(tomorrow, dict):
            tomorrow = {}
        if not isinstance(scores, dict):
            scores = {}
        
        data_parts.append("=== TODAY'S METRICS ===")
        if today.get('recovery_score') is not None:
            data_parts.append(f"Recovery Score: {today.get('recovery_score', 0):.1f}%")
        if today.get('strain_score') is not None:
            data_parts.append(f"Strain Score: {today.get('strain_score', 0):.1f}")
        if today.get('sleep_hours') is not None:
            data_parts.append(f"Sleep: {today.get('sleep_hours', 0):.1f} hours")
        if today.get('hrv') is not None:
            data_parts.append(f"HRV: {today.get('hrv', 0):.1f} ms")
        if today.get('resting_hr') is not None:
            data_parts.append(f"Resting HR: {today.get('resting_hr', 0):.1f} bpm")
        
        data_parts.append("\n=== RECOMMENDATION ===")
        if recommendation:
            data_parts.append(f"Intensity: {recommendation.get('intensity_level', 'N/A')}")
            data_parts.append(f"Focus: {recommendation.get('focus', 'N/A')}")
            data_parts.append(f"Workout Type: {recommendation.get('workout_type', 'N/A')}")
            data_parts.append(f"Optimal Time: {recommendation.get('optimal_time', 'N/A')}")
        
        data_parts.append("\n=== TOMORROW'S FORECAST ===")
        if tomorrow:
            if tomorrow.get('recovery_forecast') is not None:
                data_parts.append(f"Predicted Recovery: {tomorrow.get('recovery_forecast', 0):.1f}%")
                data_parts.append(f"Confidence: {tomorrow.get('confidence', 0):.1f}%")
        
        data_parts.append("\n=== HEALTH SCORES ===")
        if scores:
            data_parts.append(f"Consistency: {scores.get('consistency', 0):.1f}%")
            data_parts.append(f"Burnout Risk: {scores.get('burnout_risk', 0):.1f}%")
            data_parts.append(f"Sleep Health: {scores.get('sleep_health', 0):.1f}%")
            data_parts.append(f"Injury Risk: {scores.get('injury_risk', 0):.1f}%")
    
    if trends and isinstance(trends, dict) and trends.get('series'):
        series = trends.get('series', {})
        if isinstance(series, dict):
            data_parts.append("\n=== RECENT TRENDS (Last 30 days) ===")
            
            # Get recent data points
            for metric_name in ['recovery', 'strain', 'sleep', 'hrv', 'resting_hr']:
                metric_data = series.get(metric_name, [])
                if metric_data and isinstance(metric_data, list) and len(metric_data) > 0:
                    recent = metric_data[-10:] if len(metric_data) > 10 else metric_data
                    values = [p.get('value', 0) for p in recent if isinstance(p, dict) and p.get('value') is not None]
                    if values:
                        avg = sum(values) / len(values)
                        if avg > 0:
                            data_parts.append(f"{metric_name.capitalize()} (avg last 10 days): {avg:.1f}")
    
    return "\n".join(data_parts) if data_parts else "No data available yet. Please upload your WHOOP data to get personalized insights."


def call_ai_api(prompt: str, user_data_str: str, question: str) -> str:
    """Call AI API (Groq) to get AI response."""
    
    system_prompt = """You are Zenith, an elite Performance Coach who is deeply invested in the user's success. You are not a robot; you are a partner in their fitness journey.

CONTEXT:

- You have access to the user's historical WHOOP data (strain, sleep, recovery, HRV, RHR).
- You combine this data with sports science to give personalized advice.
- You know the user's profile (name, age, nationality, goals) if available.

COMMUNICATION STYLE:
- **Conversational & Empathetic**: Talk like a real human coach, not a database. Use natural language, contractions (e.g., "don't" instead of "do not"), and varied sentence structure.
- **Direct & Personal**: Address the user by name (if available). If their data looks tough (low recovery), show empathy. If they crushed it, celebrate with them!
- **No Robot Speak**: Avoid phrases like "Based on the data provided..." or "Analysis indicates...". Instead say, "I noticed that..." or "It looks like..."
- **Concise & Impactful**: Get to the point. Don't write walls of text. Use short paragraphs.
- **NEVER** mention user IDs or UUIDs.

HOW TO RESPOND:
1. **Connect First**: Start with a human reaction to their question or data. (e.g., "That's a great goal, [Name]!" or "Oof, looks like a rough night of sleep.")
2. **Weave in Data**: Don't just list stats. Weave them into your story. (e.g., "Your HRV dropped to 35ms last night, which suggests...")
3. **Focus on the 'Why'**: Explain *why* this is happening in simple terms, connecting it to their lifestyle or recent strain.
4. **Actionable Advice**: Give 1-2 clear, specific things they can do *today*. Make it easy to implement.

USER DATA AVAILABLE:
{user_whoop_data}

INSTRUCTIONS:
- Be a coach, not a reporter. Don't just report the weather; tell them how to dress for it.
- If data is missing, just ask them about it naturally (e.g., "I don't see much sleep data yet—how have you been sleeping?").
- Keep it encouraging but real. If they need to rest, tell them to rest."""

    full_system_prompt = system_prompt.format(user_whoop_data=user_data_str)
    
    try:
        from groq import Groq
        
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            return "Configuration Error: GROQ_API_KEY is missing. Please check your environment settings."
            
        client = Groq(api_key=api_key)
        
        # User requested specific configuration for Zenith
        completion = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {
                    "role": "system",
                    "content": full_system_prompt
                },
                {
                    "role": "user",
                    "content": question
                }
            ],
            temperature=1,
            max_completion_tokens=8192,
            top_p=1,
            reasoning_effort="medium",
            stream=True,
            stop=None
        )
        
        # Collect stream response
        full_response = ""
        for chunk in completion:
            content = chunk.choices[0].delta.content or ""
            full_response += content
            
        return full_response

    except Exception as e:
        logger.error(f"Error calling Groq API: {e}", exc_info=True)
        return "I encountered an error while processing your request. Please try again later."


@router.post("/zenith/chat", response_model=ZenithChatResponse)
def chat(request: ZenithChatRequest, user_id: str, db: Session = Depends(get_db)):
    """
    Chat with Zenith AI Performance Coach.
    Requires user_id as query parameter for authentication.
    """
    try:
        # Validate user_id parameter
        if not user_id or not user_id.strip():
            raise HTTPException(status_code=400, detail="user_id parameter is required")
        
        # Fetch user from database
        user = db.query(User).filter(User.id == user_id).first()
        
        # Format user data for the prompt
        user_data = request.user_data or {}
        summary = user_data.get('summary') if isinstance(user_data, dict) else None
        trends = user_data.get('trends') if isinstance(user_data, dict) else None
        
        user_data_str = format_user_data_for_prompt(summary, trends, user)
        
        # Call AI service
        response_message = call_ai_api(
            prompt="",  # Not used, system prompt is in call_ai_api
            user_data_str=user_data_str,
            question=request.question
        )
        
        return ZenithChatResponse(message=response_message)
    
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except KeyError as e:
        # Handle KeyError specifically with better error message
        error_key = str(e).strip("'\"")
        logger.error(f"KeyError in Zenith chat endpoint: missing key '{error_key}'", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to process chat request: missing required data field '{error_key}'. Please try again or contact support if the issue persists."
        )
    except Exception as e:
        logger.error(f"Error in Zenith chat endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to process chat request: {str(e)}")

