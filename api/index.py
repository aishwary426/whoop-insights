import os
import sys

# Add backend to python path
sys.path.append(os.path.join(os.path.dirname(__file__), '../backend'))

from app.main import app
