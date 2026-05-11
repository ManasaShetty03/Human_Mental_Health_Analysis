import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { GlassCard } from '../App';
import { useUser } from '../contexts/UserContext';

interface SignupPageProps {
  setPage: (page: 'landing' | 'language') => void;
}

const SignupPage: React.FC<SignupPageProps> = ({ setPage }) => {
  const { t } = useTranslation();
  const { setUser } = useUser();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    studentId: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (authMode === 'signup') {
      if (!authForm.name || !authForm.email || !authForm.studentId || !authForm.password) {
        toast.error("Please fill in all required fields");
        return;
      }
      if (authForm.password !== authForm.confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }
    } else {
      if (!authForm.email || !authForm.password) {
        toast.error("Please fill in email and password");
        return;
      }
    }
    
    setLoading(true);
    
    try {
      if (authMode === 'signup') {
        const signupPayload = {
          personal_info: {
            name: authForm.name,
            email: authForm.email
          },
          account_info: {
            password_hash: authForm.password,
            role: 'student'
          },
          academic_info: {
            student_id: authForm.studentId
          }
        };
        
        const signupResponse = await fetch('https://mental-health-analysis-1ljn.onrender.com/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(signupPayload)
        });
        
        const signupData = await signupResponse.json();
        
        if (signupResponse.ok) {
          // Set user context after successful signup
          const userData = {
            id: signupData.user.id || authForm.email,
            name: authForm.name,
            email: authForm.email,
            studentId: authForm.studentId
          };
          setUser(userData);
          
          toast.success('Account created successfully!');
          setPage('language');
        } else {
          toast.error(signupData.error || 'Registration failed');
        }
      } else {
        // Login functionality
        const loginPayload = {
          email: authForm.email,
          password: authForm.password
        };
        
        const loginResponse = await fetch('https://mental-health-analysis-1ljn.onrender.com/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(loginPayload)
        });
        
        const loginData = await loginResponse.json();
        
        if (loginResponse.ok) {
          // Set user context after successful login
          const userData = {
            id: loginData.user.id || authForm.email,
            name: loginData.user.personal_info?.name || authForm.email.split('@')[0],
            email: authForm.email,
            studentId: loginData.user.academic_info?.student_id
          };
          setUser(userData);
          
          toast.success('Login successful!');
          setPage('language');
        } else {
          toast.error(loginData.error || 'Login failed');
        }
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 relative overflow-hidden bg-gradient-to-br from-[#dce9f9] to-[#e8f2ff]">
      <div className="absolute top-4 sm:top-8 left-4 sm:left-8 z-20">
        <Button 
          variant="ghost" 
          className="rounded-full text-[#1a3a6d] hover:text-[#1a3a6d]/90 hover:bg-[#1a3a6d]/10 h-10 px-4 sm:px-5 font-bold uppercase tracking-widest text-[10px] sm:text-[11px] transition-all bg-white/50 backdrop-blur-sm border border-[#1a3a6d]/20" 
          onClick={() => setPage('landing')}
        >
          <ChevronLeft size={16} className="mr-1" /> {t('back')}
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg sm:max-w-xl relative z-10"
      >
        <GlassCard className="p-6 sm:p-8 md:p-12 bg-white/80 backdrop-blur-3xl shadow-2xl border border-white/50 space-y-6 sm:space-y-8 rounded-3xl">
          <div className="text-center space-y-3 sm:space-y-4">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#1a3a6d] font-bold">
              {authMode === 'login' ? 'Welcome Back' : 'Join MindCare'}
            </h2>
            <p className="text-[#2d5da1] opacity-80 text-sm sm:text-base md:text-lg leading-relaxed px-2">
              {authMode === 'login' 
                ? 'Sign in to access your emotional wellness dashboard' 
                : 'Create an account to track your wellness journey'}
            </p>
          </div>

          <div className="space-y-4 sm:space-y-5">
            {authMode === 'signup' && (
              <>
                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-sm sm:text-base font-semibold text-[#1a3a6d]">Name</Label>
                  <Input
                    type="text"
                    value={authForm.name}
                    onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
                    placeholder="Enter your full name"
                    className="h-12 sm:h-14 bg-white/70 border-[#1a3a6d]/30 focus:border-[#1a3a6d] focus:ring-2 focus:ring-[#1a3a6d]/20 rounded-xl text-base sm:text-lg transition-all"
                  />
                </div>
                
                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-sm sm:text-base font-semibold text-[#1a3a6d]">Student ID</Label>
                  <Input
                    type="text"
                    value={authForm.studentId}
                    onChange={(e) => setAuthForm({...authForm, studentId: e.target.value})}
                    placeholder="Enter your student ID"
                    className="h-12 sm:h-14 bg-white/70 border-[#1a3a6d]/30 focus:border-[#1a3a6d] focus:ring-2 focus:ring-[#1a3a6d]/20 rounded-xl text-base sm:text-lg transition-all"
                  />
                </div>
              </>
            )}
            
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-sm sm:text-base font-semibold text-[#1a3a6d]">Email</Label>
              <Input
                type="email"
                value={authForm.email}
                onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                placeholder="Enter your email"
                className="h-12 sm:h-14 bg-white/70 border-[#1a3a6d]/30 focus:border-[#1a3a6d] focus:ring-2 focus:ring-[#1a3a6d]/20 rounded-xl text-base sm:text-lg transition-all"
              />
            </div>
            
            <div className="space-y-2 sm:space-y-3">
              <Label className="text-sm sm:text-base font-semibold text-[#1a3a6d]">Password</Label>
              <Input
                type="password"
                value={authForm.password}
                onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                placeholder="Enter your password"
                className="h-12 sm:h-14 bg-white/70 border-[#1a3a6d]/30 focus:border-[#1a3a6d] focus:ring-2 focus:ring-[#1a3a6d]/20 rounded-xl text-base sm:text-lg transition-all"
              />
            </div>
            
            {authMode === 'signup' && (
              <div className="space-y-2 sm:space-y-3">
                <Label className="text-sm sm:text-base font-semibold text-[#1a3a6d]">Confirm Password</Label>
                <Input
                  type="password"
                  value={authForm.confirmPassword}
                  onChange={(e) => setAuthForm({...authForm, confirmPassword: e.target.value})}
                  placeholder="Confirm your password"
                  className="h-12 sm:h-14 bg-white/70 border-[#1a3a6d]/30 focus:border-[#1a3a6d] focus:ring-2 focus:ring-[#1a3a6d]/20 rounded-xl text-base sm:text-lg transition-all"
                />
              </div>
            )}
          </div>

          <div className="space-y-4 sm:space-y-6">
            <Button 
              className="w-full h-14 sm:h-16 rounded-2xl bg-gradient-to-r from-[#1a3a6d] to-[#2d5da1] hover:from-[#2d5da1] hover:to-[#1a3a6d] text-white font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {authMode === 'login' ? 'Sign In' : 'Create Account'}
                  <ChevronLeft className="rotate-180 w-4 h-4 sm:w-5 sm:h-5" />
                </span>
              )}
            </Button>
            
            <div className="text-center">
              <button
                type="button"
                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                className="text-[#1a3a6d] hover:text-[#2d5da1] text-sm sm:text-base font-medium transition-all duration-200 hover:underline underline-offset-4 decoration-2 decoration-[#1a3a6d]/50"
              >
                {authMode === 'login' 
                  ? "Don't have an account? Sign up" 
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default SignupPage;
