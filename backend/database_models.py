#!/usr/bin/env python3
"""
Database Models for MindCare Application
Stores user analysis results and history
Updated for MongoDB URI environment variable support
"""

from datetime import datetime
from typing import Dict, List, Optional, Any
from pymongo import MongoClient
from bson import ObjectId
import logging
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

class AnalysisDatabase:
    """Database handler for storing and retrieving analysis results"""
    
    def __init__(self, mongodb_uri: str = None):
        self.mongodb_uri = mongodb_uri or os.getenv('MONGODB_URI', 'mongodb://localhost:27017/mindcare')
        self.client = None
        self.db = None
        self.connect()
    
    def connect(self) -> bool:
        """Connect to MongoDB"""
        try:
            # Try different SSL configurations
            if "mongodb+srv://" in self.mongodb_uri:
                # Try with explicit SSL settings
                self.client = MongoClient(
                    self.mongodb_uri,
                    ssl=True,
                    ssl_cert_reqs='CERT_NONE',
                    tlsAllowInvalidHostnames=True,
                    tlsAllowInvalidCertificates=True,
                    connectTimeoutMS=30000,
                    socketTimeoutMS=30000
                )
            else:
                self.client = MongoClient(self.mongodb_uri)
            
            self.db = self.client.mindcare
            
            # Test connection
            self.client.admin.command('ping')
            logger.info("✅ Connected to MongoDB successfully")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to connect to MongoDB: {str(e)}")
            # Fallback to local database for development
            try:
                self.client = MongoClient('mongodb://localhost:27017/mindcare')
                self.db = self.client.mindcare
                self.client.admin.command('ping')
                logger.info("✅ Connected to local MongoDB successfully")
                return True
            except Exception as local_e:
                logger.error(f"❌ Failed to connect to local MongoDB: {str(local_e)}")
                # Create in-memory database as last resort
                self.client = None
                self.db = None
                return False
    
    def get_database(self):
        """Get database connection"""
        try:
            db = MongoClient(self.mongodb_uri)
            # Test the connection
            db.admin.command('ping')
            logger.info("Database connected successfully")
            return db
        except Exception as e:
            logger.error(f"Database connection failed: {str(e)}")
            return None
    
    def is_connected(self) -> bool:
        """Check if database is connected"""
        return self.client is not None and self.db is not None
    
    # ==========================================================
    # USER ANALYSIS STORAGE
    # ==========================================================
    
    def store_analysis(self, user_id: str, analysis_data: Dict[str, Any]) -> str:
        """
        Store analysis result for a user
        Returns the analysis ID
        """
        if not self.is_connected():
            raise Exception("Database not connected")
        
        try:
            # Prepare analysis document
            analysis_doc = {
                "user_id": user_id,
                "timestamp": datetime.utcnow(),
                "session_id": analysis_data.get("session_id", ""),
                "analysis_type": analysis_data.get("analysis_type", "unknown"),
                "modality": analysis_data.get("modality", "unknown"),
                "results": analysis_data.get("results", {}),
                "confidence": analysis_data.get("confidence", 0.0),
                "emotion": analysis_data.get("emotion", "Neutral"),
                "mental_state": analysis_data.get("mental_state", "Stable"),
                "severity": analysis_data.get("severity", "Low"),
                "suggestions": analysis_data.get("suggestions", []),
                "is_backup": analysis_data.get("is_backup", False),
                "model_used": analysis_data.get("model_used", "Unknown"),
                "language": analysis_data.get("language", "en"),
                "processing_time": analysis_data.get("processing_time", 0.0),
                "metadata": analysis_data.get("metadata", {})
            }
            
            # Insert into analyses collection
            result = self.db.analyses.insert_one(analysis_doc)
            analysis_id = str(result.inserted_id)
            
            logger.info(f"✅ Stored analysis {analysis_id} for user {user_id}")
            return analysis_id
            
        except Exception as e:
            logger.error(f"❌ Failed to store analysis: {str(e)}")
            raise
    
    def store_multimodal_analysis(self, user_id: str, multimodal_data: Dict[str, Any]) -> str:
        """
        Store multimodal analysis result
        """
        if not self.is_connected():
            raise Exception("Database not connected")
        
        try:
            # Prepare multimodal analysis document
            multimodal_doc = {
                "user_id": user_id,
                "timestamp": datetime.utcnow(),
                "session_id": multimodal_data.get("session_id", ""),
                "analysis_type": "multimodal",
                "face_result": multimodal_data.get("face", {}),
                "voice_result": multimodal_data.get("voice", {}),
                "text_result": multimodal_data.get("text", {}),
                "overall_emotion": multimodal_data.get("overallEmotion", "Neutral"),
                "confidence": multimodal_data.get("confidence", 0.0),
                "severity": multimodal_data.get("severity", "Low"),
                "suggestions": multimodal_data.get("suggestions", []),
                "masking_detected": multimodal_data.get("masking", {}).get("detected", False),
                "masking_explanation": multimodal_data.get("masking", {}).get("explanation", ""),
                "authenticity_score": multimodal_data.get("masking", {}).get("authenticity_score", 1.0),
                "fusion_result": multimodal_data.get("fusion", {}),
                "language": multimodal_data.get("language", "en"),
                "processing_time": multimodal_data.get("processing_time", 0.0),
                "metadata": multimodal_data.get("metadata", {})
            }
            
            # Insert into analyses collection
            result = self.db.analyses.insert_one(multimodal_doc)
            analysis_id = str(result.inserted_id)
            
            logger.info(f"✅ Stored multimodal analysis {analysis_id} for user {user_id}")
            return analysis_id
            
        except Exception as e:
            logger.error(f"❌ Failed to store multimodal analysis: {str(e)}")
            raise
    
    # ==========================================================
    # USER HISTORY RETRIEVAL
    # ==========================================================
    
    def get_user_history(self, user_id: str, limit: int = 50, analysis_type: str = None) -> List[Dict[str, Any]]:
        """
        Get analysis history for a user
        """
        if not self.is_connected():
            raise Exception("Database not connected")
        
        try:
            # Build query
            query = {"user_id": user_id}
            if analysis_type:
                query["analysis_type"] = analysis_type
            
            # Get analyses sorted by timestamp (newest first)
            analyses = list(
                self.db.analyses.find(query)
                .sort("timestamp", -1)
                .limit(limit)
            )
            
            # Convert ObjectId to string and format
            formatted_analyses = []
            for analysis in analyses:
                analysis["_id"] = str(analysis["_id"])
                analysis["timestamp"] = analysis["timestamp"].isoformat()
                formatted_analyses.append(analysis)
            
            logger.info(f"✅ Retrieved {len(formatted_analyses)} analyses for user {user_id}")
            return formatted_analyses
            
        except Exception as e:
            logger.error(f"❌ Failed to get user history: {str(e)}")
            raise
    
    def get_user_analysis_by_id(self, user_id: str, analysis_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific analysis by ID
        """
        if not self.is_connected():
            raise Exception("Database not connected")
        
        try:
            # Find analysis
            analysis = self.db.analyses.find_one({
                "_id": ObjectId(analysis_id),
                "user_id": user_id
            })
            
            if analysis:
                analysis["_id"] = str(analysis["_id"])
                analysis["timestamp"] = analysis["timestamp"].isoformat()
                logger.info(f"✅ Retrieved analysis {analysis_id} for user {user_id}")
                return analysis
            else:
                logger.warning(f"⚠️ Analysis {analysis_id} not found for user {user_id}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Failed to get analysis by ID: {str(e)}")
            raise
    
    def get_user_statistics(self, user_id: str) -> Dict[str, Any]:
        """
        Get user analysis statistics
        """
        if not self.is_connected():
            raise Exception("Database not connected")
        
        try:
            # Get all user analyses
            analyses = list(self.db.analyses.find({"user_id": user_id}))
            
            if not analyses:
                return {
                    "total_analyses": 0,
                    "emotion_distribution": {},
                    "modality_distribution": {},
                    "average_confidence": 0.0,
                    "severity_distribution": {},
                    "recent_activity": []
                }
            
            # Calculate statistics
            total_analyses = len(analyses)
            emotion_counts = {}
            modality_counts = {}
            severity_counts = {}
            confidence_sum = 0.0
            
            for analysis in analyses:
                # Emotion distribution
                emotion = analysis.get("emotion", "Neutral")
                emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
                
                # Modality distribution
                modality = analysis.get("modality", "unknown")
                modality_counts[modality] = modality_counts.get(modality, 0) + 1
                
                # Severity distribution
                severity = analysis.get("severity", "Low")
                severity_counts[severity] = severity_counts.get(severity, 0) + 1
                
                # Confidence
                confidence_sum += analysis.get("confidence", 0.0)
            
            # Recent activity (last 10)
            recent_analyses = sorted(analyses, key=lambda x: x.get("timestamp", datetime.min), reverse=True)[:10]
            recent_activity = []
            for analysis in recent_analyses:
                recent_activity.append({
                    "id": str(analysis["_id"]),
                    "timestamp": analysis["timestamp"].isoformat(),
                    "emotion": analysis.get("emotion", "Neutral"),
                    "modality": analysis.get("modality", "unknown"),
                    "confidence": analysis.get("confidence", 0.0)
                })
            
            statistics = {
                "total_analyses": total_analyses,
                "emotion_distribution": emotion_counts,
                "modality_distribution": modality_counts,
                "average_confidence": confidence_sum / total_analyses if total_analyses > 0 else 0.0,
                "severity_distribution": severity_counts,
                "recent_activity": recent_activity
            }
            
            logger.info(f"✅ Generated statistics for user {user_id}")
            return statistics
            
        except Exception as e:
            logger.error(f"❌ Failed to get user statistics: {str(e)}")
            raise
    
    # ==========================================================
    # SESSION MANAGEMENT
    # ==========================================================
    
    def create_session(self, user_id: str, session_data: Dict[str, Any] = None) -> str:
        """
        Create a new analysis session
        """
        if not self.is_connected():
            raise Exception("Database not connected")
        
        try:
            session_doc = {
                "user_id": user_id,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "status": "active",
                "analysis_count": 0,
                "session_data": session_data or {}
            }
            
            result = self.db.sessions.insert_one(session_doc)
            session_id = str(result.inserted_id)
            
            logger.info(f"✅ Created session {session_id} for user {user_id}")
            return session_id
            
        except Exception as e:
            logger.error(f"❌ Failed to create session: {str(e)}")
            raise
    
    def update_session(self, session_id: str, update_data: Dict[str, Any]) -> bool:
        """
        Update session data
        """
        if not self.is_connected():
            raise Exception("Database not connected")
        
        try:
            update_data["updated_at"] = datetime.utcnow()
            
            result = self.db.sessions.update_one(
                {"_id": ObjectId(session_id)},
                {"$set": update_data}
            )
            
            success = result.modified_count > 0
            if success:
                logger.info(f"✅ Updated session {session_id}")
            else:
                logger.warning(f"⚠️ Session {session_id} not found or no changes made")
            
            return success
            
        except Exception as e:
            logger.error(f"❌ Failed to update session: {str(e)}")
            raise
    
    def get_user_sessions(self, user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Get user sessions
        """
        if not self.is_connected():
            raise Exception("Database not connected")
        
        try:
            sessions = list(
                self.db.sessions.find({"user_id": user_id})
                .sort("created_at", -1)
                .limit(limit)
            )
            
            # Format sessions
            formatted_sessions = []
            for session in sessions:
                session["_id"] = str(session["_id"])
                session["created_at"] = session["created_at"].isoformat()
                session["updated_at"] = session["updated_at"].isoformat()
                formatted_sessions.append(session)
            
            logger.info(f"✅ Retrieved {len(formatted_sessions)} sessions for user {user_id}")
            return formatted_sessions
            
        except Exception as e:
            logger.error(f"❌ Failed to get user sessions: {str(e)}")
            raise
    
    # ==========================================================
    # UTILITY METHODS
    # ==========================================================
    
    def delete_user_data(self, user_id: str) -> bool:
        """
        Delete all data for a user (GDPR compliance)
        """
        if not self.is_connected():
            raise Exception("Database not connected")
        
        try:
            # Delete analyses
            analysis_result = self.db.analyses.delete_many({"user_id": user_id})
            
            # Delete sessions
            session_result = self.db.sessions.delete_many({"user_id": user_id})
            
            logger.info(f"✅ Deleted {analysis_result.deleted_count} analyses and {session_result.deleted_count} sessions for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to delete user data: {str(e)}")
            raise
    
    def close(self):
        """Close database connection"""
        if self.client:
            self.client.close()
            logger.info("✅ Database connection closed")

# Global database instance
_db_instance = None

def get_database() -> AnalysisDatabase:
    """Get or create global database instance"""
    global _db_instance
    if _db_instance is None:
        _db_instance = AnalysisDatabase()
    return _db_instance

if __name__ == "__main__":
    # Test database connection
    print("Testing Database Connection")
    print("=" * 50)
    
    db = get_database()
    
    if db.is_connected():
        print("✅ Database connected successfully")
        
        # Test storing an analysis
        test_analysis = {
            "session_id": "test_session",
            "analysis_type": "text",
            "modality": "text",
            "results": {"emotion": "Happy", "confidence": 0.95},
            "confidence": 0.95,
            "emotion": "Happy",
            "mental_state": "Positive",
            "severity": "Low",
            "suggestions": ["Keep up the good work!"],
            "is_backup": False,
            "model_used": "Gemini",
            "language": "en",
            "processing_time": 1.2,
            "metadata": {"test": True}
        }
        
        try:
            analysis_id = db.store_analysis("test_user", test_analysis)
            print(f"✅ Test analysis stored: {analysis_id}")
            
            # Test retrieving history
            history = db.get_user_history("test_user")
            print(f"✅ Retrieved {len(history)} analyses from history")
            
        except Exception as e:
            print(f"❌ Test failed: {str(e)}")
    else:
        print("❌ Database connection failed")
