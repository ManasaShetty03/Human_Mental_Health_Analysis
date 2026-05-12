import { GoogleGenerativeAI } from '@google/generative-ai';
import { API_BASE_URL } from './api';
import { Emotion, ModalityResult, MultimodalAnalysis } from "../types";
import { getGeminiApiKey } from "./api-config";

let ai: GoogleGenerativeAI | null = null;
let apiKey: string | null = null;

// Initialize AI when API key is available
async function initializeAI() {
  if (!apiKey) {
    apiKey = await getGeminiApiKey();
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set. AI features will not work.");
      return;
    }
  }
  ai = new GoogleGenerativeAI(apiKey);
}

// Initialize on module load
initializeAI();

export interface AnalysisResult {
  emotion: string;
  confidence: number;
  uncertain: boolean;
  isMeaningless?: boolean;
  reason?: string[];
  severity?: "Low" | "Medium" | "High";
  suggestions: string[];
  transcript?: string;
  masking?: {
    detected: boolean;
    vocalEmotion?: string;
    semanticEmotion?: string;
    explanation: string;
  };
}

function handleSafetyBlock(response: any) {
  if (!response.response) {
    console.warn("Safety block triggered or no response");
    return;
  }
}

function extractJSON(text: string, fallback: any): any {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return fallback;
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return fallback;
  }
}

function cleanBase64(base64: string): string {
  return base64.replace(/^data:image\/[a-z]+;base64,/, '').replace(/^data:audio\/[a-z]+;base64,/, '');
}

export async function analyzeText(text: string, language: string = 'en'): Promise<AnalysisResult> {
  try {
    // Ensure AI is initialized
    if (!ai) {
      await initializeAI();
      if (!ai) {
        throw new Error("AI not initialized - API key not available");
      }
    }
    
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `Analyze the following text: "${text}". The user is interacting in the language: ${language}.
    
    Return a JSON object with:
    - isMeaningless (boolean, true if the text is gibberish or meaningless)
    - emotion (Sad, Happy, Angry, Neutral)
    - confidence (0.0 to 1.0)
    - uncertain (boolean, true if confidence < 0.5)
    - severity (Low, Medium, High)
    - suggestions (array of 4 to 5 strings in language: ${language})`;

    const response = await model.generateContent(prompt);
    
    handleSafetyBlock(response);
    const fallback: AnalysisResult = {
      emotion: "Neutral",
      confidence: 0,
      uncertain: true,
      severity: "Low",
      suggestions: []
    };
    
    const responseText = response.response.text();
    return extractJSON(responseText, fallback);
  } catch (error) {
    console.error("Error in analyzeText:", error);
    
    // Fall back to backup model
    try {
      console.log("Gemini API failed, falling back to backup text analysis...");
      const backupResponse = await fetch(`${API_BASE_URL}/api/backup-text-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language: 'en', user_id: 'demo_user' })
      });
      
      if (backupResponse.ok) {
        const result = await backupResponse.json();
        return {
          emotion: result.emotion || "Neutral",
          confidence: result.confidence || 0,
          uncertain: false,
          severity: result.severity || "Low",
          suggestions: result.suggestions || ["Analysis completed using backup model"]
        };
      }
    } catch (backupError) {
      console.error("Backup text analysis also failed:", backupError);
    }
    
    // Return fallback if both fail
    return {
      emotion: "Neutral",
      confidence: 0,
      uncertain: true,
      severity: "Low",
      suggestions: ["Unable to analyze due to API error"]
    };
  }
}

export async function analyzeFace(emotion: string, confidence: number, language: string = 'en'): Promise<AnalysisResult> {
  try {
    // Ensure AI is initialized
    if (!ai) {
      await initializeAI();
      if (!ai) {
        throw new Error("AI not initialized - API key not available");
      }
    }
    
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `Analyze the following facial emotion: "${emotion}" with confidence ${confidence}. The user is interacting in the language: ${language}.
    
    Return a JSON object with:
    - isMeaningless (boolean, false)
    - emotion (Sad, Happy, Angry, Neutral)
    - confidence (0.0 to 1.0)
    - uncertain (boolean, true if confidence < 0.5)
    - severity (Low, Medium, High)
    - suggestions (array of 4 to 5 strings in language: ${language})`;

    const response = await model.generateContent(prompt);
    
    handleSafetyBlock(response);
    const fallback: AnalysisResult = {
      emotion: "Neutral",
      confidence: 0,
      uncertain: true,
      severity: "Low",
      suggestions: []
    };
    
    const responseText = response.response.text();
    return extractJSON(responseText, fallback);
  } catch (error) {
    console.error("Error in analyzeFace:", error);
    
    // Fall back to backup model
    try {
      console.log("Gemini API failed, falling back to backup face analysis...");
      const backupResponse = await fetch(`${API_BASE_URL}/api/backup-face-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: null, language, user_id: 'demo_user' })
      });
      
      if (backupResponse.ok) {
        const result = await backupResponse.json();
        return {
          emotion: result.emotion || emotion || "Neutral",
          confidence: result.confidence || confidence || 0,
          uncertain: false,
          severity: result.severity || "Low",
          suggestions: result.suggestions || ["Analysis completed using backup model"]
        };
      }
    } catch (backupError) {
      console.error("Backup face analysis also failed:", backupError);
    }
    
    // Return fallback if both fail
    return {
      emotion: emotion || "Neutral",
      confidence: confidence || 0,
      uncertain: true,
      severity: "Low",
      suggestions: ["Unable to analyze due to API error"]
    };
  }
}

export async function analyzeAudio(audioBase64: string, features: any, language: string = 'en'): Promise<AnalysisResult> {
  try {
    // Ensure AI is initialized
    if (!ai) {
      await initializeAI();
      if (!ai) {
        throw new Error("AI not initialized - API key not available");
      }
    }
    
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `Analyze the emotion in this audio recording. The user is interacting in the language: ${language}.
    
    Return a JSON object with:
    - isMeaningless (boolean, true if the audio is gibberish or noise)
    - emotion (Sad, Happy, Angry, Neutral)
    - confidence (0.0 to 1.0)
    - uncertain (boolean, true if confidence < 0.5)
    - severity (Low, Medium, High)
    - transcript (string containing spoken words)
    - suggestions (array of 4 to 5 strings in language: ${language})`;

    const response = await model.generateContent([
      { text: prompt },
      { inlineData: { mimeType: "audio/webm", data: cleanBase64(audioBase64) } }
    ]);
    
    handleSafetyBlock(response);
    const fallback: AnalysisResult = {
      emotion: "Neutral",
      confidence: 0,
      uncertain: true,
      severity: "Low",
      suggestions: [],
      isMeaningless: true,
      transcript: "",
      masking: {
        detected: false,
        vocalEmotion: "Neutral",
        semanticEmotion: "Neutral",
        explanation: ""
      }
    };
    
    const responseText = response.response.text();
    return extractJSON(responseText, fallback);
  } catch (error) {
    console.error("Error in analyzeAudio:", error);
    
    // Fall back to backup model
    try {
      console.log("Gemini API failed, falling back to backup voice analysis...");
      const backupResponse = await fetch(`${API_BASE_URL}/api/backup-voice-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio_base64: audioBase64, language, user_id: 'demo_user' })
      });
      
      if (backupResponse.ok) {
        const result = await backupResponse.json();
        return {
          emotion: result.emotion || "Neutral",
          confidence: result.confidence || 0,
          uncertain: false,
          severity: result.severity || "Low",
          suggestions: result.suggestions || ["Analysis completed using backup model"],
          isMeaningless: false,
          transcript: "Analysis completed using backup model",
          masking: {
            detected: false,
            vocalEmotion: result.emotion || "Neutral",
            semanticEmotion: result.emotion || "Neutral",
            explanation: "Analysis completed using backup voice model"
          }
        };
      }
    } catch (backupError) {
      console.error("Backup voice analysis also failed:", backupError);
    }
    
    // Return fallback if both fail
    return {
      emotion: "Neutral",
      confidence: 0,
      uncertain: true,
      severity: "Low",
      suggestions: ["Unable to analyze due to API error"],
      isMeaningless: true,
      transcript: "API error",
      masking: {
        detected: false,
        vocalEmotion: "Neutral",
        semanticEmotion: "Neutral",
        explanation: "Unable to analyze due to API error"
      }
    };
  }
}

export async function generateFinalSummary(history: any[], language: string = 'en'): Promise<any> {
  try {
    // Ensure AI is initialized
    if (!ai) {
      await initializeAI();
      if (!ai) {
        throw new Error("AI not initialized - API key not available");
      }
    }
    
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `Based on the following emotional analysis history, generate a final summary. The user is interacting in the language: ${language}.
    
    ${JSON.stringify(history)}
    
    Return a JSON object with:
    - overall_emotion (Happy, Sad, Angry, Neutral)
    - confidence (0.0 to 1.0)
    - emotion_trend (string in language: ${language})
    - observations (array of strings in language: ${language})
    - conflict_detected (boolean)
    - masking_analysis (string explanation in language: ${language})
    - uncertainty_detected (boolean)
    - suggestions (array of 4 to 5 strings in language: ${language})`;

    const response = await model.generateContent(prompt);
    
    handleSafetyBlock(response);
    const fallback: any = {
      overall_emotion: 'Neutral',
      confidence: 0,
      emotion_trend: "",
      observations: [],
      conflict_detected: false,
      masking_analysis: "",
      uncertainty_detected: true,
      suggestions: []
    };
    
    const responseText = response.response.text();
    return extractJSON(responseText, fallback);
  } catch (error) {
    console.error("Error in generateFinalSummary:", error);
    throw error;
  }
}

export async function storeAnalysis(analysisData: any, userId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analysis/store`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, analysis_data: analysisData })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Analysis stored successfully:', result);
      return true;
    } else {
      console.error('Failed to store analysis:', response.statusText);
      return false;
    }
  } catch (error) {
    console.error('Error storing analysis:', error);
    return false;
  }
}

// Multimodal analysis (simplified version)
export async function analyzeMultimodal(
  face: { emotion: string; confidence: number },
  features: any,
  text: string,
  faceImageBase64?: string,
  audioBase64?: string,
  language: string = 'en'
): Promise<MultimodalAnalysis> {
  try {
    // For now, use text analysis as the primary method
    const textResult = await analyzeText(text, language);
    
    return {
      face: { emotion: face.emotion || 'Neutral', confidence: face.confidence || 0 },
      voice: { emotion: textResult.emotion, confidence: textResult.confidence, uncertain: textResult.uncertain },
      text: { emotion: textResult.emotion, confidence: textResult.confidence },
      overallEmotion: textResult.emotion,
      severity: textResult.severity || 'Low',
      confidence: textResult.confidence,
      suggestions: textResult.suggestions,
      masking: {
        detected: false,
        explanation: "",
        authenticity_score: 1
      },
      fusion: {
        final_emotion: textResult.emotion,
        confidence: textResult.confidence,
        authenticity_score: 1,
        conflict: false,
        conflict_message: ""
      }
    };
  } catch (error) {
    console.error("Error in analyzeMultimodal:", error);
    throw error;
  }
}
