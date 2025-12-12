import json
import os
import base64
import io
from typing import Dict, Any
from groq import Groq
from PIL import Image
import logging
import re

# Configure debug logging
logging.basicConfig(filename='ai_debug.log', level=logging.INFO, format='%(asctime)s - %(message)s')

class FoodAnalysisService:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        logging.info(f"Initializing FoodAnalysisService with Groq. API Key present: {bool(self.api_key)}")
        
        if not self.api_key:
            print("⚠️ Warning: GROQ_API_KEY not found. AI features will fail.")
            logging.error("GROQ_API_KEY not found in environment.")
            self.client = None
        else:
            try:
                self.client = Groq(api_key=self.api_key)
                self.model = "meta-llama/llama-4-maverick-17b-128e-instruct"
                logging.info(f"Groq configured successfully with {self.model}")
            except Exception as e:
                logging.error(f"Failed to configure Groq: {e}")
                self.client = None

    def analyze_food_image(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Analyze a food image using Groq Llama 4 to estimate calories and macros.
        """
        logging.info(f"Received image for analysis. Size: {len(image_bytes)} bytes")
        
        if not self.client:
            return {
                "calories": 0,
                "protein": 0,
                "carbs": 0,
                "fats": 0,
                "description": "Error: Groq API Key Missing",
                "confidence": 0.0
            }

        try:
            # Convert bytes to base64 data URL
            # First ensure it's a valid image using PIL (and potentially resize if huge)
            image = Image.open(io.BytesIO(image_bytes))
            logging.info(f"Image opened successfully. Format: {image.format}, Size: {image.size}")
            
            # Convert to RGB to ensure compatibility (e.g. if RGBA)
            if image.mode != 'RGB':
                image = image.convert('RGB')
                
            buffered = io.BytesIO()
            image.save(buffered, format="JPEG")
            base64_image = base64.b64encode(buffered.getvalue()).decode('utf-8')
            data_url = f"data:image/jpeg;base64,{base64_image}"

            prompt = """
            You are an expert nutritionist. Analyze this food image and provide a highly accurate nutritional estimate.
            
            First, identify every ingredient and its approximate portion size.
            Then, calculate the macros for each component and sum them up.
            
            Return ONLY a valid JSON object with the final totals and a concise description. 
            Do NOT include markdown formatting (like ```json ... ```) or any reasoning text in the output. Just the raw JSON string.
            
            Required JSON Structure:
            {
                "calories": <total_calories_int>,
                "protein": <total_protein_grams_int>,
                "carbs": <total_carbs_grams_int>,
                "fats": <total_fats_grams_int>,
                "description": "<short_summary_description>"
            }
            
            If the image is not food, return {"calories": 0, "description": "Not food detected"}.
            """

            logging.info(f"Sending request to Groq model: {self.model}")
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": data_url,
                                },
                            },
                        ],
                    }
                ],
                model=self.model,
                temperature=0.1, # Low temperature for more deterministic/structured output
            )
            
            logging.info("Groq response received.")
            result_text = chat_completion.choices[0].message.content
            
            # Clean up potential markdown code blocks if the model ignores the instruction
            result_text = result_text.replace("```json", "").replace("```", "").strip()
            
            logging.info(f"Raw Response: {result_text}")
            
            try:
                data = json.loads(result_text)
                return {
                    "calories": data.get("calories", 0),
                    "protein": data.get("protein", 0),
                    "carbs": data.get("carbs", 0),
                    "fats": data.get("fats", 0),
                    "description": data.get("description", "Analyzed food item"),
                    "confidence": 0.95 
                }
            except json.JSONDecodeError:
                logging.error(f"JSON Decode Error: {result_text}")
                # Attempt to extract JSON if it's embedded in text
                try:
                    json_match = re.search(r'(\{.*\})', result_text, re.DOTALL)
                    if json_match:
                        data = json.loads(json_match.group(1))
                        return {
                            "calories": data.get("calories", 0),
                            "protein": data.get("protein", 0),
                            "carbs": data.get("carbs", 0),
                            "fats": data.get("fats", 0),
                            "description": data.get("description", "Analyzed food item"),
                            "confidence": 0.90
                        }
                except:
                    pass
                    
                return {
                    "calories": 0,
                    "description": "Analysis failed: Invalid JSON from AI",
                    "error": "json_error"
                }

        except Exception as e:
            logging.error(f"Exception during analysis: {str(e)}")
            print(f"Error calling Groq API: {e}")
            
            return {
                "calories": 0,
                "description": f"Error: {str(e)}", 
                "error": str(e)
            }

food_analysis_service = FoodAnalysisService()
