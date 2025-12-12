import os
import base64
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")
print(f"API Key found: {api_key[:5]}..." if api_key else "API Key NOT found")

client = Groq(api_key=api_key)
model = "meta-llama/llama-4-maverick-17b-128e-instruct"

# Small 1x1 white pixel jpeg
import io
from PIL import Image

# Generate a small red 10x10 image
img = Image.new('RGB', (10, 10), color='red')
buffered = io.BytesIO()
img.save(buffered, format="JPEG")
image_data = base64.b64encode(buffered.getvalue()).decode('utf-8')
print(f"Generated base64 image data (len={len(image_data)})")

try:
    print(f"Sending request to Groq with model {model}...")
    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "What color is this image?"},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{image_data}",
                        },
                    },
                ],
            }
        ],
        model=model,
    )
    print("Success!")
    print(chat_completion.choices[0].message.content)
except Exception as e:
    print(f"FAILED: {e}")
