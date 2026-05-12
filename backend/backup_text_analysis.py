import logging
import random

logger = logging.getLogger(__name__)

class BackupTextAnalyzer:
    def __init__(self):
        self.initialized = False
        self.available = False
    
    def initialize(self):
        """Initialize the backup text analyzer"""
        try:
            # Simple initialization - just mark as available
            self.initialized = True
            self.available = True
            logger.info("Backup text analyzer initialized")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize backup text analyzer: {e}")
            self.available = False
            return False
    
    def is_available(self):
        """Check if the backup analyzer is available"""
        return self.available
    
    def analyze_with_fallback(self, text_data, language='en'):
        """
        Analyze text emotion with fallback logic
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
            logger.error(f"Backup text analysis failed: {e}")
            return {
                'error': str(e),
                'emotion': 'Neutral',
                'confidence': 0.0
            }
    
    def analyze_text(self, text_data, language='en'):
        """Alias for analyze_with_fallback"""
        return self.analyze_with_fallback(text_data, language)

def get_backup_text_analyzer():
    """Return an initialized instance of the backup text analyzer"""
    analyzer = BackupTextAnalyzer()
    analyzer.initialize()
    return analyzer
