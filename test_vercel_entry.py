import sys
import os

# Simulate Vercel environment
os.environ['VERCEL'] = '1'

print("Simulating Vercel entry point...")
try:
    # Add current directory to path so we can import api.index
    sys.path.insert(0, os.getcwd())
    
    import api.index
    print("Successfully imported api.index")
    
    if hasattr(api.index, 'handler'):
        print("Handler found in api.index")
    else:
        print("ERROR: Handler NOT found in api.index")
        
except Exception as e:
    print(f"ERROR: Failed to import api.index: {e}")
    import traceback
    traceback.print_exc()
