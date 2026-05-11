import sys
from pathlib import Path

# Add backend directory to Python path
backend_dir = Path(__file__).parent / 'backend'
sys.path.insert(0, str(backend_dir))

# Import and start the backend server
from server import start_server

if __name__ == "__main__":
    start_server()
