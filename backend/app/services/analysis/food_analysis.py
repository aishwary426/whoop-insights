import json
import os
import base64
from typing import Dict, Any
import logging
import re

# Configure logging to stdout for Railway visibility
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(message)s')
logger = logging.getLogger(__name__)

class FoodAnalysisService:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        logger.info(f"Initializing FoodAnalysisService with Groq. API Key present: {bool(self.api_key)}")
        print(f"[FoodAnalysis] GROQ_API_KEY present: {bool(self.api_key)}")
        
        if not self.api_key:
            print("⚠️ Warning: GROQ_API_KEY not found. AI features will fail.")
            logger.error("GROQ_API_KEY not found in environment.")
            self.client = None
        else:
            try:
                from groq import Groq
                self.client = Groq(api_key=self.api_key)
                logger.info("Groq client configured successfully")
                print("[FoodAnalysis] Groq client configured successfully")
            except Exception as e:
                logger.error(f"Failed to configure Groq: {e}")
                print(f"[FoodAnalysis] Failed to configure Groq: {e}")
                self.client = None

    def analyze_food_image(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Analyze a food image using Groq (Llama 4 Maverick) to estimate calories and macros.
        """
        logger.info(f"Received image for analysis. Size: {len(image_bytes)} bytes")
        print(f"[FoodAnalysis] Received image for analysis. Size: {len(image_bytes)} bytes")
        
        if not self.client:
            logger.error("No Groq client available")
            print("[FoodAnalysis] ERROR: No Groq client available - GROQ_API_KEY likely missing")
            return {
                "calories": 0,
                "protein": 0,
                "carbs": 0,
                "fats": 0,
                "description": "Error: Groq API Key Missing",
                "confidence": 0.0
            }

        try:
            # Encode image to base64
            base64_image = base64.b64encode(image_bytes).decode('utf-8')
            
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
                "fiber": <total_fiber_grams_int>,
                "description": "<short_summary_description>"
            }
            
            If the image is not food, return {"calories": 0, "description": "Not food detected"}.
            """

            model_name = "meta-llama/llama-4-maverick-17b-128e-instruct"
            logger.info(f"Sending request to Groq with model: {model_name}")
            print(f"[FoodAnalysis] Sending request to Groq with model: {model_name}")
            
            # Generate content with Groq - NON-STREAMING for simpler handling
            completion = self.client.chat.completions.create(
                model=model_name,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}}
                        ]
                    }
                ],
                temperature=0.7,
                max_completion_tokens=1024,
                top_p=1,
                stream=False  # Changed to non-streaming for simpler handling
            )
            
            result_text = completion.choices[0].message.content
            
            logger.info(f"Groq response received. Length: {len(result_text)} chars")
            print(f"[FoodAnalysis] Groq response received. Length: {len(result_text)} chars")
            
            # Clean up potential markdown code blocks
            result_text = result_text.replace("```json", "").replace("```", "").strip()
            
            logger.info(f"Raw Response: {result_text[:500]}")  # Log first 500 chars
            print(f"[FoodAnalysis] Raw Response: {result_text[:200]}")  # Print first 200 chars
            
            try:
                data = json.loads(result_text)
                result = {
                    "calories": data.get("calories", 0),
                    "protein": data.get("protein", 0),
                    "carbs": data.get("carbs", 0),
                    "fats": data.get("fats", 0),
                    "fiber": data.get("fiber", 0),
                    "description": data.get("description", "Analyzed food item"),
                    "confidence": 0.95 
                }
                logger.info(f"Analysis successful: {result['calories']} kcal")
                print(f"[FoodAnalysis] Analysis successful: {result['calories']} kcal - {result['description']}")
                return result
                
            except json.JSONDecodeError as je:
                logger.error(f"JSON Decode Error: {je}")
                print(f"[FoodAnalysis] JSON Decode Error: {je}")
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
                            "fiber": data.get("fiber", 0),
                            "description": data.get("description", "Analyzed food item"),
                            "confidence": 0.90
                        }
                except Exception as extract_err:
                    logger.error(f"JSON extraction failed: {extract_err}")
                    
                return {
                    "calories": 0,
                    "protein": 0,
                    "carbs": 0,
                    "fats": 0,
                    "description": "Analysis failed: Invalid JSON from AI",
                    "error": "json_error"
                }

        except Exception as e:
            error_msg = str(e)
            logger.error(f"Exception during analysis: {error_msg}")
            print(f"[FoodAnalysis] Exception during analysis: {error_msg}")
            
            return {
                "calories": 0,
                "protein": 0,
                "carbs": 0,
                "fats": 0,
                "description": f"Error: {error_msg}", 
                "error": error_msg
            }

food_analysis_service = FoodAnalysisService()
