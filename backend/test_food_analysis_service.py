
from app.services.analysis.food_analysis import FoodAnalysisService
from PIL import Image
import io
import logging
from dotenv import load_dotenv

load_dotenv()

# Setup simple logging to see output
logging.basicConfig(level=logging.INFO)

def test_service():
    print("Initializing Food Analysis Service...")
    service = FoodAnalysisService()
    
    # Create a test image (red square)
    img = Image.new('RGB', (100, 100), color='red')
    buffered = io.BytesIO()
    img.save(buffered, format="JPEG")
    image_bytes = buffered.getvalue()
    
    print("Calling analyze_food_image...")
    result = service.analyze_food_image(image_bytes)
    print("Result:", result)

if __name__ == "__main__":
    test_service()
