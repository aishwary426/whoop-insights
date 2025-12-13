from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.analysis.food_analysis import food_analysis_service
from app.services.rating.food_rating import food_rating_service
from typing import Dict, Any
import httpx

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
        
        # Rate the food
        # Prepare data for rating (matches structure expected by rate_food)
        rating_data = {
            "calories": result.get("calories", 0),
            "protein": result.get("protein", 0),
            "carbs": result.get("carbs", 0),
            "fats": result.get("fats", 0),
            "fiber": result.get("fiber", 0), # AI might not return this yet, defaults to 0
            "confidence": result.get("confidence", "medium"),
            "data_source": "ai_estimation"
        }
        
        # TODO: Get actual user goal from profile service/context. Defaulting to 'maintain' for now.
        user_goal = "maintain" 
        
        rating = food_rating_service.rate_food(rating_data, user_goal)
        result["rating"] = rating
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.get("/barcode/{barcode}", response_model=Dict[str, Any])
async def get_food_by_barcode(barcode: str):
    """
    Fetch food details from OpenFoodFacts using the barcode.
    """
    

    
    # Sanitize barcode (remove spaces, etc.)
    barcode = barcode.replace(" ", "").strip()
    
    # DEBUG: Log the barcode being requested
    try:
        with open("barcode_requests.log", "a") as f:
            f.write(f"Requested: '{barcode}'\n")
    except:
        pass
    
    url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, timeout=10.0)
            
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail="Product not found")
                
            data = response.json()
            
            # Relaxed check: Accept if status is 1 OR if valid product dictionary exists
            product = data.get('product', {})
            if data.get('status') != 1 and not product:
                # Fallback: sometimes status is 0 but product data exists (rare but happens)
                # But generally status 1 means found.
                raise HTTPException(status_code=404, detail="Product not found in OpenFoodFacts")
            
            nutriments = product.get('nutriments', {})
            
            serving_size = product.get('serving_size', '100g')
            
            # Resolve Product Name
            product_name = product.get('product_name_en') or product.get('product_name') or product.get('generic_name') or 'Unknown Product'
            
            # If the name is just digits (like the barcode), treat as unknown
            if product_name.replace(' ', '').isdigit():
                product_name = 'Unknown Product'

            # Extract basic macros
            calories = nutriments.get('energy-kcal_serving', nutriments.get('energy-kcal_100g', 0))
            protein = nutriments.get('proteins_serving', nutriments.get('proteins_100g', 0))
            carbs = nutriments.get('carbohydrates_serving', nutriments.get('carbohydrates_100g', 0))
            fats = nutriments.get('fat_serving', nutriments.get('fat_100g', 0))
            fiber = nutriments.get('fiber_serving', nutriments.get('fiber_100g', 0))
            
            # Use 100g values if serving values are missing/None/0 but 100g exists, to be safe?
            # Actually the .get(serving, .get(100g)) logic above handles priority.
            
            # Rate the food
            rating_data = {
                "calories": calories,
                "protein": protein,
                "carbs": carbs,
                "fats": fats,
                "fiber": fiber,
                "confidence": "high",
                "data_source": "barcode"
            }
            
            # TODO: Get actual user goal.
            user_goal = "maintain"
            
            rating = food_rating_service.rate_food(rating_data, user_goal)

            return {
                "description": product_name,
                "calories": calories,
                "protein": protein,
                "carbs": carbs,
                "fats": fats,
                "fiber": fiber, # Added fiber to response
                "serving_size": serving_size,
                "brand": product.get('brands', ''),
                "image_url": product.get('image_front_url', product.get('image_url', '')),
                "rating": rating
            }
            
        except HTTPException:
            raise
        except Exception as e:
            # Emergency Logging
            import traceback
            import os
            try:
                with open("backend_error.log", "a") as f:
                    f.write(f"\n--- Error for barcode {barcode} ---\n")
                    f.write(traceback.format_exc())
            except:
                pass
            print(f"Barcode lookup failed: {e}") 
            # Re-raise as 500
            raise HTTPException(status_code=500, detail=f"Barcode lookup failed: {str(e)}")

