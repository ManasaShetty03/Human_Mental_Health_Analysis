import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, 
  MessageSquare, 
  Mic, 
  Camera,
  ChevronRight, 
  ChevronLeft, 
  Languages, 
  AlertTriangle,
  Activity,
  Heart,
  Music,
  User,
  LogOut,
  Library,
  Video,
  Wind,
  Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import Meyda from 'meyda';
import { PitchDetector } from 'pitchy';
import * as faceapi from 'face-api.js';
import { 
  analyzeText, 
  analyzeAudio, 
  analyzeMultimodal, 
  generateFinalSummary, 
  AnalysisResult 
} from '@/src/lib/gemini';
import { 
  Emotion, 
  ModalityResult, 
  QuestionResult, 
  FinalSummary, 
  MultimodalAnalysis 
} from './types';
import './i18n';

// --- Types ---
type Page = 'landing' | 'auth' | 'language' | 'analysis' | 'summary';
type AuthMode = 'login' | 'signup';

// --- Audio Utilities ---
const calculateJitter = (pitches: number[]) => {
  if (pitches.length < 2) return 0;
  let sumDiff = 0;
  let count = 0;
  for (let i = 1; i < pitches.length; i++) {
    if (pitches[i] > 0 && pitches[i-1] > 0) {
      sumDiff += Math.abs(pitches[i] - pitches[i-1]);
      count++;
    }
  }
  return count > 0 ? (sumDiff / count) / (pitches.reduce((a, b) => a + b, 0) / pitches.length) : 0;
};

const calculateShimmer = (amplitudes: number[]) => {
  if (amplitudes.length < 2) return 0;
  let sumDiff = 0;
  for (let i = 1; i < amplitudes.length; i++) {
    sumDiff += Math.abs(amplitudes[i] - amplitudes[i-1]);
  }
  const avgAmp = amplitudes.reduce((a, b) => a + b, 0) / amplitudes.length;
  return avgAmp > 0 ? (sumDiff / (amplitudes.length - 1)) / avgAmp : 0;
};

// --- Components ---

const Atmosphere = () => (
  <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none">
    <div className="absolute inset-0 bg-silk" />
    <motion.div 
      animate={{ 
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.5, 0.3],
        x: [0, 50, 0],
        y: [0, -30, 0]
      }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-sage/10 blur-[120px]" 
    />
    <motion.div 
      animate={{ 
        scale: [1.2, 1, 1.2],
        opacity: [0.2, 0.4, 0.2],
        x: [0, -40, 0],
        y: [0, 60, 0]
      }}
      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-deep-teal/10 blur-[120px]" 
    />
    <div className="noise fixed inset-0" />
  </div>
);

const GlassCard = ({ children, className = "", onClick }: { children: React.ReactNode, className?: string, onClick?: () => void, key?: React.Key }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    whileHover={onClick ? { y: -8, scale: 1.02 } : {}}
    whileTap={onClick ? { scale: 0.98 } : {}}
    className={`glass rounded-3xl transition-all duration-500 overflow-hidden ${className}`}
    onClick={onClick}
  >
    {children}
  </motion.div>
);

export default function App() {
  const { t, i18n } = useTranslation();

  const resourceData = {
    books: [
      { title: "Mindset", author: "Carol S. Dweck", desc: "The new psychology of success and how we can learn to fulfill our potential." },
      { title: "Deep Work", author: "Cal Newport", desc: "Rules for focused success in a distracted world. Master the art of concentration." },
      { title: "Atomic Habits", author: "James Clear", desc: "An easy and proven way to build good habits and break bad ones." },
      { title: "Man's Search for Meaning", author: "Viktor Frankl", desc: "A psychiatrist's memoir on survival and finding purpose in suffering." },
      { title: "The Power of Now", author: "Eckhart Tolle", desc: "A guide to spiritual enlightenment through living in the present moment." }
    ],
    music: [
      { title: "Lofi Study Beats", url: "https://www.youtube.com/watch?v=jfKfPfyJRdk", desc: "Relaxing beats for focus" },
      { title: "Alpha Waves Focus", url: "https://www.youtube.com/watch?v=vV6S7z_Y0mE", desc: "Deep concentration frequencies" },
      { title: "Classical Study Mix", url: "https://www.youtube.com/watch?v=7P_9hL7W3RE", desc: "Timeless piano for brain power" },
      { title: "Nature Ambience", url: "https://www.youtube.com/watch?v=eKFTSSKCzWA", desc: "Rain and forest sounds" },
      { title: "Jazz for Concentration", url: "https://www.youtube.com/watch?v=26-Y8T__e6M", desc: "Smooth jazz piano vibes" }
    ],
    videos: [
      { title: "Unstoppable Motivation", url: "https://www.youtube.com/watch?v=26U_uo4BvP0", desc: "Morning drive motivation" },
      { title: "Change Your Life", url: "https://www.youtube.com/watch?v=7sXPpA6h0O0", desc: "Effective life changes" },
      { title: "The Secret to Success", url: "https://www.youtube.com/watch?v=T_7_fBvE2oA", desc: "Wisdom for high achievers" },
      { title: "Rise and Shine", url: "https://www.youtube.com/watch?v=XpDPm_pYByc", desc: "Best way to start your day" },
      { title: "Dream Big", url: "https://www.youtube.com/watch?v=pG8v4YAs3Yk", desc: "Inspiration for your goals" }
    ],
    breathing: [
      { title: "4-7-8 Breathing", desc: "Inhale 4s, Hold 7s, Exhale 8s.", detail: "Best for sleep and deep anxiety.", inhale: 4, hold: 7, exhale: 8 },
      { title: "Box Breathing", desc: "In 4s, Hold 4s, Out 4s, Hold 4s.", detail: "Used by Navy SEALs for stress control.", inhale: 4, hold: 4, exhale: 4, holdEnd: 4 },
      { title: "Equal Breathing", desc: "Inhale 5s, Exhale 5s.", detail: "Calms the nervous system and balances energy.", inhale: 5, hold: 0, exhale: 5 },
      { title: "Alternate Nostril", desc: "Breath through one side at a time.", detail: "Resets the mind and improves concentration.", inhale: 4, hold: 4, exhale: 4 },
      { title: "Deep Belly Breathing", desc: "Expand your belly as you inhale.", detail: "The foundation of all relaxation techniques.", inhale: 4, hold: 2, exhale: 6 }
    ]
  };

  const wellnessResources = [
    { id: 'books', label: t('books_for_students'), icon: Library, action: () => setActiveResource('books') },
    { id: 'music', label: t('study_music'), icon: Music, action: () => setActiveResource('music') },
    { id: 'videos', label: t('videos'), icon: Play, action: () => setActiveResource('videos') },
    { id: 'breathing', label: t('quick_breathing'), icon: Wind, action: () => setActiveResource('breathing') }
  ];

  const [page, setPage] = useState<Page>('landing');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authForm, setAuthForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState('text');

  // Text Analysis State
  const [textInput, setTextInput] = useState('');

  // Voice Analysis State
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioFeatures, setAudioFeatures] = useState<any>(null);
  const [recordedAudio, setRecordedAudio] = useState<{ base64: string, features: any } | null>(null);
  const pitchesRef = useRef<number[]>([]);
  const amplitudesRef = useRef<number[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<any>(null);

  // Face Analysis State (Restored for Full Assessment)
  const [faceEmotion, setFaceEmotion] = useState<ModalityResult | null>(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Multimodal Module State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [history, setHistory] = useState<QuestionResult[]>([]);
  const [multimodalResult, setMultimodalResult] = useState<MultimodalAnalysis | null>(null);
  const [finalSummary, setFinalSummary] = useState<FinalSummary | null>(null);
  const [activeResource, setActiveResource] = useState<string | null>(null);
  const [activeBreathingStep, setActiveBreathingStep] = useState<{title: string, inhale: number, hold: number, exhale: number, holdEnd?: number} | null>(null);
  const [breathingPhase, setBreathingPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Ready'>('Ready');

  useEffect(() => {
    if (!activeBreathingStep) return;

    let timer: NodeJS.Timeout;

    if (breathingPhase === 'Inhale') {
      timer = setTimeout(() => {
        if (activeBreathingStep.hold > 0) {
          setBreathingPhase('Hold');
        } else {
          setBreathingPhase('Exhale');
        }
      }, activeBreathingStep.inhale * 1000);
    } else if (breathingPhase === 'Hold') {
      timer = setTimeout(() => {
        setBreathingPhase('Exhale');
      }, activeBreathingStep.hold * 1000);
    } else if (breathingPhase === 'Exhale') {
      timer = setTimeout(() => {
        if (activeBreathingStep.holdEnd && activeBreathingStep.holdEnd > 0) {
          setBreathingPhase('Ready'); // Or loop back to Inhale with a delay
          setTimeout(() => setBreathingPhase('Inhale'), 1000);
        } else {
          setBreathingPhase('Inhale');
        }
      }, activeBreathingStep.exhale * 1000);
    }

    return () => clearTimeout(timer);
  }, [breathingPhase, activeBreathingStep]);

  const questions = [
    "How are you feeling today?",
    "Did anything stress you recently?",
    "What's something that made you smile today?",
    "How do you usually handle difficult emotions?"
  ];

  useEffect(() => {
    if (isRecording) {
      stopRecording();
    }
    setAnalysisResult(null);
    setMultimodalResult(null);
    setTranscript('');
    setRecordedAudio(null);
    setAudioFeatures(null);
    // We keep textInput so user doesn't lose their typing if they switch back and forth
  }, [activeTab]);

  // --- Handlers ---

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js/weights';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
        ]);
        setModelsLoaded(true);
      } catch (err) {
        console.error("Error loading models:", err);
      }
    };
    loadModels();
  }, []);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      toast.error("Camera access denied");
    }
  };

  const stopVideo = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (activeTab === 'assessment' && page === 'analysis' && modelsLoaded) {
      startVideo();
    } else {
      stopVideo();
    }
    
    return () => stopVideo();
  }, [activeTab, page, modelsLoaded]);

  const handleFaceAnalyze = async () => {
    if (!videoRef.current || !modelsLoaded) return null;
    
    try {
      const detection = await faceapi.detectSingleFace(
        videoRef.current, 
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceExpressions();

      if (detection) {
        const expressions = detection.expressions;
        const sorted = Object.entries(expressions).sort((a, b) => b[1] - a[1]);
        const [rawEmotion, confidence] = sorted[0];
        
        let emotionStr = 'Neutral';
        if (rawEmotion === 'happy') emotionStr = 'Happy';
        if (rawEmotion === 'sad') emotionStr = 'Sad';
        if (rawEmotion === 'angry') emotionStr = 'Angry';
        
        const res = { emotion: emotionStr as Emotion, confidence };
        setFaceEmotion(res);
        return res;
      }
    } catch (err) {
      console.error("Face analysis error:", err);
    }
    return { emotion: 'Neutral' as Emotion, confidence: 0 };
  };

  const handleMultimodalAnalyze = async () => {
    if (!recordedAudio || !recordedAudio.base64) {
      toast.error("Please record your response first");
      return;
    }

    if (recordedAudio.base64.length < 500) {
      toast.error("Recording seems too short or failed. Please try again.");
      return;
    }
    
    setLoading(true);
    const loadingToast = toast.loading("Processing your audio, face and text...");
    try {
      // Capture face image at analysis time
      let faceImage = null;
      if (videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          faceImage = canvas.toDataURL('image/jpeg', 0.7);
          setCapturedImage(faceImage);
        }
      }

      // Capture local face metrics
      const faceResult = await handleFaceAnalyze() || { emotion: 'Neutral' as Emotion, confidence: 0 };

      // Gemini multimodal analysis (Voice + Text + Face Image + Face Metrics)
      const result = await analyzeMultimodal(
        faceResult, 
        faceImage,
        recordedAudio.base64, 
        recordedAudio.features, 
        transcript || textInput,
        selectedLanguage
      );
      
      setMultimodalResult(result);
      
      // Trigger breathing exercise if severity is high
      if (result.severity === 'High') {
        const exercise = resourceData.breathing.find(b => b.title === "4-7-8 Breathing");
        if (exercise) {
          setActiveBreathingStep(exercise);
          setBreathingPhase('Inhale');
          setActiveResource('breathing');
          toast.info("High severity detected. Let's try a calming exercise.", { duration: 5000 });
        }
      }

      toast.success("Multimodal analysis complete", { id: loadingToast });
      
      const questionResult: QuestionResult = {
        question: questions[currentQuestionIndex],
        face: faceResult,
        voice: result.voice,
        text: result.text,
        final: result.fusion.final_emotion,
        timestamp: Date.now()
      };
      
      setHistory(prev => [...prev, questionResult]);
    } catch (err) {
      console.error("Multimodal analysis error:", err);
      toast.error("Multimodal analysis failed. Check your microphone and connection.", { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const handleTextAnalyze = async () => {
    if (!textInput.trim()) return;
    setLoading(true);
    try {
      const result = await analyzeText(textInput, selectedLanguage);
      setAnalysisResult(result);
      
      if (result.severity === 'High') {
        const exercise = resourceData.breathing.find(b => b.title === "4-7-8 Breathing");
        if (exercise) {
          setActiveBreathingStep(exercise);
          setBreathingPhase('Inhale');
          setActiveResource('breathing');
          toast.info("High severity detected. Let's synchronize your breath.");
        }
      }
    } catch (err) {
      toast.error("Text analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceAnalyze = async () => {
    if (!recordedAudio) return;
    setLoading(true);
    try {
      const result = await analyzeAudio(recordedAudio.base64, recordedAudio.features, selectedLanguage);
      setAnalysisResult(result);
      if (result.transcript && !transcript) {
        setTranscript(result.transcript);
      }
      
      if (result.severity === 'High') {
        const exercise = resourceData.breathing.find(b => b.title === "4-7-8 Breathing");
        if (exercise) {
          setActiveBreathingStep(exercise);
          setBreathingPhase('Inhale');
          setActiveResource('breathing');
          toast.info("High severity detected. Take a moment to breathe with us.");
        }
      }
    } catch (err) {
      toast.error("Voice analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setMultimodalResult(null);
      setRecordedAudio(null);
      setTranscript('');
      setTextInput('');
    } else {
      handleGenerateSummary();
    }
  };

  const handleGenerateSummary = async () => {
    setLoading(true);
    try {
      const summary = await generateFinalSummary(history, selectedLanguage);
      setFinalSummary(summary);
      setPage('summary');
    } catch (err) {
      toast.error("Failed to generate final summary");
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    setRecordedAudio(null);
    setTranscript('');
    setAudioFeatures(null);
    pitchesRef.current = [];
    amplitudesRef.current = [];
    audioChunksRef.current = [];
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      pitchesRef.current = [];
      amplitudesRef.current = [];
      setTranscript('');

      // Setup Speech Recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = selectedLanguage === 'kn' ? 'kn-IN' : selectedLanguage === 'hi' ? 'hi-IN' : 'en-US';
        
        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              setTranscript(prev => prev + event.results[i][0].transcript);
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
        };
        recognitionRef.current.start();
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      const detector = PitchDetector.forFloat32Array(512);
      const input = new Float32Array(512);

      analyzerRef.current = Meyda.createMeydaAnalyzer({
        audioContext: audioContextRef.current,
        source: source,
        bufferSize: 512,
        featureExtractors: ['mfcc', 'rms', 'zcr'],
        callback: (features) => {
          setAudioFeatures(features);
          
          // Collect pitch
          if (audioContextRef.current) {
            audioContextRef.current.resume();
            const analyserNode = (analyzerRef.current as any)._analyser;
            if (analyserNode) {
              analyserNode.getFloatTimeDomainData(input);
              const [pitch, clarity] = detector.findPitch(input, audioContextRef.current.sampleRate);
              if (clarity > 0.8) {
                pitchesRef.current.push(pitch);
              }
            }
          }
          
          // Collect amplitude
          if (features.rms) {
            amplitudesRef.current.push(features.rms);
          }
        }
      });
      analyzerRef.current.start();

      mediaRecorderRef.current.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          const jitter = calculateJitter(pitchesRef.current);
          const shimmer = calculateShimmer(amplitudesRef.current);
          const avgPitch = pitchesRef.current.length > 0 ? pitchesRef.current.reduce((a, b) => a + b, 0) / pitchesRef.current.length : 0;
          
          const finalFeatures = {
            ...audioFeatures,
            jitter,
            shimmer,
            pitch: avgPitch,
            transcript: transcript
          };
          
          setRecordedAudio({ base64, features: finalFeatures });
        };
        stream.getTracks().forEach(track => track.stop());
        analyzerRef.current.stop();
        recognitionRef.current?.stop();
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      toast.error("Microphone access denied");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  // --- Render Helpers ---

  const renderAuth = () => (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden">
      <div className="absolute top-8 left-8 z-20">
        <Button 
          variant="ghost" 
          className="rounded-full text-dark-blue hover:text-dark-blue/90 hover:bg-blue-50 h-10 px-5 font-bold uppercase tracking-widest text-[10px] transition-all bg-blue-50/50" 
          onClick={() => setPage('landing')}
        >
          <ChevronLeft size={16} className="mr-1" /> {t('back')}
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <GlassCard className="p-10 bg-white/60 backdrop-blur-3xl shadow-2xl border-none space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-4xl font-serif text-[#1a3a6d]">
              {authMode === 'login' ? 'Welcome Back' : 'Join MindCare'}
            </h2>
            <p className="text-[#2d5da1] opacity-70">
              {authMode === 'login' 
                ? 'Sign in to access your emotional wellness dashboard' 
                : 'Create an account to track your wellness journey'}
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                placeholder="JohnDoe" 
                className="rounded-xl h-12 bg-white/50 border-blue-100"
                value={authForm.username}
                onChange={(e) => setAuthForm({...authForm, username: e.target.value})}
              />
            </div>

            {authMode === 'signup' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2"
              >
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="john@example.com" 
                  className="rounded-xl h-12 bg-white/50 border-blue-100"
                  value={authForm.email}
                  onChange={(e) => setAuthForm({...authForm, email: e.target.value})}
                />
              </motion.div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                className="rounded-xl h-12 bg-white/50 border-blue-100"
                value={authForm.password}
                onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
              />
            </div>

            {authMode === 'signup' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2"
              >
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  className="rounded-xl h-12 bg-white/50 border-blue-100"
                  value={authForm.confirmPassword}
                  onChange={(e) => setAuthForm({...authForm, confirmPassword: e.target.value})}
                />
              </motion.div>
            )}
          </div>

          <Button 
            className="w-full h-12 rounded-xl bg-dark-blue text-white font-bold text-lg shadow-lg hover:bg-dark-blue/90 transition-all"
            onClick={() => {
              if (!authForm.username || !authForm.password) {
                toast.error("Please fill in all fields");
                return;
              }
              if (authMode === 'signup' && authForm.password !== authForm.confirmPassword) {
                toast.error("Passwords do not match");
                return;
              }
              setLoading(true);
              setTimeout(() => {
                setLoading(false);
                toast.success(authMode === 'login' ? 'Welcome back!' : 'Account created successfully!');
                setPage('language');
              }, 1000);
            }}
            disabled={loading}
          >
            {loading ? 'Processing...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
          </Button>

          <div className="text-center text-sm">
            <span className="text-[#2d5da1] opacity-60">
              {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button 
              className="text-[#1a3a6d] font-bold hover:underline"
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
            >
              {authMode === 'login' ? 'Sign Up' : 'Log In'}
            </button>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );

  const renderLanding = () => (
    <div className="min-h-screen bg-[#dce9f9] flex flex-col items-center px-3 sm:px-4 md:px-6">
      <div className="min-h-screen w-full flex flex-col items-center justify-center py-8 sm:py-12 md:py-24">
        <div className="max-w-4xl w-full text-center space-y-6 sm:space-y-8 md:space-y-12">
        {/* Main Title */}
        <motion.div
           initial={{ opacity: 0, y: -20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 1 }}
        >
          <h1 className="text-[16vw] sm:text-[12vw] md:text-[8vw] lg:text-[6vw] font-serif tracking-tight text-[#1a3a6d] leading-none mb-3 sm:mb-4">
            MindCare
          </h1>
        </motion.div>

        {/* Description */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-[#2d5da1] max-w-2xl sm:max-w-3xl mx-auto font-light leading-snug px-2 sm:px-4"
        >
          Your personal student emotional wellness companion. Analyze your emotions through text, voice, and multimodal analysis for personalized wellness support.
        </motion.p>

        {/* Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 1 }}
          className="flex flex-col items-center gap-4 sm:gap-6 w-full max-w-sm mx-auto"
        >
          <Button 
            variant="outline"
            className="w-full sm:w-64 h-12 sm:h-14 rounded-2xl border-2 border-dark-blue text-dark-blue text-base sm:text-xl font-medium hover:bg-dark-blue/5 transition-all bg-transparent"
            onClick={() => setPage('auth')}
          >
            Sign In
          </Button>

          <Button 
            className="w-full sm:w-72 h-12 sm:h-14 rounded-2xl bg-dark-blue hover:bg-dark-blue/90 text-white text-base sm:text-xl font-medium flex items-center justify-center gap-2 sm:gap-3 soft-shadow"
            onClick={() => {
              const el = document.getElementById('features');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Explore Features <ChevronRight size={18} sm:size={24} />
          </Button>
        </motion.div>
      </div>
    </div>

      {/* Landing page features section starts below */}
      <section id="features" className="w-full max-w-7xl mx-auto py-8 sm:py-12 md:py-24 space-y-8 sm:space-y-12 md:space-y-16">
        <div className="text-center px-4">
           <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-serif text-[#1a3a6d] tracking-tight mb-3 sm:mb-4">
             {t('our_features')}
           </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 px-4 sm:px-6">
          {[
            { 
              title: t('text_analysis'), 
              desc: t('text_analysis_desc'), 
              icon: MessageSquare, 
              color: 'bg-[#eff6ff]', 
              iconColor: 'text-blue-500' 
            },
            { 
              title: t('voice_analysis'), 
              desc: t('voice_analysis_desc'), 
              icon: Mic, 
              color: 'bg-[#f0fdf4]', 
              iconColor: 'text-green-500' 
            },
            { 
              title: t('multimodal_analysis'), 
              desc: t('multimodal_analysis_desc'), 
              icon: Brain, 
              color: 'bg-[#faf5ff]', 
              iconColor: 'text-purple-500' 
            },
            { 
              title: t('emotion_analysis'), 
              desc: t('emotion_analysis_desc'), 
              icon: Activity, 
              color: 'bg-[#fdf2f8]', 
              iconColor: 'text-pink-500' 
            },
            { 
              title: t('severity_analysis'), 
              desc: t('severity_analysis_desc'), 
              icon: AlertTriangle, 
              color: 'bg-[#fffbeb]', 
              iconColor: 'text-amber-500' 
            },
            { 
              title: t('wellness_suggestions'), 
              desc: t('wellness_suggestions_desc'), 
              icon: Heart, 
              color: 'bg-[#f0f9ff]', 
              iconColor: 'text-red-500' 
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] p-4 sm:p-6 md:p-10 flex flex-col items-center text-center space-y-4 sm:space-y-6 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.1)] transition-all duration-500 border border-transparent hover:border-blue-100 group"
            >
              <div className={`w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 ${feature.color} rounded-xl sm:rounded-2xl md:rounded-3xl flex items-center justify-center transition-transform duration-500 group-hover:scale-110 shadow-sm`}>
                <feature.icon size={28} sm:size={32} md:size={36} className={feature.iconColor} />
              </div>
              <div className="space-y-2 sm:space-y-3 md:space-y-4">
                <h3 className="text-lg sm:text-xl md:text-2xl font-serif text-[#1a3a6d]">
                  {feature.title}
                </h3>
                <p className="text-[#2d5da1] font-light leading-relaxed text-sm sm:text-base md:text-lg">
                  {feature.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center pt-6 sm:pt-8 px-4">
           <Button 
            className="h-12 sm:h-16 px-6 sm:px-12 rounded-2xl bg-[#6366f1] hover:bg-[#6366f1]/90 text-white text-base sm:text-xl font-medium flex items-center justify-center gap-2 sm:gap-3 soft-shadow transition-all hover:scale-105 active:scale-95 w-full sm:w-auto"
            onClick={() => setPage('language')}
          >
            {t('start_analysis')} <ChevronRight size={18} sm:size={24} />
          </Button>
        </div>
      </section>
    </div>
  );

  const renderLanguage = () => {
    const languages = [
      { 
        code: 'en', 
        name: 'English', 
        region: 'US', 
        desc: 'Global language for international communication' 
      },
      { 
        code: 'hi', 
        name: 'हिन्दी', 
        region: 'IN', 
        desc: 'Hindi - Major Indian language' 
      },
      { 
        code: 'kn', 
        name: 'ಕನ್ನಡ', 
        region: 'IN', 
        desc: 'Kannada - Regional language for Karnataka' 
      }
    ];

    return (
      <div className="flex flex-col items-center justify-center min-h-screen relative px-6 py-6 overflow-hidden bg-[#dce9f9]">
        <div className="absolute top-8 left-8 z-20">
          <Button 
            variant="ghost" 
            className="rounded-full text-dark-blue hover:text-dark-blue/90 hover:bg-blue-50 h-10 px-5 font-bold uppercase tracking-widest text-[10px] transition-all bg-blue-50/50" 
            onClick={() => setPage('auth')}
          >
            <ChevronLeft size={16} className="mr-1" /> {t('back')}
          </Button>
        </div>

        <div className="w-full max-w-2xl relative z-10 flex flex-col gap-4 sm:gap-5">
          {languages.map((lang, i) => (
            <motion.div
              key={lang.code}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => {
                setSelectedLanguage(lang.code);
                i18n.changeLanguage(lang.code);
              }}
              className={`relative flex items-center p-5 sm:p-8 rounded-[1.25rem] sm:rounded-[1.5rem] cursor-pointer transition-all duration-300 border-[3px] ${
                selectedLanguage === lang.code 
                  ? 'bg-indigo-50 border-[#6366f1] shadow-2xl shadow-indigo-500/10' 
                  : 'bg-white border-transparent hover:border-indigo-100 shadow-md hover:shadow-lg'
              }`}
            >
              {/* Region */}
              <div className={`text-3xl sm:text-5xl font-bold tracking-tighter mr-5 sm:mr-8 transition-colors ${
                selectedLanguage === lang.code ? 'text-[#6366f1]' : 'text-[#1a3a6d]/40'
              }`}>
                {lang.region}
              </div>

              {/* Content */}
              <div className="flex-1 space-y-0.5 sm:space-y-1">
                <h3 className={`text-xl sm:text-3xl font-medium transition-colors ${
                  selectedLanguage === lang.code ? 'text-indigo-900' : 'text-[#1a3a6d]/80'
                }`}>
                  {lang.name}
                </h3>
                <p className={`text-sm sm:text-base font-light transition-colors ${
                  selectedLanguage === lang.code ? 'text-[#6366f1]' : 'text-[#2d5da1]/60'
                }`}>
                  {lang.desc}
                </p>
              </div>

              {/* Selection Indicator */}
              <div className={`w-8 h-8 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center transition-all ${
                selectedLanguage === lang.code 
                  ? 'border-[#6366f1] bg-[#6366f1]' 
                  : 'border-slate-200 bg-transparent'
              }`}>
                {selectedLanguage === lang.code && (
                  <div className="w-3 h-3 sm:w-5 sm:h-5 rounded-full bg-white shadow-sm" />
                )}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          animate={{ opacity: selectedLanguage ? 1 : 0 }}
          className="mt-12 relative z-10"
        >
          <Button 
            size="lg" 
            disabled={!selectedLanguage}
            className="bg-dark-blue hover:bg-dark-blue/90 text-white px-20 h-16 rounded-2xl text-xl font-medium shadow-lg transition-all hover:scale-105 active:scale-95"
            onClick={() => setPage('analysis')}
          >
            {t('proceed')} <ChevronRight className="ml-4" />
          </Button>
        </motion.div>
      </div>
    );
  };


  const renderAnalysis = () => {
    return (
      <div className="py-4 sm:py-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto px-4 sm:px-6">
        {/* Customized Tabs Navigation */}
        <div className="w-full bg-white rounded-2xl p-1 shadow-sm border border-indigo-50 flex gap-1 sm:gap-2">
          {[
            { value: 'text', label: t('text_analysis_tab') },
            { value: 'voice', label: t('voice_analysis_tab') },
            { value: 'assessment', label: t('multimodal_tab') }
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex-1 py-3 sm:py-4 rounded-xl text-sm sm:text-lg font-medium transition-all ${
                activeTab === tab.value 
                  ? 'bg-dark-blue text-white shadow-lg' 
                  : 'text-[#1a3a6d]/60 hover:text-[#1a3a6d] hover:bg-indigo-50/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-[1fr_400px] gap-6 sm:gap-8 items-start">
          {/* Main Content Area */}
          <GlassCard className="p-4 sm:p-6 md:p-10 bg-white/70 border-[2px] sm:border-[3px] border-indigo-100/50 min-h-[400px] sm:min-h-[500px] md:min-h-[600px] flex flex-col">
            <div className="flex-1 space-y-6 sm:space-y-8">
              {activeTab === 'text' && (
                <div className="space-y-3 sm:space-y-6">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-serif text-[#1a3a6d]">{t('enter_your_text')}</h3>
                  <textarea 
                    className="w-full h-48 sm:h-64 md:h-80 p-4 sm:p-6 md:p-8 rounded-[1rem] sm:rounded-[1.5rem] md:rounded-[2rem] bg-indigo-50/30 border-2 border-indigo-100/50 focus:border-[#1e6efd] focus:ring-4 focus:ring-blue-100 outline-none transition-all resize-none text-lg sm:text-xl md:text-2xl font-light text-[#1a3a6d] placeholder:opacity-30"
                    placeholder={t('describe_emotions')}
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                  />
                  <Button 
                    className="w-full h-12 sm:h-16 md:h-20 rounded-[1rem] sm:rounded-[1.25rem] md:rounded-[1.5rem] bg-dark-blue hover:bg-dark-blue/90 text-white text-base sm:text-xl md:text-2xl font-bold tracking-tight shadow-xl shadow-blue-200 transition-all active:scale-95 disabled:grayscale"
                    onClick={handleTextAnalyze}
                    disabled={loading || !textInput.trim()}
                  >
                    {loading ? t('analyzing') : t('analyze_text')}
                  </Button>
                </div>
              )}
              {activeTab === 'voice' && (
                <div className="space-y-6 sm:space-y-12 flex flex-col items-center justify-center h-full py-4 sm:py-12">
                   <div className="text-center space-y-2 sm:space-y-4">
                     <h3 className="text-xl sm:text-2xl md:text-4xl font-serif text-[#1a3a6d]">{t('voice_emotion_analysis')}</h3>
                     <p className="text-[#2d5da1] opacity-60 text-base sm:text-lg md:text-xl font-light">{t('record_voice_desc')}</p>
                   </div>
 
                   <div className="relative group">
                     <div className={`absolute -inset-8 sm:-inset-16 bg-blue-400/20 rounded-full blur-[40px] sm:blur-[60px] md:blur-[100px] transition-opacity duration-1000 ${isRecording ? 'opacity-100 animate-pulse' : 'opacity-0'}`} />
                     <motion.button 
                       whileHover={{ scale: 1.05 }}
                       whileTap={{ scale: 0.95 }}
                       className={`w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 rounded-full flex items-center justify-center shadow-3xl relative z-10 transition-colors duration-500 ${
                         isRecording ? 'bg-red-500 text-white' : 'bg-white text-[#1e6efd] border-4 border-indigo-50'
                       }`}
                       onClick={isRecording ? stopRecording : startRecording}
                     >
                       {isRecording ? (
                         <div className="flex gap-1 sm:gap-1.5 md:gap-2 items-end h-8 sm:h-12 md:h-16">
                           {[...Array(5)].map((_, i) => (
                             <motion.div
                               key={i}
                               animate={{ height: [12, 35, 16, 45, 12] }}
                               transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                               className="w-1.5 sm:w-2 md:w-2.5 bg-white rounded-full"
                             />
                           ))}
                         </div>
                       ) : (
                         <Mic size={40} sm:size={60} md:size={100} />
                       )}
                     </motion.button>
                   </div>
 
                   {recordedAudio && !loading && (
                     <Button 
                       className="h-12 sm:h-16 md:h-20 px-6 sm:px-10 md:px-16 rounded-full bg-dark-blue hover:bg-dark-blue/90 text-white text-base sm:text-lg md:text-xl font-bold shadow-xl transition-all hover:scale-105"
                       onClick={handleVoiceAnalyze}
                     >
                       {t('analyze')}
                     </Button>
                   )}
                </div>
              )}
              {activeTab === 'assessment' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center mb-6 sm:mb-8">
                    <span className="px-5 py-2 bg-[#1a3a6d] text-white rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest">
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </span>
                  </div>
                  
                  <h3 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#1a3a6d] leading-tight min-h-[100px] sm:min-h-[120px]">
                    {questions[currentQuestionIndex]}
                  </h3>
 
                  <div className="relative aspect-video rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden bg-slate-900 border-4 sm:border-8 border-white shadow-2xl">
                    <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 flex items-center justify-center">
                       {isRecording ? (
                         <div className="flex gap-1.5 sm:gap-3 items-end h-8 sm:h-10">
                            {[...Array(12)].map((_, i) => (
                              <motion.div key={i} animate={{ height: [8, 30, 15, 25, 8] }} transition={{ repeat: Infinity, duration: 0.4, delay: i * 0.04 }} className="w-0.5 sm:w-1 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                            ))}
                         </div>
                       ) : <div className="text-white/20 font-serif text-lg sm:text-2xl uppercase tracking-[0.2em] italic">Telemetry Ready</div>}
                    </div>
                  </div>
 
                  <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 mt-6 sm:mt-8">
                    {!recordedAudio && (
                      <Button 
                        size="lg"
                        className={`h-16 sm:h-20 px-10 sm:px-16 rounded-full text-lg sm:text-xl font-bold transition-all shadow-xl ${
                          isRecording ? 'bg-red-500 text-white' : 'bg-white text-[#1a3a6d] border-2 border-indigo-100 hover:bg-indigo-50'
                        }`}
                        onClick={isRecording ? stopRecording : startRecording}
                      >
                        {isRecording ? 'Stop Recording' : 'Record Answer'}
                      </Button>
                    )}
 
                    {recordedAudio && !multimodalResult && (
                      <Button 
                        size="lg"
                        className="h-16 sm:h-20 px-10 sm:px-16 bg-dark-blue hover:bg-dark-blue/90 text-white rounded-full text-lg sm:text-xl font-bold shadow-xl shadow-blue-200 transition-all hover:scale-105"
                        onClick={handleMultimodalAnalyze}
                        disabled={loading}
                      >
                        {loading ? 'Processing...' : 'Analyze Multimodal'}
                      </Button>
                    )}
 
                    {multimodalResult && (
                      <Button 
                        size="lg"
                        className="h-16 sm:h-20 px-10 sm:px-16 bg-[#1a3a6d] text-white rounded-full text-lg sm:text-xl font-bold shadow-xl transition-all"
                        onClick={handleNextQuestion}
                      >
                        {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Complete Assessment'}
                      </Button>
                    )}
                  </div>
 
                  {multimodalResult && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-6 sm:mt-8 p-5 sm:p-8 bg-white/50 rounded-[1.5rem] sm:rounded-3xl border-2 border-indigo-100 space-y-6"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Unified Analysis</p>
                          <h4 className="text-3xl sm:text-4xl font-serif text-[#1a3a6d]">{multimodalResult.fusion.final_emotion}</h4>
                        </div>
                        <div className="flex gap-2 sm:gap-4 items-start w-full sm:w-auto overflow-x-auto sm:overflow-visible">
                          {!(multimodalResult.fusion.final_emotion === 'Neutral' || multimodalResult.fusion.final_emotion === 'Happy') && (
                            <div className="text-right px-3 py-1.5 sm:px-4 sm:py-2 bg-rose-50 rounded-xl border border-rose-100 flex-shrink-0">
                               <p className="text-[8px] sm:text-[10px] font-bold text-rose-400 uppercase tracking-widest">Severity</p>
                               <p className={`text-lg sm:text-xl font-bold ${multimodalResult.severity === 'High' ? 'text-rose-600' : 'text-rose-400'}`}>{multimodalResult.severity}</p>
                            </div>
                          )}
                          <div className="text-right px-3 py-1.5 sm:px-4 sm:py-2 bg-indigo-50/50 rounded-xl border border-indigo-100 flex-shrink-0">
                            <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Authenticity</p>
                            <p className="text-lg sm:text-2xl font-bold text-indigo-600">{Math.round(multimodalResult.fusion.authenticity_score * 100)}%</p>
                          </div>
                        </div>
                      </div>

                      {multimodalResult.suggestions && multimodalResult.suggestions.length > 0 && (
                        <div className="space-y-3">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Immediate Well-being Suggestions</p>
                           <div className="grid gap-2 sm:gap-3">
                              {multimodalResult.suggestions.map((s, i) => (
                                <div key={i} className="text-base sm:text-lg font-light text-[#2d5da1] italic border-l-4 border-indigo-200 pl-4 sm:pl-6 py-1.5 sm:py-2">
                                  "{s}"
                                </div>
                              ))}
                           </div>
                        </div>
                      )}

                      {multimodalResult.masking?.detected ? (
                        <div className="p-5 sm:p-6 bg-rose-50 rounded-2xl border border-rose-100 space-y-3">
                          <div className="flex items-center gap-3 text-rose-600">
                            <AlertTriangle size={20} sm:size={24} />
                            <span className="font-bold uppercase tracking-widest text-[10px] sm:text-xs">Deep Masking Detected</span>
                          </div>
                          <p className="text-rose-900 font-light italic leading-relaxed text-base sm:text-lg">
                            {multimodalResult.masking.explanation || multimodalResult.fusion.conflict_message}
                          </p>
                          <div className="flex flex-wrap gap-4 pt-2">
                             <div className="px-4 py-2 bg-white/60 rounded-xl">
                               <p className="text-[8px] sm:text-[10px] text-slate-500 uppercase font-bold mb-1">Authenticity Score</p>
                               <div className="flex items-center gap-2">
                                  <div className="w-20 sm:w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                                     <div 
                                      className={`h-full transition-all ${multimodalResult.masking.authenticity_score < 0.4 ? 'bg-rose-500' : 'bg-amber-500'}`} 
                                      style={{ width: `${multimodalResult.masking.authenticity_score * 100}%` }}
                                     />
                                  </div>
                                  <span className="text-xs sm:text-sm font-bold text-slate-700">{Math.round(multimodalResult.masking.authenticity_score * 100)}%</span>
                               </div>
                             </div>
                          </div>
                        </div>
                      ) : multimodalResult.fusion.conflict && (
                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4 items-center">
                          <AlertTriangle className="text-amber-500 flex-shrink-0" size={24} />
                          <p className="text-amber-700 font-medium italic">{multimodalResult.fusion.conflict_message}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 sm:p-6 bg-white/50 rounded-2xl border border-indigo-50 shadow-sm">
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Face</p>
                            <span className="text-[10px] font-bold text-indigo-400">{Math.round(multimodalResult.face.confidence * 100)}%</span>
                          </div>
                          <p className="text-lg sm:text-xl font-bold text-[#1a3a6d]">{multimodalResult.face.emotion}</p>
                        </div>
                        <div className="p-4 sm:p-6 bg-white/50 rounded-2xl border border-indigo-50 shadow-sm">
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Voice</p>
                            <span className="text-[10px] font-bold text-indigo-400">{Math.round(multimodalResult.voice.confidence * 100)}%</span>
                          </div>
                          <p className="text-lg sm:text-xl font-bold text-[#1a3a6d]">{multimodalResult.voice.emotion}</p>
                        </div>
                        <div className="p-4 sm:p-6 bg-white/50 rounded-2xl border border-indigo-50 shadow-sm">
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Text</p>
                            <span className="text-[10px] font-bold text-indigo-400">{Math.round(multimodalResult.text.confidence * 100)}%</span>
                          </div>
                          <p className="text-lg sm:text-xl font-bold text-[#1a3a6d]">{multimodalResult.text.emotion}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            {analysisResult && (activeTab === 'text' || activeTab === 'voice') && (
               <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 sm:mt-12 p-5 sm:p-8 bg-indigo-50/50 rounded-[1.5rem] sm:rounded-3xl border border-indigo-100 space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] sm:text-xs font-bold text-[#1e6efd] uppercase tracking-widest">{t('detected_emotion')}</p>
                      <h4 className="text-4xl sm:text-5xl font-serif text-[#1a3a6d]">{analysisResult.emotion || 'Unknown'}</h4>
                    </div>
                    {!(analysisResult.emotion === 'Neutral' || analysisResult.emotion === 'Happy') && (
                      <div className="px-4 py-2 sm:px-6 sm:py-3 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-indigo-50">
                        <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('severity')}</p>
                        <span className={`text-lg sm:text-xl font-serif ${analysisResult.severity === 'High' ? 'text-red-500' : 'text-indigo-600'}`}>
                          {analysisResult.severity || 'Medium'}
                        </span>
                      </div>
                    )}
                  </div>

                  {analysisResult.masking?.detected && (
                    <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100 space-y-2">
                      <div className="flex items-center gap-3 text-rose-600">
                        <AlertTriangle size={20} />
                        <span className="font-bold uppercase tracking-widest text-xs">Emotion Masking Detected</span>
                      </div>
                      <p className="text-rose-900 font-light italic leading-relaxed">
                        {analysisResult.masking.explanation}
                      </p>
                      <div className="flex gap-4 pt-2">
                         <div className="px-3 py-1 bg-white/50 rounded-lg text-[10px] text-slate-500 uppercase font-bold">Vocal: {analysisResult.masking.vocalEmotion}</div>
                         <div className="px-3 py-1 bg-white/50 rounded-lg text-[10px] text-slate-500 uppercase font-bold">Content: {analysisResult.masking.semanticEmotion}</div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'voice' && analysisResult.transcript && (
                    <div className="p-6 bg-white/50 rounded-2xl border border-indigo-50">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Transcript</p>
                      <p className="text-xl font-light text-[#2d5da1] italic">"{analysisResult.transcript}"</p>
                    </div>
                  )}

                  {activeTab === 'voice' && recordedAudio?.features && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                       <div className="p-4 bg-white/50 rounded-2xl border border-indigo-50 text-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Jitter</p>
                          <p className="text-lg font-bold text-[#1a3a6d]">{(recordedAudio.features.jitter * 100).toFixed(2)}%</p>
                       </div>
                       <div className="p-4 bg-white/50 rounded-2xl border border-indigo-50 text-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Shimmer</p>
                          <p className="text-lg font-bold text-[#1a3a6d]">{(recordedAudio.features.shimmer * 100).toFixed(2)}%</p>
                       </div>
                       <div className="p-4 bg-white/50 rounded-2xl border border-indigo-50 text-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Pitch</p>
                          <p className="text-lg font-bold text-[#1a3a6d]">{Math.round(recordedAudio.features.pitch)} Hz</p>
                       </div>
                       <div className="p-4 bg-white/50 rounded-2xl border border-indigo-50 text-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Energy</p>
                          <p className="text-lg font-bold text-[#1a3a6d]">{recordedAudio.features.energy?.toFixed(3) || '0.000'}</p>
                       </div>
                    </div>
                  )}

                  {analysisResult.suggestions && analysisResult.suggestions.length > 0 && (
                    <div className="grid gap-3">
                      {analysisResult.suggestions.slice(0, 3).map((s, i) => (
                        <div key={i} className="text-lg font-light text-[#2d5da1] italic border-l-4 border-indigo-200 pl-6 py-2">
                          "{s}"
                        </div>
                      ))}
                    </div>
                  )}
               </motion.div>
            )}
          </GlassCard>
             {/* Right Widget: Wellness Resources */}
          <GlassCard className="p-4 sm:p-6 md:p-10 bg-white/70 border-none shadow-xl border border-indigo-100 space-y-4 sm:space-y-6 md:space-y-8 h-fit">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="p-2 sm:p-3 md:p-4 bg-blue-50 text-[#1e6efd] rounded-lg sm:rounded-xl md:rounded-2xl">
                <Heart size={20} sm:size={24} md:size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-serif text-[#1a3a6d] leading-none">{t('feeling_heavy')}</h3>
                <p className="text-[#2d5da1]/60 font-light text-sm sm:text-base md:text-lg">{t('student_wellness_resources')}</p>
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3 md:space-y-4">
              {wellnessResources.map((resource) => (
                <motion.button
                  key={resource.id}
                  whileHover={{ x: 5, sm: { x: 10 }, backgroundColor: '#eff6ff' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={resource.action}
                  className="w-full h-12 sm:h-16 md:h-20 px-4 sm:px-6 md:px-8 rounded-lg sm:rounded-xl md:rounded-2xl bg-indigo-50/30 border-2 border-indigo-100/30 flex items-center gap-3 sm:gap-4 md:gap-6 text-base sm:text-lg md:text-xl font-medium text-[#1a3a6d] transition-all hover:border-[#1e6efd]/20 group"
                >
                  <div className="w-8 sm:w-10 md:w-12 h-8 sm:h-10 md:h-12 flex items-center justify-center text-[#1e6efd] transition-transform group-hover:scale-110">
                    <resource.icon size={20} sm:size={24} md:size={28} />
                  </div>
                  <span className="text-sm sm:text-base md:text-lg">{resource.label}</span>
                </motion.button>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Resource Dialog */}
        <Dialog open={!!activeResource} onOpenChange={() => setActiveResource(null)}>
          <DialogContent className="w-[95vw] sm:max-w-2xl bg-white/95 backdrop-blur-2xl border-indigo-100 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10">
            <DialogHeader className="space-y-2 mb-4 sm:mb-6">
              <DialogTitle className="text-2xl sm:text-4xl font-serif text-[#1a3a6d]">
                {activeResource === 'books' && t('books_for_students')}
                {activeResource === 'music' && t('study_music')}
                {activeResource === 'videos' && t('videos')}
                {activeResource === 'breathing' && t('quick_breathing')}
              </DialogTitle>
              <DialogDescription className="text-lg sm:text-xl font-light text-[#2d5da1]/60">
                Curated resources to support your well-being.
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[70vh] pr-4 sm:pr-6">
              <div className="space-y-4 sm:space-y-6">
                {activeResource === 'breathing' && activeBreathingStep && (
                  <div className="flex flex-col items-center justify-center p-6 sm:p-12 bg-white rounded-[2rem] sm:rounded-[3rem] shadow-inner mb-6 sm:mb-8 border-2 border-indigo-50 relative overflow-hidden">
                    <div className="absolute inset-0 bg-indigo-50/10 pointer-events-none" />
                    
                    {/* Breathing Circle */}
                    <div className="relative w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center">
                      <motion.div 
                        animate={{ 
                          scale: breathingPhase === 'Inhale' ? 1.5 : (breathingPhase === 'Exhale' ? 0.8 : (breathingPhase === 'Hold' ? 1.5 : 1)),
                          backgroundColor: breathingPhase === 'Inhale' ? '#6366f1' : (breathingPhase === 'Exhale' ? '#818cf8' : (breathingPhase === 'Hold' ? '#4f46e5' : '#e0e7ff'))
                        }}
                        transition={{ 
                          duration: breathingPhase === 'Inhale' ? activeBreathingStep.inhale : (breathingPhase === 'Exhale' ? activeBreathingStep.exhale : 0.5),
                          ease: "easeInOut"
                        }}
                        className="w-32 h-32 sm:w-40 sm:h-40 rounded-full flex items-center justify-center shadow-2xl relative z-10"
                      >
                        <span className="text-white text-xl sm:text-2xl font-bold uppercase tracking-widest">{breathingPhase}</span>
                      </motion.div>
                      
                      {/* Pulse Ring */}
                      <motion.div 
                        animate={{ scale: [1, 2], opacity: [0.3, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-indigo-200"
                      />
                    </div>

                    <div className="mt-6 sm:mt-8 text-center space-y-2 relative z-10">
                      <h4 className="text-xl sm:text-2xl font-serif text-[#1a3a6d]">{activeBreathingStep.title}</h4>
                      <p className="text-sm sm:text-base text-[#2d5da1]/60">{activeBreathingStep.detail}</p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-4 text-indigo-600 hover:text-indigo-800"
                        onClick={() => {
                          setActiveBreathingStep(null);
                          setBreathingPhase('Ready');
                        }}
                      >
                        Reset Exercise
                      </Button>
                    </div>
                  </div>
                )}

                {activeResource && (resourceData as any)[activeResource].map((item: any, i: number) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-indigo-50/30 border border-indigo-100/50 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 transition-all group cursor-pointer"
                    onClick={() => {
                      if (activeResource === 'breathing') {
                        setActiveBreathingStep(item);
                        setBreathingPhase('Inhale');
                      }
                    }}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1 flex-1">
                        <h4 className="text-xl sm:text-2xl font-medium text-[#1a3a6d] group-hover:text-[#1e6efd] transition-colors">{item.title}</h4>
                        {item.author && <p className="text-blue-600 font-medium text-xs sm:text-sm">by {item.author}</p>}
                        <p className="text-base sm:text-lg font-light text-[#2d5da1] leading-relaxed">{item.desc}</p>
                        {item.detail && <p className="text-xs sm:text-sm font-medium text-indigo-400 mt-2">{item.detail}</p>}
                      </div>
                      {(item.url || activeResource === 'breathing') && (
                        <div 
                          className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-white shadow-sm text-dark-blue hover:bg-dark-blue hover:text-white transition-all flex-shrink-0"
                          onClick={(e) => {
                            if (item.url) {
                              e.stopPropagation();
                              window.open(item.url, '_blank');
                            }
                          }}
                        >
                          {activeResource === 'breathing' ? <Wind size={18} sm:size={20} /> : <Play size={18} sm:size={20} />}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    );
  };

  const renderSummary = () => (
    <div className="max-w-6xl mx-auto py-6 sm:py-8 space-y-6 sm:space-y-8 relative overflow-hidden px-4 sm:px-6">
      <div className="text-center space-y-4 sm:space-y-6 relative z-10">
        <div className="space-y-2 sm:space-y-4">
          <p className="text-[8px] sm:text-[10px] font-bold text-sage uppercase tracking-[0.6em]">{t('assessment')}</p>
          <h2 className="text-4xl sm:text-6xl md:text-8xl font-serif text-obsidian tracking-tighter leading-tight italic select-none">
            Final Synthesis
          </h2>
        </div>
        <p className="text-obsidian/60 text-lg sm:text-xl font-light max-w-2xl mx-auto leading-relaxed opacity-70">
          Integrated emotional report across linguistic, aural, and optical dimensions.
        </p>
      </div>

      {finalSummary && (
        <div className="grid lg:grid-cols-12 gap-12 relative z-10">
          <div className="lg:col-span-12">
            <GlassCard className="p-6 sm:p-12 space-y-12 sm:space-y-16 border-none soft-shadow bg-white/40 backdrop-blur-3xl rounded-[2rem] sm:rounded-[3rem]">
              <div className="grid lg:grid-cols-2 gap-8 sm:gap-12">
                <div className="space-y-6 sm:space-y-8">
                  <div className="space-y-2 sm:space-y-3">
                    <p className="text-[10px] text-sage font-bold uppercase tracking-[0.4em]">Core Narrative</p>
                    <p className="text-5xl sm:text-7xl font-serif text-obsidian leading-[0.8] tracking-tighter italic">{finalSummary.overall_emotion}</p>
                  </div>
                  <p className="text-lg sm:text-xl text-obsidian/60 leading-relaxed font-light italic opacity-80 border-l border-sage/20 pl-6 sm:pl-8">
                    "{finalSummary.emotion_trend}"
                  </p>
                </div>
                
                <div className="space-y-8 sm:space-y-10 bg-obsidian text-silk p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 sm:p-8 opacity-10">
                    <Activity size={60} sm:size={80} />
                  </div>
                  <div className="space-y-4 sm:space-y-6 relative z-10">
                    <h3 className="text-lg sm:text-xl font-serif italic text-sage">{t('key_observations')}</h3>
                    <div className="space-y-3 sm:space-y-4">
                      {finalSummary.observations.map((obs: string, i: number) => (
                        <motion.div 
                          key={i} 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="text-sm sm:text-base text-silk/70 leading-relaxed font-light border-b border-silk/10 pb-2 sm:pb-3"
                        >
                          {obs}
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {finalSummary.conflict_detected && finalSummary.masking_analysis && (
                    <div className="mt-8 p-6 bg-sage/10 rounded-3xl border border-sage/20 space-y-3">
                       <div className="flex items-center gap-2 text-sage">
                          <AlertTriangle size={18} />
                          <p className="text-xs font-bold uppercase tracking-widest">Consistency Assessment</p>
                       </div>
                       <p className="text-silk/60 font-light italic text-sm leading-relaxed">
                          {finalSummary.masking_analysis}
                       </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-12 sm:gap-16 pt-8 sm:pt-12 border-t border-obsidian/[0.05]">
                <div className="space-y-8 sm:space-y-10">
                   <h3 className="text-xl sm:text-2xl font-serif text-obsidian italic">{t('wellness_path')}</h3>
                   <div className="grid gap-3 sm:gap-4">
                      {finalSummary.suggestions.map((s: string, i: number) => (
                        <div key={i} className="p-5 sm:p-6 bg-silk rounded-[1.25rem] sm:rounded-[1.5rem] border border-obsidian/[0.03] text-sm sm:text-base text-obsidian/70 leading-relaxed font-light italic">
                           "{s}"
                        </div>
                      ))}
                   </div>
                </div>

                <div className="flex flex-col justify-end gap-6 sm:gap-8">
                  <div className="p-6 sm:p-8 bg-sage/5 rounded-[1.5rem] sm:rounded-[2rem] border border-sage/10 space-y-3 sm:space-y-4">
                    <p className="text-[10px] font-bold text-sage uppercase tracking-widest">Protocol Version</p>
                    <p className="text-[10px] sm:text-xs text-slate-500 leading-relaxed font-light">
                      This analysis was generated using our Neural Fusion Engine. All metrics are probabilistic and should be reviewed by a professional.
                    </p>
                  </div>
                  <Button 
                    size="lg" 
                    className="w-full bg-dark-blue hover:bg-dark-blue/90 text-silk h-16 sm:h-20 rounded-full text-base sm:text-lg font-bold uppercase tracking-[0.2em] soft-shadow border-none group"
                    onClick={() => {
                      setPage('landing');
                      setHistory([]);
                      setCurrentQuestionIndex(0);
                      setFinalSummary(null);
                    }}
                  >
                    {t('start_new_assessment')} <ChevronRight className="ml-2 sm:ml-3 group-hover:translate-x-2 transition-transform" />
                  </Button>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-silk text-obsidian font-sans selection:bg-sage/20">
      <Atmosphere />

      {page !== 'landing' && (
        <nav className="sticky top-0 z-50 border-b border-obsidian/[0.03] bg-silk/40 backdrop-blur-3xl h-16">
          <div className="container mx-auto px-6 h-full flex items-center relative">
            <div 
              className="flex items-center gap-3 cursor-pointer group transition-all duration-700 absolute left-1/2 -translate-x-1/2"
              onClick={() => setPage('landing')}
            >
              <span className="font-serif tracking-tight text-obsidian transition-all duration-700 font-bold text-3xl sm:text-4xl">
                {t('app_name')}
              </span>
            </div>
          </div>
        </nav>
      )}

      <main className="container mx-auto px-6 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {page === 'landing' && renderLanding()}
            {page === 'auth' && renderAuth()}
            {page === 'language' && renderLanguage()}
            {page === 'analysis' && renderAnalysis()}
            {page === 'summary' && renderSummary()}
          </motion.div>
        </AnimatePresence>
      </main>

      <Toaster position="bottom-right" theme="light" />
    </div>
  );
}
