import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Analysis, UserStatistics } from '../types';
import { ArrowLeft, Calendar, TrendingUp, Brain, Smile, Frown, Meh, Angry, Heart, Activity, Target, Zap, Sparkles, Clock, TrendingUp as TrendUpIcon } from 'lucide-react';
import PieChart from '../components/PieChart';

interface HistoryProps {
  userId?: string;
  onBack?: () => void;
}

export default function HistorySimple({ userId = 'demo_user', onBack }: HistoryProps) {
  console.log('HistorySimple component - userId:', userId);
  const [history, setHistory] = useState<Analysis[]>([]);
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [animatedStats, setAnimatedStats] = useState({ analyses: 0, confidence: 0, emotions: 0 });

  useEffect(() => {
    fetchHistoryAndStatistics();
  }, [userId]);

  useEffect(() => {
    if (statistics) {
      // Animate statistics on load
      const duration = 1500;
      const steps = 30;
      const stepDuration = duration / steps;
      
      let currentStep = 0;
      const targetAnalyses = statistics.total_analyses;
      const targetConfidence = Math.round(statistics.average_confidence * 100);
      const targetEmotions = Object.keys(statistics.emotion_distribution || {}).length;
      
      const interval = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        
        setAnimatedStats({
          analyses: Math.round(targetAnalyses * easeOutQuart),
          confidence: Math.round(targetConfidence * easeOutQuart),
          emotions: Math.round(targetEmotions * easeOutQuart)
        });
        
        if (currentStep >= steps) {
          clearInterval(interval);
        }
      }, stepDuration);
      
      return () => clearInterval(interval);
    }
  }, [statistics]);

  const fetchHistoryAndStatistics = async () => {
    try {
      setLoading(true);
      
      // Fetch history and statistics in parallel
      const [historyResponse, statsResponse] = await Promise.all([
        fetch(`http://localhost:3000/api/user/${userId}/history?limit=20`),
        fetch(`http://localhost:3000/api/user/${userId}/statistics`)
      ]);

      if (!historyResponse.ok || !statsResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const historyData = await historyResponse.json();
      const statsData = await statsResponse.json();

      console.log('History data received:', historyData);
      console.log('History array:', historyData.history);
      console.log('User ID:', userId);

      setHistory(historyData.history || []);
      setStatistics(statsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('History fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getEmotionIcon = (emotion: string) => {
    switch (emotion.toLowerCase()) {
      case 'happy':
      case 'joy':
        return <Smile className="w-6 h-6 text-emerald-500" />;
      case 'sad':
      case 'sadness':
        return <Frown className="w-6 h-6 text-blue-500" />;
      case 'angry':
      case 'anger':
        return <Angry className="w-6 h-6 text-red-500" />;
      case 'neutral':
        return <Meh className="w-6 h-6 text-gray-500" />;
      default:
        return <Brain className="w-6 h-6 text-purple-500" />;
    }
  };

  const getEmotionGradient = (emotion: string) => {
    switch (emotion.toLowerCase()) {
      case 'happy':
      case 'joy':
        return 'from-emerald-400 to-teal-500';
      case 'sad':
      case 'sadness':
        return 'from-blue-400 to-indigo-500';
      case 'angry':
      case 'anger':
        return 'from-red-400 to-pink-500';
      case 'neutral':
        return 'from-gray-400 to-slate-500';
      default:
        return 'from-purple-400 to-violet-500';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'low':
        return 'bg-green-900/50 text-green-300 border-green-700/50';
      case 'medium':
        return 'bg-yellow-900/50 text-yellow-300 border-yellow-700/50';
      case 'high':
        return 'bg-red-900/50 text-red-300 border-red-700/50';
      default:
        return 'bg-gray-700/50 text-gray-300 border-gray-600/50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-indigo-600 animate-pulse" />
              </div>
              <div className="mt-6 text-xl font-semibold text-gray-800">Loading your mental health journey...</div>
              <div className="mt-2 text-gray-600">Please wait while we fetch your analysis history</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Angry className="w-8 h-8 text-red-600" />
              </div>
              <div className="text-xl font-semibold text-gray-800 mb-2">Error loading history</div>
              <div className="text-gray-600 mb-6">{error}</div>
              <button
                onClick={fetchHistoryAndStatistics}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Retry
              </button>
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
          className="flex items-center gap-4 mb-8"
        >
          {onBack && (
            <motion.button
              whileHover={{ scale: 1.05, rotate: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className="p-3 bg-gradient-to-r from-blue-600 to-blue-700 backdrop-blur-sm border border-blue-500 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <ArrowLeft size={20} className="text-white" />
            </motion.button>
          )}
          <motion.div 
            className="flex-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.h1 
              className="text-4xl font-bold text-blue-900"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <span className="inline-flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-purple-500" />
                Your Mental Health Journey
                <Heart className="w-8 h-8 text-red-500" />
              </span>
            </motion.h1>
            <motion.p 
              className="mt-2 text-gray-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Track your emotional patterns and progress over time
            </motion.p>
          </motion.div>
          <motion.div 
            className="p-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg"
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.6, type: "spring", delay: 0.4 }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Heart className="w-6 h-6 text-white" />
          </motion.div>
        </motion.div>

        {/* Statistics Cards */}
        {statistics && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
          >
            <motion.div 
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/50 hover:shadow-xl transition-all duration-300"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-center justify-between mb-4">
                <motion.div 
                  className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl"
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Activity className="w-6 h-6 text-white" />
                </motion.div>
                <motion.div 
                  className="text-3xl font-bold text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text"
                  key={animatedStats.analyses}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {animatedStats.analyses}
                </motion.div>
              </div>
              <div className="text-gray-600">Total Analyses</div>
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min((animatedStats.analyses / 10) * 100, 100)}%` }}
                ></div>
              </div>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/50 hover:shadow-xl transition-all duration-300"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 }}
            >
              <div className="flex items-center justify-between mb-4">
                <motion.div 
                  className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl"
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Target className="w-6 h-6 text-white" />
                </motion.div>
                <motion.div 
                  className="text-3xl font-bold text-transparent bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text"
                  key={animatedStats.confidence}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {animatedStats.confidence}%
                </motion.div>
              </div>
              <div className="text-gray-600">Avg. Confidence</div>
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min((animatedStats.confidence / 100) * 100, 100)}%` }}
                ></div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Emotion Distribution Pie Chart */}
        {statistics && Object.keys(statistics.emotion_distribution || {}).length > 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, type: "spring" }}
            whileHover={{ y: -5 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 mb-8 border border-white/50"
          >
            <motion.h2 
              className="text-2xl font-bold mb-6 flex items-center gap-3 text-blue-900"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 }}
            >
              <motion.div 
                className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg"
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.5 }}
              >
                <TrendUpIcon className="w-5 h-5 text-white" />
              </motion.div>
              Emotion Distribution
            </motion.h2>
            <motion.div 
              className="flex justify-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.0, type: "spring" }}
            >
              <PieChart
                data={statistics.emotion_distribution}
                colors={['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280']}
                size={320}
                title="Emotion Breakdown"
              />
            </motion.div>
          </motion.div>
        )}

        {/* Analysis History */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-white/50"
        >
          <motion.h2 
            className="text-2xl font-bold mb-6 flex items-center gap-3 text-blue-900"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2 }}
          >
            <motion.div 
              className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg"
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.5 }}
            >
              <Clock className="w-5 h-5 text-white" />
            </motion.div>
            Analysis History
          </motion.h2>
          
          {history.length === 0 ? (
            <motion.div 
              className="text-center py-12"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.3 }}
            >
              <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain className="w-12 h-12 text-blue-600" />
              </div>
              <div className="text-xl font-semibold text-gray-800 mb-2">No analyses yet</div>
              <div className="text-gray-600">Start your mental health journey by performing your first analysis</div>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {history.map((analysis, index) => (
                <motion.div
                  key={analysis._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4 + index * 0.1 }}
                  whileHover={{ scale: 1.02, x: 10 }}
                  className="bg-gradient-to-r from-white to-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <motion.div 
                        className={`p-3 bg-gradient-to-r ${getEmotionGradient(analysis.emotion)} rounded-xl shadow-md`}
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.5 }}
                      >
                        {getEmotionIcon(analysis.emotion)}
                      </motion.div>
                      <div>
                        <div className="text-lg font-semibold text-gray-800 capitalize">
                          {analysis.emotion}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {new Date(analysis.timestamp).toLocaleDateString()} at {new Date(analysis.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <motion.span 
                        className={`px-3 py-1 text-xs font-medium rounded-full border ${getSeverityColor(analysis.severity)}`}
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        {analysis.severity}
                      </motion.span>
                      {analysis.is_backup && (
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                          Backup
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-gray-600">Confidence:</div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full"
                            style={{ width: `${analysis.confidence}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-gray-800">
                          {Math.round(analysis.confidence)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-gray-600">Modality:</div>
                      <span className="text-sm font-semibold text-gray-800 capitalize">
                        {analysis.modality}
                      </span>
                    </div>
                  </div>

                  {analysis.suggestions && analysis.suggestions.length > 0 && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                      <div className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        Suggestions:
                      </div>
                      <ul className="space-y-1">
                        {analysis.suggestions.map((suggestion, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 flex-shrink-0"></div>
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
