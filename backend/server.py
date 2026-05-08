from flask import Flask, jsonify, send_from_directory, send_file, request
from flask_cors import CORS
import os
from pathlib import Path
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get API key from environment
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    logger.warning("GEMINI_API_KEY not found in environment variables")

def create_app():
    app = Flask(__name__, static_folder=None)
    CORS(app)
    
    # Configuration
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
    app.config['UPLOAD_FOLDER'] = 'uploads'
    
    # Ensure upload folder exists
    upload_path = Path(__file__).parent / app.config['UPLOAD_FOLDER']
    upload_path.mkdir(exist_ok=True)
    
    # API Routes
    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "ok", 
            "message": "MindCare Backend is running",
            "version": "1.0.0"
        })
    
    @app.route("/api/config", methods=["GET"])
    def get_config():
        """Provide frontend configuration including API keys"""
        return jsonify({
            "GEMINI_API_KEY": GEMINI_API_KEY
        })
    
    @app.route("/api/upload", methods=["POST"])
    def upload_file():
        """Handle file uploads"""
        try:
            if 'file' not in request.files:
                return jsonify({"error": "No file provided"}), 400
            
            file = request.files['file']
            if file.filename == '':
                return jsonify({"error": "No file selected"}), 400
            
            if file:
                filename = secure_filename(file.filename)
                file_path = upload_path / filename
                file.save(str(file_path))
                
                return jsonify({
                    "message": "File uploaded successfully",
                    "filename": filename,
                    "path": str(file_path)
                })
        except Exception as e:
            logger.error(f"Upload error: {str(e)}")
            return jsonify({"error": "Upload failed"}), 500
    
    @app.route("/api/analyze", methods=["POST"])
    def analyze_data():
        """Handle data analysis requests"""
        try:
            data = request.get_json()
            if not data:
                return jsonify({"error": "No data provided"}), 400
            
            # Placeholder for analysis logic
            return jsonify({
                "message": "Analysis completed",
                "result": "Analysis placeholder"
            })
        except Exception as e:
            logger.error(f"Analysis error: {str(e)}")
            return jsonify({"error": "Analysis failed"}), 500
    
    # Determine frontend dist path
    current_dir = Path(__file__).parent
    frontend_dist_path = current_dir.parent / "frontend" / "dist"
    
    # Serve frontend static files
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend(path):
        try:
            if path and (frontend_dist_path / path).exists():
                return send_from_directory(frontend_dist_path, path)
            else:
                return send_file(frontend_dist_path / "index.html")
        except FileNotFoundError:
            return jsonify({"error": "Frontend not built"}), 404
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Endpoint not found"}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({"error": "Internal server error"}), 500
    
    return app

def start_server():
    app = create_app()
    PORT = int(os.getenv('PORT', 3000))
    HOST = os.getenv('HOST', '0.0.0.0')
    
    # Disable debug mode in production
    debug_mode = os.getenv('FLASK_ENV') == 'development'
    
    logger.info(f"Starting MindCare Backend on {HOST}:{PORT}")
    app.run(host=HOST, port=PORT, debug=debug_mode)

# Create WSGI app for Gunicorn - this must be at module level
app = create_app()

if __name__ == "__main__":
    start_server()
