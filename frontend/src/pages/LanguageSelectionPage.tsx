import React from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface LanguageSelectionPageProps {
  setPage: (page: 'auth' | 'analysis') => void;
  selectedLanguage: string;
  setSelectedLanguage: (language: string) => void;
}

const LanguageSelectionPage: React.FC<LanguageSelectionPageProps> = ({ 
  setPage, 
  selectedLanguage, 
  setSelectedLanguage 
}) => {
  const { t } = useTranslation();

  const languages = [
    { 
      code: 'en', 
      name: 'English', 
      region: 'US'
    },
    { 
      code: 'kn', 
      name: 'ಕನ್ನಡ', 
      region: 'IN'
    },
    { 
      code: 'hi', 
      name: 'हिन्दी', 
      region: 'IN'
    }
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen relative px-4 sm:px-6 py-8 sm:py-12 overflow-hidden bg-gradient-to-br from-[#dce9f9] to-[#e8f2ff]">
      <div className="absolute top-4 sm:top-8 left-4 sm:left-8 z-20">
        <Button 
          variant="ghost" 
          className="rounded-full text-[#1a3a6d] hover:text-[#1a3a6d]/90 hover:bg-[#1a3a6d]/10 h-10 px-4 sm:px-5 font-bold uppercase tracking-widest text-[10px] sm:text-[11px] transition-all bg-white/50 backdrop-blur-sm border border-[#1a3a6d]/20" 
          onClick={() => setPage('auth')}
        >
          <ChevronLeft size={16} className="mr-1" /> {t('back')}
        </Button>
      </div>

      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4 mb-8 sm:mb-12 max-w-3xl mx-auto"
      >
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#1a3a6d] font-bold leading-tight">
          Choose Your Language
        </h1>
        <p className="text-[#2d5da1] text-base sm:text-lg md:text-xl leading-relaxed px-4">
          Select your preferred language to begin your emotional wellness journey
        </p>
      </motion.div>

      <div className="w-full max-w-3xl relative z-10 flex flex-col gap-2 sm:gap-3">
        {languages.map((lang, i) => (
          <motion.div
            key={lang.code}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => {
              setSelectedLanguage(lang.code);
            }}
            className={`relative flex items-center px-4 py-3 sm:px-6 sm:py-4 rounded-xl cursor-pointer transition-all duration-300 border-2 transform hover:scale-[1.01] ${
              selectedLanguage === lang.code 
                ? 'bg-gradient-to-r from-[#1a3a6d] to-[#2d5da1] border-[#1a3a6d] shadow-lg shadow-[#1a3a6d]/20' 
                : 'bg-white/90 backdrop-blur-sm border-white/60 hover:border-[#1a3a6d]/40 shadow-md hover:shadow-lg hover:bg-white'
              }`}
          >
            {/* Language Flag */}
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center mr-3 sm:mr-4 transition-all duration-300 ${
              selectedLanguage === lang.code 
                ? 'bg-white/20' 
                : 'bg-gradient-to-br from-[#e8f2ff] to-[#dce9f9] border border-[#1a3a6d]/20'
            }`}>
              <span className={`text-lg sm:text-xl font-bold transition-colors ${
                selectedLanguage === lang.code ? 'text-white' : 'text-[#1a3a6d]'
              }`}>
                {lang.code === 'en' ? '🇺🇸' : lang.code === 'kn' ? '🇮🇳' : '🇮🇳'}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1">
              <h3 className={`text-base sm:text-lg md:text-xl font-bold transition-colors ${
                selectedLanguage === lang.code ? 'text-white' : 'text-[#1a3a6d]'
              }`}>
                {lang.name}
              </h3>
              <p className={`text-xs sm:text-sm transition-colors ${
                selectedLanguage === lang.code ? 'text-white/80' : 'text-[#2d5da1]/70'
              }`}>
                {lang.code === 'en' ? 'English' : lang.code === 'kn' ? 'Kannada' : 'Hindi'} • {lang.region}
              </p>
            </div>

            {/* Selection Indicator */}
            <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
              selectedLanguage === lang.code 
                ? 'border-white bg-white' 
                : 'border-[#1a3a6d]/30 bg-white/50'
            }`}>
              {selectedLanguage === lang.code && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#1a3a6d] shadow-sm"
                />
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: selectedLanguage ? 1 : 0, y: selectedLanguage ? 0 : 20 }}
        className="mt-12 sm:mt-16 relative z-10"
      >
        <Button 
          size="lg" 
          disabled={!selectedLanguage}
          className="w-full sm:w-auto h-14 sm:h-16 px-8 sm:px-12 bg-gradient-to-r from-[#1a3a6d] to-[#2d5da1] hover:from-[#2d5da1] hover:to-[#1a3a6d] text-white font-bold text-base sm:text-lg md:text-xl rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          onClick={() => setPage('analysis')}
        >
          <span className="flex items-center justify-center gap-3">
            Start Analysis 
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </span>
        </Button>
      </motion.div>
    </div>
  );
};

export default LanguageSelectionPage;
