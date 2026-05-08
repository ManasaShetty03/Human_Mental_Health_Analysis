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
