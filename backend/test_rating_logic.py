import sys
import os

# Adjust path to import backend modules
sys.path.append(os.path.abspath("/Users/aishwary/Downloads/zenith/backend"))

from app.services.rating.food_rating import food_rating_service

def test_rating():
    print("--- Testing FoodRatingService ---\n")
    
    # Case 1: High Protein (Chicken Breast)
    chicken = {
        "calories": 165,
        "protein": 31,
        "carbs": 0,
        "fats": 3.6,
        "fiber": 0
    }
    rating_chicken = food_rating_service.rate_food(chicken, "cutting")
    print(f"Chicken Breast (Cutting): {rating_chicken['grade']} ({rating_chicken['overall_score']})")
    print(f"  Macro Verdict: {rating_chicken['breakdown']['macro_profile']['verdict']}")
    print(f"  Efficiency Verdict: {rating_chicken['breakdown']['caloric_efficiency']['verdict']}")
    print("")

    # Case 2: Junk Food (Donut)
    donut = {
        "calories": 450,
        "protein": 4,
        "carbs": 51,
        "fats": 25,
        "fiber": 1
    }
    rating_donut = food_rating_service.rate_food(donut, "cutting")
    print(f"Donut (Cutting): {rating_donut['grade']} ({rating_donut['overall_score']})")
    print(f"  Macro Verdict: {rating_donut['breakdown']['macro_profile']['verdict']}")
    print(f"  Efficiency Verdict: {rating_donut['breakdown']['caloric_efficiency']['verdict']}")
    print("")

    # Case 3: Balanced (Salmon and Rice)
    meal = {
        "calories": 500,
        "protein": 30,
        "carbs": 45,
        "fats": 20,
        "fiber": 5
    }
    rating_meal = food_rating_service.rate_food(meal, "maintain")
    print(f"Salmon & Rice (Maintain): {rating_meal['grade']} ({rating_meal['overall_score']})")
    print(f"  Macro Verdict: {rating_meal['breakdown']['macro_profile']['verdict']}")
    print(f"  Efficiency Verdict: {rating_meal['breakdown']['caloric_efficiency']['verdict']}")

if __name__ == "__main__":
    test_rating()
