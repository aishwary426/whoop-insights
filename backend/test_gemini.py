import os
import io
import google.generativeai as genai
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")
print(f"API Key found: {api_key[:5]}..." if api_key else "API Key NOT found")

if api_key:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')

    # Create a small blank image (10x10 white)
    img = Image.new('RGB', (10, 10), color='white')
    
    try:
        print("Sending request to Gemini...")
        response = model.generate_content(["Describe this image in 5 words", img])
        print("Success!")
        print(response.text)
    except Exception as e:
        print(f"FAILED: {e}")
