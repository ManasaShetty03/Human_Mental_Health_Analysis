export type Emotion = 'Happy' | 'Sad' | 'Angry' | 'Neutral';
export type Severity = 'Low' | 'Medium' | 'High';

export interface ModalityResult {
  emotion: Emotion;
  confidence: number;
  uncertain?: boolean;
}

export interface QuestionResult {
  question: string;
  face: ModalityResult;
  voice: ModalityResult;
  text: ModalityResult;
  final: Emotion;
  timestamp: number;
}

export interface FinalSummary {
  overall_emotion: Emotion;
  confidence: number;
  emotion_trend: string;
  observations: string[];
  conflict_detected: boolean;
  uncertainty_detected: boolean;
  suggestions: string[];
}

export interface MultimodalAnalysis {
  face: ModalityResult;
  voice: ModalityResult;
  text: ModalityResult;
  overallEmotion: Emotion;
  severity: Severity;
  confidence: number;
  suggestions: string[];
  masking?: {
    detected: boolean;
    explanation: string;
    authenticity_score: number;
  };
  fusion: {
    final_emotion: Emotion;
    confidence: number;
    authenticity_score: number;
    conflict: boolean;
    conflict_message?: string;
  };
}

// History and Analysis types
export interface Analysis {
  _id: string;
  timestamp: string;
  analysis_type: string;
  modality: string;
  emotion: string;
  confidence: number;
  mental_state: string;
  severity: string;
  suggestions: string[];
  is_backup: boolean;
  model_used: string;
  language: string;
  processing_time: number;
  results?: any;
  metadata?: any;
}

export interface UserStatistics {
  total_analyses: number;
  emotion_distribution: Record<string, number>;
  modality_distribution: Record<string, number>;
  average_confidence: number;
  severity_distribution: Record<string, number>;
  recent_activity: Array<{
    id: string;
    timestamp: string;
    emotion: string;
    modality: string;
    confidence: number;
  }>;
}
