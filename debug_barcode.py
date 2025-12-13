import sys
import asyncio
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

# Mock FastAPI dependencies if needed, but get_food_by_barcode only uses httpx
try:
    from app.api.v1.endpoints.food import get_food_by_barcode
except ImportError as e:
    print(f"Import failed: {e}")
    sys.exit(1)

async def main():
    barcodes = ["8908024977211", "8 908024 977211"]
    
    for b in barcodes:
        print(f"\n--- Testing barcode: '{b}' ---")
        try:
            res = await get_food_by_barcode(b)
            print("Success:", res)
        except Exception as e:
            print(f"Error processing '{b}': {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
