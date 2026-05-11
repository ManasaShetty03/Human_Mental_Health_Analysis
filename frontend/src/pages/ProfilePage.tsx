import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Calendar, Activity, Brain, Heart, Settings, LogOut, Edit2, TrendingUp, Clock, Sparkles, TrendingUp as TrendUpIcon } from 'lucide-react';
import { useUser } from '../contexts/UserContext';

interface ProfilePageProps {
  setPage: (page: string) => void;
  userId?: string;
}

interface UserProfile {
  name: string;
  email: string;
  joinDate: string;
  totalAnalyses: number;
  averageConfidence: number;
  preferredModality: string;
  lastAnalysis: string;
  achievements: string[];
  emotionDistribution: Record<string, number>;
  recentActivity: Array<{
    timestamp: string;
    emotion: string;
    confidence: number;
    modality: string;
  }>;
}

interface UserStatistics {
  total_analyses: number;
  emotion_distribution: Record<string, number>;
  modality_distribution: Record<string, number>;
  average_confidence: number;
  severity_distribution: Record<string, number>;
  recent_activity: Array<{
    id: string;
    timestamp: string;
    emotion: string;
    confidence: number;
    modality: string;
  }>;
}

export default function ProfilePage({ setPage, userId = 'demo_user' }: ProfilePageProps) {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [recentActivity, setRecentActivity] = useState<Array<{
    timestamp: string;
    emotion: string;
    confidence: number;
    modality: string;
  }>>([]);

  useEffect(() => {
    fetchUserStatistics();
  }, [userId]);

  const fetchUserStatistics = async () => {
    try {
      setLoading(true);
      const statsResponse = await fetch(`http://localhost:3000/api/user/${userId}/statistics`);
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStatistics(statsData);
        
        // Fetch recent activity from history
        const historyResponse = await fetch(`http://localhost:3000/api/user/${userId}/history?limit=5`);
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          setRecentActivity(historyData.history || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  
  const getModalityIcon = (modality: string) => {
    switch (modality) {
      case 'text':
        return <Edit2 className="w-5 h-5 text-white" />;
      case 'voice':
        return <Activity className="w-5 h-5 text-white" />;
      case 'face':
        return <Heart className="w-5 h-5 text-white" />;
      default:
        return <Brain className="w-5 h-5 text-white" />;
    }
  };

  const getEmotionColor = (emotion: string) => {
    switch (emotion.toLowerCase()) {
      case 'happy':
        return 'from-yellow-400 to-orange-500';
      case 'sad':
        return 'from-blue-400 to-blue-600';
      case 'angry':
        return 'from-red-400 to-red-600';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
              <div className="text-xl font-semibold text-gray-800">Loading profile...</div>
              <div className="text-gray-600 mt-2">Fetching your mental health data</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.h1 
            className="text-5xl font-bold text-blue-900 mb-4"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <span className="inline-flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-purple-500" />
              Your Profile
              <Sparkles className="w-8 h-8 text-purple-500" />
            </span>
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Manage your account and track your mental health journey
          </motion.p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              whileHover={{ y: -5 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-white/50"
            >
              <div className="text-center">
                <motion.div 
                  className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6, type: "spring" }}
                >
                  <User className="w-16 h-16 text-white" />
                </motion.div>
                
                <motion.h2 
                  className="text-2xl font-bold text-blue-900 mb-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {user?.name || 'User'}
                </motion.h2>
                <motion.div 
                  className="flex items-center justify-center gap-2 text-gray-600"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Mail className="w-4 h-4" />
                  <span>{user?.email || 'user@example.com'}</span>
                </motion.div>

                {/* Quick Actions */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 pt-6 border-t border-gray-200"
                >
                  <div className="grid grid-cols-1 gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setPage('history')}
                      className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-blue-900 to-blue-800 rounded-lg border border-blue-700 hover:from-blue-800 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <Activity className="w-4 h-4 text-white" />
                      <span className="text-sm font-medium text-white">View History</span>
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setPage('analysis')}
                      className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-blue-900 to-blue-800 rounded-lg border border-blue-700 hover:from-blue-800 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <Brain className="w-4 h-4 text-white" />
                      <span className="text-sm font-medium text-white">New Analysis</span>
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Stats and Achievements */}
          <div className="lg:col-span-2 space-y-8">
            {/* Statistics */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              whileHover={{ y: -5 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-white/50"
            >
              <motion.h3 
                className="text-2xl font-bold text-blue-900 mb-6 flex items-center gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <TrendUpIcon className="w-6 h-6" />
                Your Statistics
              </motion.h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div 
                  className="text-center p-6 bg-gradient-to-r from-blue-900 to-blue-800 rounded-xl border border-blue-700 shadow-lg"
                  whileHover={{ scale: 1.05, rotate: 1 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.5 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <motion.div 
                    className="text-3xl font-bold text-white mb-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.6, type: "spring" }}
                  >
                    {statistics?.total_analyses || 0}
                  </motion.div>
                  <div className="text-blue-100">Total Analyses</div>
                </motion.div>
                
                <motion.div 
                  className="text-center p-6 bg-gradient-to-r from-blue-900 to-blue-800 rounded-xl border border-blue-700 shadow-lg"
                  whileHover={{ scale: 1.05, rotate: -1 }}
                  transition={{ type: "spring", stiffness: 300, delay: 0.7 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <motion.div 
                    className="text-3xl font-bold text-white mb-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.8, type: "spring" }}
                  >
                    {Math.round(statistics?.average_confidence || 0)}%
                  </motion.div>
                  <div className="text-blue-100">Avg. Confidence</div>
                </motion.div>
              </div>
            </motion.div>

            
            {/* Recent Activity */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              whileHover={{ y: -5 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-white/50"
            >
              <motion.h3 
                className="text-2xl font-bold text-blue-900 mb-6 flex items-center gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Clock className="w-6 h-6" />
                Recent Activity
              </motion.h3>
              {recentActivity && recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      whileHover={{ scale: 1.02, x: 10 }}
                      className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all"
                    >
                      <motion.div 
                        className={`w-12 h-12 bg-gradient-to-r ${getEmotionColor(activity.emotion)} rounded-xl flex items-center justify-center shadow-md`}
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.5 }}
                      >
                        {getModalityIcon(activity.modality)}
                      </motion.div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-800 capitalize">{activity.emotion}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(activity.timestamp).toLocaleDateString()} at {new Date(activity.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                      <motion.div 
                        className="text-right"
                        whileHover={{ scale: 1.1 }}
                      >
                        <div className="text-sm font-medium text-gray-700">
                          {Math.round(activity.confidence * 100)}%
                        </div>
                        <div className="text-xs text-gray-500">Confidence</div>
                      </motion.div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <div>No recent activity</div>
                  <div className="text-sm mt-2">Start an analysis to see your activity here</div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
