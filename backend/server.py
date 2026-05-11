from flask import Flask, jsonify, send_from_directory, send_file, request
from flask_cors import CORS
import os
from pathlib import Path
from werkzeug.utils import secure_filename
from dotenv import load_dotenv
import logging
from pymongo import MongoClient
from datetime import datetime
import base64

# Import backup voice analysis
from backup_voice_analysis import get_backup_analyzer
# Import backup text analysis
from backup_text_analysis import get_backup_text_analyzer
# Import backup face analysis
from backup_face_analysis import get_backup_face_analyzer
# Import database models
from database_models import get_database

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get API key from environment
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/mindcare')

if not GEMINI_API_KEY:
    logger.warning("GEMINI_API_KEY not found in environment variables")

# Database setup - defer connection until app starts
db = None

def create_app():
    app = Flask(__name__, static_folder=None)
    CORS(app, origins=["*"], allow_headers=["Content-Type", "Authorization"], methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
    
    # Skip backup model initialization for production deployment
    # Models will be initialized on-demand when needed
    logger.info("Skipping backup model initialization for production")
    
    # Configuration
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
    app.config['UPLOAD_FOLDER'] = 'uploads'
    
    # Ensure upload folder exists
    upload_path = Path(__file__).parent / app.config['UPLOAD_FOLDER']
    upload_path.mkdir(exist_ok=True)
    
    # API Routes
    @app.route("/", methods=["GET"])
    def root():
        return jsonify({
            "status": "ok", 
            "message": "MindCare Backend is running",
            "version": "1.0.0",
            "endpoints": {
                "health": "/api/health",
                "config": "/api/config",
                "login": "/api/login",
                "users": "/api/users"
            }
        })
    
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
        try:
            return jsonify({
                "GEMINI_API_KEY": GEMINI_API_KEY or None
            })
        except Exception as e:
            logger.error(f"Config endpoint error: {str(e)}")
            return jsonify({
                "error": "Configuration unavailable",
                "message": "Failed to load configuration"
            }), 500
    
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

    # User Management Endpoints
    @app.route('/api/users', methods=['POST'])
    def create_user():
        """Create a new user with simplified profile"""
        try:
            if not db.is_connected():
                return jsonify({'error': 'Database not connected'}), 500
            
            data = request.get_json()
            
            # Validate required fields
            required_fields = ['personal_info', 'account_info']
            for field in required_fields:
                if field not in data:
                    return jsonify({'error': f'Missing required field: {field}'}), 400
            
            personal_info = data['personal_info']
            account_info = data['account_info']
            
            # Validate personal info
            if not all(key in personal_info for key in ['name', 'email']):
                return jsonify({'error': 'Missing required personal info fields'}), 400
            
            # Check if user already exists
            if db.db.users.find_one({'personal_info.email': personal_info['email']}):
                return jsonify({'error': 'User with this email already exists'}), 400
            
            # Create user document
            user_doc = {
                'personal_info': personal_info,
                'account_info': {
                    **account_info,
                    'status': 'active',
                    'created_at': datetime.utcnow(),
                    'last_login': None,
                    'login_count': 0
                },
                'academic_info': data.get('academic_info', {}),
                'preferences': data.get('preferences', {
                    'language': 'en',
                    'theme': 'light',
                    'notifications': {'email': True, 'sms': False, 'push': True},
                    'privacy': {'share_analytics': True, 'profile_visibility': 'public'}
                }),
                'wellness_data': data.get('wellness_data', {
                    'mood_history': [],
                    'stress_level': 'moderate',
                    'counseling_sessions': 0,
                    'wellness_score': 7.5
                }),
                'emergency_contacts': data.get('emergency_contacts', []),
                'profile_image': data.get('profile_image', {}),
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            
            # Insert user
            result = db.db.users.insert_one(user_doc)
            
            return jsonify({
                'message': 'User created successfully',
                'user_id': str(result.inserted_id),
                'user': {
                    'id': str(result.inserted_id),
                    'personal_info': personal_info,
                    'account_info': {
                        'role': account_info.get('role', 'student'),
                        'status': 'active'
                    }
                }
            }), 201
            
        except Exception as e:
            logger.error(f"User creation error: {str(e)}")
            return jsonify({'error': 'User creation failed'}), 500

    @app.route('/api/login', methods=['POST'])
    def login():
        """Login user with email and password"""
        try:
            if not db.is_connected():
                return jsonify({'error': 'Database not connected'}), 500
            
            data = request.get_json()
            email = data.get('email')
            password = data.get('password')
            
            # Validate input
            if not email or not password:
                return jsonify({'error': 'Missing email or password'}), 400
            
            # Find user by email using the database connection
            user = db.db.users.find_one({'personal_info.email': email})
            if not user:
                return jsonify({'error': 'Invalid credentials'}), 401
            
            # Check password (simple comparison for now - in production use proper hashing)
            stored_password = user.get('account_info', {}).get('password_hash', '')
            if password != stored_password:
                return jsonify({'error': 'Invalid credentials'}), 401
            
            # Update last login
            db.db.users.update_one(
                {'_id': user['_id']},
                {'$set': {'account_info.last_login': datetime.utcnow()}}
            )
            
            return jsonify({
                'message': 'Login successful',
                'user': {
                    'id': str(user['_id']),
                    'personal_info': user.get('personal_info', {}),
                    'account_info': {
                        'role': user.get('account_info', {}).get('role', 'student'),
                        'status': user.get('account_info', {}).get('status', 'active')
                    }
                }
            }), 200
            
        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            return jsonify({'error': 'Login failed'}), 500

    # Backup Voice Analysis Endpoint
    @app.route('/api/backup-voice-analysis', methods=['POST'])
    def backup_voice_analysis():
        """Analyze voice using backup ML models when Gemini API is unavailable"""
        try:
            data = request.get_json()
            audio_base64 = data.get('audio_base64')
            language = data.get('language', 'en')
            user_id = data.get('user_id', 'demo_user')
            
            if not audio_base64:
                return jsonify({'error': 'No audio data provided'}), 400
            
            # Get backup analyzer
            backup_analyzer = get_backup_analyzer()
            
            if not backup_analyzer.is_available():
                return jsonify({
                    'error': 'Backup models not available',
                    'message': 'Please train the backup models first using ravdess_training.py'
                }), 503
            
            # Analyze emotion
            result = backup_analyzer.analyze_with_fallback(
                audio_base64,
                is_base64=True,
                language=language
            )
            if db.is_connected() and 'error' not in result:
                try:
                    analysis_data = {
                        'session_id': f"backup_voice_{datetime.utcnow().timestamp()}",
                        'analysis_type': 'voice',
                        'modality': 'voice',
                        'results': result,
                        'confidence': result.get('confidence', 0.0),
                        'emotion': result.get('emotion', 'Neutral'),
                        'mental_state': result.get('mental_state', 'Stable'),
                        'severity': result.get('severity', 'Low'),
                        'suggestions': result.get('suggestions', []),
                        'is_backup': True,
                        'model_used': result.get('model_used', 'CNN+BiLSTM Backup'),
                        'language': language,
                        'processing_time': 0.0,
                        'metadata': {
                            'backup_analysis': True,
                            'audio_length': len(audio_base64)
                        }
                    }
                    
                    analysis_id = db.store_analysis(user_id, analysis_data)
                    result['analysis_id'] = analysis_id
                    result['stored'] = True
                    logger.info(f"Backup voice analysis stored: {analysis_id}")
                except Exception as store_error:
                    logger.error(f"Failed to store backup voice analysis: {str(store_error)}")
                    result['stored'] = False
                    result['storage_error'] = str(store_error)
            
            return jsonify(result), 200
            
        except Exception as e:
            logger.error(f"Backup analysis error: {str(e)}")
            return jsonify({'error': 'Backup analysis failed'}), 500

    # Backup Face Analysis Endpoint
    @app.route('/api/backup-face-analysis', methods=['POST'])
    def backup_face_analysis():
        """Analyze face using backup EfficientNetB0 model when Gemini API is unavailable"""
        try:
            data = request.get_json()
            image_base64 = data.get('image_base64')
            language = data.get('language', 'en')
            user_id = data.get('user_id', 'demo_user')
            
            if not image_base64:
                return jsonify({'error': 'No image data provided'}), 400
            
            # Get backup face analyzer
            backup_analyzer = get_backup_face_analyzer()
            
            if not backup_analyzer.is_available():
                return jsonify({
                    'error': 'Backup face model not available',
                    'message': 'Please ensure the EfficientNetB0 face model is properly trained'
                }), 503
            
            # Analyze face
            result = backup_analyzer.analyze_face(image_base64, is_base64=True, language=language)
            
            # Store analysis in database
            if db.is_connected() and 'error' not in result:
                try:
                    analysis_data = {
                        'session_id': f"backup_face_{datetime.utcnow().timestamp()}",
                        'analysis_type': 'face',
                        'modality': 'face',
                        'results': result,
                        'confidence': result.get('confidence', 0.0),
                        'emotion': result.get('emotion', 'Neutral'),
                        'mental_state': result.get('mental_state', 'Stable'),
                        'severity': result.get('severity', 'Low'),
                        'suggestions': result.get('suggestions', []),
                        'is_backup': True,
                        'model_used': result.get('model_used', 'EfficientNetB0 Backup'),
                        'language': language,
                        'processing_time': 0.0,
                        'metadata': {
                            'backup_analysis': True,
                            'image_size': len(image_base64)
                        }
                    }
                    
                    analysis_id = db.store_analysis(user_id, analysis_data)
                    result['analysis_id'] = analysis_id
                    result['stored'] = True
                    logger.info(f"Backup face analysis stored: {analysis_id}")
                except Exception as store_error:
                    logger.error(f"Failed to store backup face analysis: {str(store_error)}")
                    result['stored'] = False
                    result['storage_error'] = str(store_error)
            
            return jsonify(result), 200
            
        except Exception as e:
            logger.error(f"Backup face analysis error: {str(e)}")
            return jsonify({'error': 'Backup face analysis failed'}), 500

    # Backup Text Analysis Endpoint
    @app.route('/api/backup-text-analysis', methods=['POST'])
    def backup_text_analysis():
        """Analyze text using backup RoBERTa model when Gemini API is unavailable"""
        try:
            data = request.get_json()
            text = data.get('text')
            language = data.get('language', 'en')
            user_id = data.get('user_id', 'demo_user')
            
            if not text:
                return jsonify({'error': 'No text provided'}), 400
            
            # Get backup text analyzer
            backup_analyzer = get_backup_text_analyzer()
            
            if not backup_analyzer.is_available():
                return jsonify({
                    'error': 'Backup text model not available',
                    'message': 'Please ensure the RoBERTa model is properly initialized'
                }), 503
            
            # Analyze text
            result = backup_analyzer.analyze_text(text, language)
            
            # Store analysis in database
            if db.is_connected() and 'error' not in result:
                try:
                    analysis_data = {
                        'session_id': f"backup_text_{datetime.utcnow().timestamp()}",
                        'analysis_type': 'text',
                        'modality': 'text',
                        'results': result,
                        'confidence': result.get('confidence', 0.0),
                        'emotion': result.get('emotion', 'Neutral'),
                        'mental_state': result.get('mental_state', 'Stable'),
                        'severity': result.get('severity', 'Low'),
                        'suggestions': result.get('suggestions', []),
                        'is_backup': True,
                        'model_used': result.get('model_used', 'RoBERTa Backup'),
                        'language': language,
                        'processing_time': 0.0,
                        'metadata': {
                            'backup_analysis': True,
                            'original_text_length': len(text)
                        }
                    }
                    
                    analysis_id = db.store_analysis(user_id, analysis_data)
                    result['analysis_id'] = analysis_id
                    result['stored'] = True
                    logger.info(f"Backup text analysis stored: {analysis_id}")
                except Exception as store_error:
                    logger.error(f"Failed to store backup text analysis: {str(store_error)}")
                    result['stored'] = False
                    result['storage_error'] = str(store_error)
            
            return jsonify(result), 200
            
        except Exception as e:
            logger.error(f"Backup text analysis error: {str(e)}")
            return jsonify({'error': 'Backup text analysis failed'}), 500

    # ==========================================================
    # ANALYSIS STORAGE AND HISTORY ENDPOINTS
    # ==========================================================
    
    @app.route('/api/analysis/store', methods=['POST'])
    def store_analysis():
        """Store analysis result for a user"""
        try:
            if db is None:
                return jsonify({'error': 'Database not connected'}), 500
            
            data = request.get_json()
            user_id = data.get('user_id')
            analysis_data = data.get('analysis_data')
            
            if not user_id or not analysis_data:
                return jsonify({'error': 'Missing user_id or analysis_data'}), 400
            
            # Store analysis
            analysis_id = db.store_analysis(user_id, analysis_data)
            
            return jsonify({
                'message': 'Analysis stored successfully',
                'analysis_id': analysis_id
            }), 201
            
        except Exception as e:
            logger.error(f"Store analysis error: {str(e)}")
            return jsonify({'error': 'Failed to store analysis'}), 500
    
    @app.route('/api/analysis/store-multimodal', methods=['POST'])
    def store_multimodal_analysis():
        """Store multimodal analysis result for a user"""
        try:
            if db is None:
                return jsonify({'error': 'Database not connected'}), 500
            
            data = request.get_json()
            user_id = data.get('user_id')
            multimodal_data = data.get('multimodal_data')
            
            if not user_id or not multimodal_data:
                return jsonify({'error': 'Missing user_id or multimodal_data'}), 400
            
            # Store multimodal analysis
            analysis_id = db.store_multimodal_analysis(user_id, multimodal_data)
            
            return jsonify({
                'message': 'Multimodal analysis stored successfully',
                'analysis_id': analysis_id
            }), 201
            
        except Exception as e:
            logger.error(f"Store multimodal analysis error: {str(e)}")
            return jsonify({'error': 'Failed to store multimodal analysis'}), 500
    
    @app.route('/api/user/<user_id>/history', methods=['GET'])
    def get_user_history(user_id):
        """Get analysis history for a user"""
        try:
            if db is None:
                return jsonify({'error': 'Database not connected'}), 500
            
            # Get query parameters
            limit = request.args.get('limit', 50, type=int)
            analysis_type = request.args.get('analysis_type', None)
            
            # Get user history
            history = db.get_user_history(user_id, limit, analysis_type)
            
            return jsonify({
                'user_id': user_id,
                'total_analyses': len(history),
                'history': history
            }), 200
            
        except Exception as e:
            logger.error(f"Get user history error: {str(e)}")
            return jsonify({'error': 'Failed to get user history'}), 500
    
    @app.route('/api/user/<user_id>/analysis/<analysis_id>', methods=['GET'])
    def get_user_analysis(user_id, analysis_id):
        """Get a specific analysis by ID"""
        try:
            if db is None:
                return jsonify({'error': 'Database not connected'}), 500
            
            # Get analysis
            analysis = db.get_user_analysis_by_id(user_id, analysis_id)
            
            if not analysis:
                return jsonify({'error': 'Analysis not found'}), 404
            
            return jsonify(analysis), 200
            
        except Exception as e:
            logger.error(f"Get user analysis error: {str(e)}")
            return jsonify({'error': 'Failed to get analysis'}), 500
    
    @app.route('/api/user/<user_id>/statistics', methods=['GET'])
    def get_user_statistics(user_id):
        """Get user statistics including emotion distribution and analysis counts"""
        try:
            db = get_database()
            statistics = db.get_user_statistics(user_id)
            
            if not statistics:
                return jsonify({'error': 'User not found'}), 404
                
            return jsonify(statistics)
        except Exception as e:
            logger.error(f"Error getting user statistics: {e}")
            return jsonify({'error': 'Failed to get user statistics'}), 500

    @app.route('/api/user/<user_id>/profile', methods=['GET'])
    def get_user_profile(user_id):
        """Get user profile information"""
        try:
            db = get_database()
            
            # Get user information - try email first, then user_id
            user = db.db.users.find_one({'personal_info.email': user_id})
            if not user:
                user = db.db.users.find_one({'account_info.user_id': user_id})
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            # Get user statistics
            statistics = db.get_user_statistics(user_id)
            
            # Get recent analyses for achievements calculation
            recent_analyses = list(db.db.analyses.find({'user_id': user_id}).sort('timestamp', -1).limit(50))
            
            # Calculate achievements
            achievements = []
            if len(recent_analyses) >= 1:
                achievements.append('First Analysis Complete')
            if len(recent_analyses) >= 7:
                achievements.append('Week Streak')
            if len(recent_analyses) >= 30:
                achievements.append('Month Warrior')
            
            # Check for emotion diversity
            emotions = set()
            for analysis in recent_analyses:
                if 'emotion' in analysis:
                    emotions.add(analysis['emotion'])
            if len(emotions) >= 3:
                achievements.append('Emotion Explorer')
            
            # Check for high confidence analyses
            high_confidence_count = sum(1 for analysis in recent_analyses if analysis.get('confidence', 0) > 0.8)
            if high_confidence_count >= 10:
                achievements.append('Confidence Master')
            
            # Get preferred modality
            modality_counts = {}
            for analysis in recent_analyses:
                modality = analysis.get('modality', 'unknown')
                modality_counts[modality] = modality_counts.get(modality, 0) + 1
            
            preferred_modality = max(modality_counts, key=modality_counts.get) if modality_counts else 'text'
            
            # Get last analysis date
            last_analysis = recent_analyses[0] if recent_analyses else None
            last_analysis_date = last_analysis['timestamp'] if last_analysis else None
            
            profile_data = {
                'name': user.get('personal_info', {}).get('name', 'User'),
                'email': user.get('personal_info', {}).get('email', ''),
                'joinDate': user.get('account_info', {}).get('created_at', datetime.utcnow()).isoformat(),
                'totalAnalyses': statistics.get('total_analyses', 0),
                'averageConfidence': round(statistics.get('average_confidence', 0) * 100, 1),
                'preferredModality': preferred_modality,
                'lastAnalysis': last_analysis_date,
                'achievements': achievements,
                'emotionDistribution': statistics.get('emotion_distribution', {}),
                'recentActivity': [
                    {
                        'timestamp': analysis.get('timestamp'),
                        'emotion': analysis.get('emotion'),
                        'confidence': analysis.get('confidence'),
                        'modality': analysis.get('modality')
                    }
                    for analysis in recent_analyses[:5]
                ]
            }
            
            return jsonify(profile_data)
        except Exception as e:
            logger.error(f"Error getting user profile: {e}")
            return jsonify({'error': 'Failed to get user profile'}), 500

    @app.route('/api/user/<user_id>/profile', methods=['PUT'])
    def update_user_profile(user_id):
        """Update user profile information"""
        try:
            db = get_database()
            data = request.get_json()
            
            # Validate input
            if not data:
                return jsonify({'error': 'No data provided'}), 400
            
            # Update user profile
            update_data = {}
            if 'name' in data:
                update_data['personal_info.name'] = data['name']
            if 'email' in data:
                update_data['personal_info.email'] = data['email']
            
            if not update_data:
                return jsonify({'error': 'No valid fields to update'}), 400
            
            # Try to find user by email first, then by user_id
            user_filter = {'personal_info.email': user_id}
            if not db.db.users.find_one(user_filter):
                user_filter = {'account_info.user_id': user_id}
            
            result = db.db.users.update_one(
                user_filter,
                {'$set': update_data}
            )
            
            if result.matched_count == 0:
                return jsonify({'error': 'User not found'}), 404
            
            return jsonify({'message': 'Profile updated successfully'})
        except Exception as e:
            logger.error(f"Error updating user profile: {e}")
            return jsonify({'error': 'Failed to update profile'}), 500
    
    @app.route('/api/session/create', methods=['POST'])
    def create_session():
        """Create a new analysis session"""
        try:
            if db is None:
                return jsonify({'error': 'Database not connected'}), 500
            
            data = request.get_json()
            user_id = data.get('user_id')
            session_data = data.get('session_data', {})
            
            if not user_id:
                return jsonify({'error': 'Missing user_id'}), 400
            
            # Create session
            session_id = db.create_session(user_id, session_data)
            
            return jsonify({
                'message': 'Session created successfully',
                'session_id': session_id
            }), 201
            
        except Exception as e:
            logger.error(f"Create session error: {str(e)}")
            return jsonify({'error': 'Failed to create session'}), 500
    
    @app.route('/api/session/<session_id>/update', methods=['PUT'])
    def update_session(session_id):
        """Update session data"""
        try:
            if db is None:
                return jsonify({'error': 'Database not connected'}), 500
            
            data = request.get_json()
            update_data = data.get('update_data', {})
            
            if not update_data:
                return jsonify({'error': 'Missing update_data'}), 400
            
            # Update session
            success = db.update_session(session_id, update_data)
            
            if success:
                return jsonify({'message': 'Session updated successfully'}), 200
            else:
                return jsonify({'error': 'Session not found or no changes made'}), 404
            
        except Exception as e:
            logger.error(f"Update session error: {str(e)}")
            return jsonify({'error': 'Failed to update session'}), 500

    # Backup Model Status Endpoint
    @app.route('/api/backup-model-status', methods=['GET'])
    def backup_model_status():
        """Get status of backup voice, text, and face analysis models"""
        try:
            # Get voice model status
            voice_analyzer = get_backup_analyzer()
            voice_info = voice_analyzer.get_model_info()
            
            # Get text model status
            text_analyzer = get_backup_text_analyzer()
            text_info = text_analyzer.get_model_info()
            
            # Get face model status
            face_analyzer = get_backup_face_analyzer()
            face_info = face_analyzer.get_model_info()
            
            return jsonify({
                'voice_analysis': {
                    'available': voice_analyzer.is_available(),
                    'model_info': voice_info
                },
                'text_analysis': {
                    'available': text_analyzer.is_available(),
                    'model_info': text_info
                },
                'face_analysis': {
                    'available': face_analyzer.is_available(),
                    'model_info': face_info
                }
            }), 200
            
        except Exception as e:
            logger.error(f"Backup model status error: {str(e)}")
            return jsonify({'error': 'Failed to get model status'}), 500

    @app.route('/api/users/<user_id>', methods=['GET'])
    def get_user(user_id):
        """Get user by ID"""
        try:
            if db is None:
                return jsonify({'error': 'Database not connected'}), 500
            
            user = db.users.find_one({'_id': ObjectId(user_id)})
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            # Convert ObjectId to string and remove sensitive data
            user['_id'] = str(user['_id'])
            if 'account_info' in user and 'password_hash' in user['account_info']:
                del user['account_info']['password_hash']
            
            return jsonify({'user': user}), 200
            
        except Exception as e:
            logger.error(f"User retrieval error: {str(e)}")
            return jsonify({'error': 'User retrieval failed'}), 500

    @app.route('/api/users/<user_id>', methods=['PUT'])
    def update_user(user_id):
        """Update user profile"""
        try:
            if db is None:
                return jsonify({'error': 'Database not connected'}), 500
            
            data = request.get_json()
            
            # Add updated timestamp
            data['updated_at'] = datetime.utcnow()
            
            result = db.users.update_one(
                {'_id': ObjectId(user_id)},
                {'$set': data}
            )
            
            if result.matched_count == 0:
                return jsonify({'error': 'User not found'}), 404
            
            return jsonify({'message': 'User updated successfully'}), 200
            
        except Exception as e:
            logger.error(f"User update error: {str(e)}")
            return jsonify({'error': 'User update failed'}), 500

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
    
    logger.info(f"Starting MindCare Backend on {HOST}:{PORT}")
    app.run(host=HOST, port=PORT, debug=False)

if __name__ == "__main__":
    start_server()
