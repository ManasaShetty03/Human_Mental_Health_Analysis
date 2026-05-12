import React from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

interface LandingPageProps {
  setPage: (page: 'auth' | 'language') => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ setPage }) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-[#dce9f9] flex flex-col items-center px-3 sm:px-4 md:px-6">
      <div className="min-h-screen w-full flex flex-col items-center justify-center py-8 sm:py-12 md:py-24">
        <div className="max-w-4xl w-full text-center space-y-6 sm:space-y-8 md:space-y-12">
          {/* Main Title */}
          <motion.div
             initial={{ opacity: 0, y: -20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 1 }}
          >
            <div className="flex flex-col items-center mb-3 sm:mb-4">
              <motion.img
                src="/logo.png"
                alt="MindCare Logo"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, delay: 0.3 }}
                className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-40 lg:h-40"
                whileHover={{ scale: 1.1, rotate: 5 }}
              />
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.5 }}
                className="text-[16vw] sm:text-[12vw] md:text-[8vw] lg:text-[6vw] font-serif tracking-tight text-[#1a3a6d] leading-none"
              >
                {t('app_name')}
              </motion.h1>
            </div>
          </motion.div>

          {/* Description */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-[#2d5da1] max-w-2xl sm:max-w-3xl mx-auto font-light leading-snug px-2 sm:px-4"
          >
           
          </motion.p>

          {/* Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1 }}
            className="flex flex-col items-center gap-4 sm:gap-6 w-full max-w-sm mx-auto"
          >
                        <Button 
              className="w-full sm:w-72 h-12 sm:h-14 rounded-2xl bg-[#1a3a6d] text-white border-2 border-[#1a3a6d]/20 hover:bg-[#2d5da1] text-base sm:text-xl font-medium flex items-center justify-center gap-2 sm:gap-3 soft-shadow transition-all"
              onClick={() => setPage('auth')}
            >
              Login
            </Button>
          </motion.div>

                  </div>
      </div>

          </div>
  );
};

export default LandingPage;
