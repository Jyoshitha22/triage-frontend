import sys
import os

#Add the root directory to python's module path 

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')) )

# Import the FastAPI 'app' instance from the 'main.py' file

from server.main import app