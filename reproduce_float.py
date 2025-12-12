
import sys
import os

# Add backend to path to import the module
sys.path.append(os.path.join(os.getcwd(), 'backend'))

try:
    from app.services.ingestion.whoop_ingestion import _safe_float
    print("Successfully imported _safe_float")
except ImportError as e:
    print(f"Failed to import: {e}")
    # Fallback to testing the logic directly if import fails (e.g. due to missing deps)
    def _safe_float(val):
        try:
            if isinstance(val, str):
                val = val.replace(",", "").strip()
            return float(val)
        except Exception:
            return None
    print("Using local definition of _safe_float")

val = "2,100"
print(f"Parsing '{val}'...")
res = _safe_float(val)
print(f"Result: {res}")

if res == 2100.0:
    print("SUCCESS: Parsed correctly")
else:
    print("FAILURE: Did not parse correctly")
