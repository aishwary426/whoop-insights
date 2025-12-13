from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.analysis.food_analysis import food_analysis_service
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

            return {
                "description": product_name,
                "calories": nutriments.get('energy-kcal_serving', nutriments.get('energy-kcal_100g', 0)),
                "protein": nutriments.get('proteins_serving', nutriments.get('proteins_100g', 0)),
                "carbs": nutriments.get('carbohydrates_serving', nutriments.get('carbohydrates_100g', 0)),
                "fats": nutriments.get('fat_serving', nutriments.get('fat_100g', 0)),
                "serving_size": serving_size,
                "brand": product.get('brands', ''),
                "image_url": product.get('image_front_url', product.get('image_url', ''))
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

