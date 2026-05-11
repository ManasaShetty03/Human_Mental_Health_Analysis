import React from 'react';
import { motion } from 'motion/react';
import { Brain, MessageSquare, Mic, Camera, Heart, Activity, Clock, Users, Shield, Sparkles, Zap, TrendingUp } from 'lucide-react';

interface FeaturesPageProps {
  setPage: (page: string) => void;
}

export default function FeaturesPage({ setPage }: FeaturesPageProps) {
  const features = [
    {
      icon: MessageSquare,
      title: "Text Analysis",
      description: "Express yourself through text and get instant emotional insights",
      color: "from-[#1a3a6d] to-[#2d5da1]"
    },
    {
      icon: Mic,
      title: "Voice Analysis",
      description: "Analyze your speech patterns and vocal tones for emotional understanding",
      color: "from-[#1a3a6d] to-[#2d5da1]"
    },
    {
      icon: Brain,
      title: "Multimodal Analysis",
      description: "Advanced artificial intelligence analyzes emotions through multiple modalities",
      color: "from-[#1a3a6d] to-[#2d5da1]"
    },
    {
      icon: Activity,
      title: "Emotion Detection",
      description: "Advanced facial emotion detection using computer vision technology",
      color: "from-[#1a3a6d] to-[#2d5da1]"
    },
    {
      icon: Shield,
      title: "Severity Detection",
      description: "Monitor emotional severity levels with detailed analysis and assessment",
      color: "from-[#1a3a6d] to-[#2d5da1]"
    },
    {
      icon: Heart,
      title: "Wellness Suggestions",
      description: "Get immediate insights and recommendations for emotional wellness",
      color: "from-[#1a3a6d] to-[#2d5da1]"
    }
  ];

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
            className="text-5xl font-bold text-blue-900 mb-4 inline-flex items-center gap-4"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <Sparkles className="w-12 h-12 text-purple-500" />
            </motion.div>
            MindCare Features
            <motion.div
              whileHover={{ rotate: -360 }}
              transition={{ duration: 0.6 }}
            >
              <Brain className="w-12 h-12 text-blue-500" />
            </motion.div>
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-600 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Discover the powerful tools and technologies that make MindCare your comprehensive mental health companion
          </motion.p>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              whileHover={{ y: -10, scale: 1.05, rotate: 1 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-white/50 hover:shadow-xl transition-all duration-300"
            >
              <motion.div 
                className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg`}
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.5 }}
              >
                <feature.icon className="w-8 h-8 text-white" />
              </motion.div>
              <motion.h3 
                className="text-2xl font-bold text-gray-800 mb-4"
                whileHover={{ scale: 1.05, color: "#1a3a6d" }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {feature.title}
              </motion.h3>
              <motion.p 
                className="text-gray-600 leading-relaxed"
                whileHover={{ scale: 1.02 }}
              >
                {feature.description}
              </motion.p>
            </motion.div>
          ))}
        </motion.div>

        {/* Call to Action */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.0 }}
          whileHover={{ y: -5 }}
          className="text-center bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 border border-white/50"
        >
          <motion.div 
            className="w-20 h-20 bg-gradient-to-r from-[#1a3a6d] to-[#2d5da1] rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
            whileHover={{ rotate: 360, scale: 1.1 }}
            transition={{ duration: 0.6 }}
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>
          <motion.h2 
            className="text-3xl font-bold text-[#1a3a6d] mb-4"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            Ready to Start Your Journey?
          </motion.h2>
          <motion.p 
            className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto"
            whileHover={{ scale: 1.02 }}
          >
            Take the first step towards better mental health understanding with our comprehensive analysis tools
          </motion.p>
          <div className="flex gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPage('analysis')}
              className="px-8 py-4 bg-gradient-to-r from-[#1a3a6d] to-[#2d5da1] text-white rounded-xl hover:from-[#2d5da1] hover:to-[#1a3a6d] transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
            >
              <span className="flex items-center gap-2">
                Start Analysis
                <TrendingUp className="w-5 h-5" />
              </span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPage('history')}
              className="px-8 py-4 bg-gradient-to-r from-[#1a3a6d] to-[#2d5da1] text-white rounded-xl hover:from-[#2d5da1] hover:to-[#1a3a6d] transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
            >
              <span className="flex items-center gap-2">
                View History
                <Clock className="w-5 h-5" />
              </span>
            </motion.button>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
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
