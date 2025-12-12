import os
import google.generativeai as genai
from dotenv import load_dotenv
from PIL import Image
import io

load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")
print(f"API Key found: {api_key[:5]}..." if api_key else "API Key NOT found")

if not api_key:
    print("❌ Error: GOOGLE_API_KEY not found in environment.")
    exit(1)

try:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')
    print("✅ Model configured: gemini-1.5-flash")

    # Generate a small red 10x10 image for testing
    img = Image.new('RGB', (10, 10), color='red')
    
    print("Sending request to Gemini...")
    response = model.generate_content(["What color is this image?", img])
    
    print("✅ Success! Response:")
    print(response.text)

except Exception as e:
    print(f"❌ FAILED: {e}")
