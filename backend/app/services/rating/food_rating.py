from typing import Dict, Any, List

class FoodRatingService:
    def calculate_macro_score(self, calories: float, protein: float, carbs: float, fat: float, goal: str = "maintain") -> Dict[str, Any]:
        """
        Calculate Macro Profile Score (0-100)
        """
        if calories <= 0:
            return {
                "score": 0,
                "category": "Invalid",
                "protein_pct": 0,
                "carb_pct": 0,
                "fat_pct": 0,
                "verdict": "Invalid calorie count"
            }

        # Calculate percentages
        protein_cal = protein * 4
        carbs_cal = carbs * 4
        fat_cal = fat * 9
        
        protein_pct = (protein_cal / calories) * 100
        carb_pct = (carbs_cal / calories) * 100
        fat_pct = (fat_cal / calories) * 100
        
        # Classification
        category = "Balanced"
        score = 75  # Base score
        verdict = "Balanced macro profile"
        
        if protein_pct > 30:
            category = "Protein-Dominant"
            verdict = "High protein content"
            score = 90
        elif carb_pct > 60 and protein_pct < 20:
            category = "Carb-Heavy"
            verdict = "High carbohydrate content"
            score = 60
        elif fat_pct > 40:
            category = "Fat-Heavy"
            verdict = "High fat content"
            score = 60
        elif protein_pct < 10 and (calories / 1.0) > 400: # Assuming 100g basis for call, but simplified here
             # Note: 'Empty Calories' usually implies low nutrient density. 
             # Implementation here is simplified based on macro ratios.
             category = "Empty Calories" 
             verdict = "Low protein, likely high sugar/fat"
             score = 40
        else:
            # Balanced: 20-30% protein, <35% fat
            if 20 <= protein_pct <= 30 and fat_pct < 35:
                category = "Balanced"
                score = 85

        # Goal Alignment
        if goal == "cutting":
            if category == "Protein-Dominant":
                score *= 1.2
            elif category == "Empty Calories":
                score *= 0.6
        elif goal == "bulking":
             if category == "Balanced" and calories > 200: # Simple check for calorie density proxy
                score *= 1.1
        
        return {
            "score": min(100, max(0, int(score))),
            "category": category,
            "protein_pct": round(protein_pct, 1),
            "carb_pct": round(carb_pct, 1),
            "fat_pct": round(fat_pct, 1),
            "verdict": verdict
        }

    def calculate_caloric_efficiency(self, calories: float, protein: float, fiber: float) -> Dict[str, Any]:
        """
        Calculate Caloric Efficiency Score (0-100)
        Formula: nutrient_density = (protein_g * 4 + fiber_g * 2) / calories
        """
        if calories <= 0:
             return {
                "score": 0,
                "nutrient_density": 0,
                "verdict": "Invalid calorie count"
            }
            
        nutrient_density = (protein * 4 + fiber * 2) / calories
        
        score = 0
        verdict = "Poor efficiency"
        
        if nutrient_density > 0.30:
            score = 98 # 95-100
            verdict = "Excellent (Lean protein/Veg)"
        elif nutrient_density >= 0.20:
            score = 88 # 80-94
            verdict = "Very Good (Whole grains/Legumes)"
        elif nutrient_density >= 0.10:
            score = 70 # 60-79
            verdict = "Moderate (Mixed dishes)"
        elif nutrient_density >= 0.05:
            score = 50 # 40-59
            verdict = "Low (Processed snacks)"
        else:
            score = 20 # 0-39
            verdict = "Very Low (Sugar/Fats)"
            
        return {
            "score": score,
            "nutrient_density": round(nutrient_density, 3),
            "verdict": verdict
        }

    def rate_food(self, food_data: Dict[str, Any], user_goal: str = "maintain") -> Dict[str, Any]:
        """
        Main entry point to rate a food item.
        Expects food_data to contain: calories, protein, carbs, fats, fiber (optional)
        """
        calories = food_data.get("calories", 0)
        protein = food_data.get("protein", 0)
        carbs = food_data.get("carbs", 0)
        fats = food_data.get("fats", 0)
        fiber = food_data.get("fiber", 0) # Default to 0 if not present (common in Phase 1)
        
        # 1. Macro Score
        macro_score = self.calculate_macro_score(calories, protein, carbs, fats, user_goal)
        
        # 2. Caloric Efficiency
        efficiency_score = self.calculate_caloric_efficiency(calories, protein, fiber)
        
        # Overall Score Calculation (Phase 1 Simplified)
        # Weights: Macro (60%), Efficiency (40%) - Temporary until other components exist
        overall_score = (macro_score["score"] * 0.6) + (efficiency_score["score"] * 0.4)
        
        # Grade Conversion
        grade = "C"
        if overall_score >= 90: grade = "A+"
        elif overall_score >= 85: grade = "A"
        elif overall_score >= 80: grade = "A-"
        elif overall_score >= 75: grade = "B+"
        elif overall_score >= 70: grade = "B"
        elif overall_score >= 65: grade = "B-"
        elif overall_score >= 60: grade = "C+"
        elif overall_score >= 55: grade = "C"
        elif overall_score >= 50: grade = "C-"
        else: grade = "D"
        
        return {
            "overall_score": int(overall_score),
            "grade": grade,
            "confidence": food_data.get("confidence", "high"), # Pass through or default
            "data_source": food_data.get("data_source", "unknown"),
            
            "breakdown": {
                "macro_profile": macro_score,
                "caloric_efficiency": efficiency_score,
                # Placeholders for future phases
                "satiety_index": {"score": 0, "verdict": "Coming soon"}, 
                "processing_level": {"score": 0, "verdict": "Coming soon"},
                "health_score": {"score": 0, "verdict": "Coming soon"}
            }
        }

food_rating_service = FoodRatingService()
