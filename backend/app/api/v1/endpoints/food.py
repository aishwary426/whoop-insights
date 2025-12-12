from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.analysis.food_analysis import food_analysis_service
from typing import Dict, Any

router = APIRouter()

@router.post("/analyze", response_model=Dict[str, Any])
async def analyze_food(file: UploadFile = File(...)):
    """
    Upload a food image to get estimated calories and macros via AI.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    try:
        # Read file content
        contents = await file.read()
        
        # Analyze
        result = food_analysis_service.analyze_food_image(contents)
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
