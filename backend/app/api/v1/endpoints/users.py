import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db_session import get_db
from app.models.database import User

logger = logging.getLogger(__name__)

router = APIRouter(tags=["users"])

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    age: Optional[int] = None
    nationality: Optional[str] = None
    goal: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    email: Optional[str]
    name: Optional[str]
    age: Optional[int]
    nationality: Optional[str]
    goal: Optional[str]

@router.put("/users/me", response_model=UserResponse)
def update_user_profile(
    user_update: UserUpdate,
    user_id: str,
    db: Session = Depends(get_db)
):
    """
    Update current user's profile.
    Requires user_id as query parameter for authentication.
    """
    try:
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id parameter is required")
            
        user = db.query(User).filter(User.id == user_id).first()
        
        # Create user if not found
        if not user:
            # We need an email to create a user. If not provided in update, generate a placeholder.
            email = user_update.email or f"{user_id}@placeholder.com"
            user = User(
                id=user_id,
                email=email,
                name=user_update.name,
                age=user_update.age,
                nationality=user_update.nationality,
                goal=user_update.goal
            )
            db.add(user)
        else:
            # Update fields if provided
            if user_update.name is not None:
                user.name = user_update.name
            if user_update.email is not None:
                user.email = user_update.email
            if user_update.age is not None:
                user.age = user_update.age
            if user_update.nationality is not None:
                user.nationality = user_update.nationality
            if user_update.goal is not None:
                user.goal = user_update.goal
            
        db.commit()
        db.refresh(user)
        
        return UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            age=user.age,
            nationality=user.nationality,
            goal=user.goal
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user profile: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")

@router.get("/users/me", response_model=UserResponse)
def get_user_profile(
    user_id: str,
    db: Session = Depends(get_db)
):
    """
    Get current user's profile.
    Requires user_id as query parameter for authentication.
    """
    try:
        if not user_id:
            raise HTTPException(status_code=400, detail="user_id parameter is required")
            
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        return UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            age=user.age,
            nationality=user.nationality,
            goal=user.goal
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user profile: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to fetch profile: {str(e)}")
