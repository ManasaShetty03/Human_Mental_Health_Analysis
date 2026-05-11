import logging
import random

logger = logging.getLogger(__name__)

class BackupFaceAnalyzer:
    def __init__(self):
        self.initialized = False
        self.available = False
    
    def initialize(self):
        """Initialize the backup face analyzer"""
        try:
            # Simple initialization - just mark as available
            self.initialized = True
            self.available = True
            logger.info("Backup face analyzer initialized")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize backup face analyzer: {e}")
            self.available = False
            return False
    
    def is_available(self):
        """Check if the backup analyzer is available"""
        return self.available
    
    def analyze_with_fallback(self, face_data, language='en'):
        """
        Analyze face emotion with fallback logic
        Returns a simple emotion analysis result
        """
        if not self.available:
            return {
                'error': 'Backup analyzer not available',
                'emotion': 'Neutral',
                'confidence': 0.0
            }
        
        try:
            # Simple fallback analysis - return random emotion for demo
            emotions = ['Happy', 'Sad', 'Angry', 'Neutral', 'Fear']
            emotion = random.choice(emotions)
            confidence = random.uniform(0.5, 0.9)
            
            return {
                'emotion': emotion,
                'confidence': confidence,
                'mental_state': 'Stable' if emotion in ['Happy', 'Neutral'] else 'Elevated',
                'timestamp': None,
                'is_backup': True
            }
        except Exception as e:
            logger.error(f"Backup face analysis failed: {e}")
            return {
                'error': str(e),
                'emotion': 'Neutral',
                'confidence': 0.0
            }
    
    def analyze_face(self, face_data, is_base64=True, language='en'):
        """Alias for analyze_with_fallback"""
        return self.analyze_with_fallback(face_data, language)

def get_backup_face_analyzer():
    """Return an instance of the backup face analyzer"""
    return BackupFaceAnalyzer()
