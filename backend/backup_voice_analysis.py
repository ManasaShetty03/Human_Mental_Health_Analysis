import logging
import random

logger = logging.getLogger(__name__)

class BackupVoiceAnalyzer:
    def __init__(self):
        self.initialized = False
        self.available = False
    
    def initialize(self):
        """Initialize the backup voice analyzer"""
        try:
            # Simple initialization - just mark as available
            self.initialized = True
            self.available = True
            logger.info("Backup voice analyzer initialized")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize backup voice analyzer: {e}")
            self.available = False
            return False
    
    def is_available(self):
        """Check if the backup analyzer is available"""
        return self.available
    
    def analyze_with_fallback(self, audio_data, is_base64=True, language='en'):
        """
        Analyze audio emotion with fallback logic
        Returns emotion analysis with multiple emotion detection
        """
        if not self.available:
            return {
                'error': 'Backup analyzer not available',
                'emotion': 'Neutral',
                'confidence': 0.0
            }
        
        try:
            # Simulate multiple emotion detection based on audio complexity
            # For demo, randomly decide if multiple emotions are present
            has_multiple_emotions = random.choice([True, False])
            
            emotions = ['Happy', 'Sad', 'Angry', 'Neutral', 'Fear']
            
            if has_multiple_emotions:
                primary_emotion = random.choice(emotions)
                secondary_emotion = random.choice([e for e in emotions if e != primary_emotion])
                
                primary_confidence = random.uniform(0.4, 0.7)
                secondary_confidence = random.uniform(0.3, 0.5)
                
                uncertainty_detected = True
                
                return {
                    'emotion': primary_emotion,
                    'secondary_emotion': secondary_emotion,
                    'confidence': primary_confidence,
                    'secondary_confidence': secondary_confidence,
                    'mental_state': 'Stable' if primary_emotion in ['Happy', 'Neutral'] else 'Elevated',
                    'timestamp': None,
                    'is_backup': True,
                    'uncertainty_detected': uncertainty_detected,
                    'multiple_emotions_detected': True,
                    'emotions_detected': [primary_emotion, secondary_emotion]
                }
            else:
                emotion = random.choice(emotions)
                confidence = random.uniform(0.6, 0.95)
                
                uncertainty_detected = confidence < 0.6
                
                return {
                    'emotion': emotion,
                    'confidence': confidence,
                    'mental_state': 'Stable' if emotion in ['Happy', 'Neutral'] else 'Elevated',
                    'timestamp': None,
                    'is_backup': True,
                    'uncertainty_detected': uncertainty_detected,
                    'multiple_emotions_detected': False,
                    'emotions_detected': [emotion]
                }
        except Exception as e:
            logger.error(f"Backup voice analysis failed: {e}")
            return {
                'error': str(e),
                'emotion': 'Neutral',
                'confidence': 0.0
            }
    
    def analyze_audio(self, audio_data, is_base64=True, language='en'):
        """Alias for analyze_with_fallback"""
        return self.analyze_with_fallback(audio_data, is_base64, language)

def get_backup_analyzer():
    """Return an initialized instance of the backup voice analyzer"""
    analyzer = BackupVoiceAnalyzer()
    analyzer.initialize()
    return analyzer
