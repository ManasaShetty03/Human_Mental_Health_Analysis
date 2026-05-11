import { GoogleGenAI, Type } from "@google/genai";
import { Emotion, ModalityResult, MultimodalAnalysis } from "../types";
import { getGeminiApiKey } from "./api-config";

let ai: GoogleGenAI | null = null;
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
  ai = new GoogleGenAI({ apiKey });
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
    vocalEmotion: string;
    semanticEmotion: string;
    explanation: string;
  };
}

function extractJSON(text: string, fallback: any = {}) {
  if (!text || text === "{}") return fallback;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const raw = jsonMatch ? jsonMatch[0] : text;
    const parsed = JSON.parse(raw);
    
    // Simple recursive merge for one level deep objects like 'fusion' or 'masking'
    const result = { ...fallback };
    for (const key in parsed) {
      if (typeof parsed[key] === 'object' && parsed[key] !== null && !Array.isArray(parsed[key]) && fallback[key]) {
        result[key] = { ...fallback[key], ...parsed[key] };
      } else {
        result[key] = parsed[key];
      }
    }
    return result;
  } catch (e) {
    console.error("Failed to parse JSON from response:", text);
    return fallback;
  }
}

function handleSafetyBlock(response: any) {
  if (response.candidates?.[0]?.finishReason === 'SAFETY') {
    console.warn("Gemini response blocked by safety filters.");
    throw new Error("Content blocked by safety filters. Please try rephrasing or recording again with clear intent.");
  }
}

function cleanBase64(base64: string) {
  if (base64.includes(";base64,")) {
    return base64.split(";base64,")[1];
  }
  return base64;
}

export async function analyzeMultimodal(
  face: ModalityResult,
  faceImageBase64: string | null,
  audioBase64: string | null,
  features: any,
  text: string,
  language: string = 'en'
): Promise<MultimodalAnalysis> {
  try {
    // Ensure AI is initialized
    if (!ai) {
      await initializeAI();
      if (!ai) {
        throw new Error("AI not initialized - API key not available");
      }
    }
    
    const contents: any[] = [
      { text: `Analyze the following multimodal emotional data for "Emotional Masking" (faking emotions).
      The user is interacting in the language: ${language}.
      
      - Context: Face Detector (Local) found "${face.emotion || 'Neutral'}" with ${face.confidence || 0} confidence.
      - Voice Features: ${JSON.stringify(features)}
      - Transcript: "${text || ''}"
      
      CRITICAL ENHANCEMENT INSTRUCTIONS:
      1. Analyze the face image, audio features, and transcript for emotion.
      2. Detect "Emotional Masking": Look for discrepancies where the face image might show a forced smile or underlying sadness, but the tone or transcript say something else.
      3. Calculate an "authenticity_score" (0.0 to 1.0).
      4. Determine "overallEmotion" (Happy, Sad, Angry, Neutral).
      5. Set "severity" (Low, Medium, High). For Neutral or Happy, severity MUST be "Low".
      6. Provide "suggestions" (array of exactly 3 strings in language: ${language}). If overallEmotion is "Neutral", set suggestions to [].
      7. Provide a detailed "explanation" in the "masking" object in language: ${language}.
      
      Return JSON ONLY.
      JSON structure:
      {
        "face": { "emotion", "confidence" },
        "voice": { "emotion", "confidence", "uncertain" },
        "text": { "emotion", "confidence" },
        "overallEmotion",
        "severity",
        "confidence",
        "suggestions": [],
        "masking": { "detected", "explanation", "authenticity_score" },
        "fusion": { "final_emotion", "confidence", "authenticity_score", "conflict", "conflict_message" }
      }` }
    ];

    if (faceImageBase64) {
      contents.push({ inlineData: { mimeType: "image/jpeg", data: cleanBase64(faceImageBase64) } });
    }

    if (audioBase64) {
      contents.push({ inlineData: { mimeType: "audio/webm", data: cleanBase64(audioBase64) } });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: contents },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            face: {
              type: Type.OBJECT,
              properties: {
                emotion: { type: Type.STRING, enum: ["Happy", "Sad", "Angry", "Neutral"] },
                confidence: { type: Type.NUMBER }
              }
            },
            voice: {
              type: Type.OBJECT,
              properties: {
                emotion: { type: Type.STRING, enum: ["Happy", "Sad", "Angry", "Neutral"] },
                confidence: { type: Type.NUMBER },
                uncertain: { type: Type.BOOLEAN }
              }
            },
            text: {
              type: Type.OBJECT,
              properties: {
                emotion: { type: Type.STRING, enum: ["Happy", "Sad", "Angry", "Neutral"] },
                confidence: { type: Type.NUMBER }
              }
            },
            overallEmotion: { type: Type.STRING, enum: ["Happy", "Sad", "Angry", "Neutral"] },
            severity: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
            confidence: { type: Type.NUMBER },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            masking: {
              type: Type.OBJECT,
              properties: {
                detected: { type: Type.BOOLEAN },
                explanation: { type: Type.STRING },
                authenticity_score: { type: Type.NUMBER }
              },
              required: ["detected", "explanation", "authenticity_score"]
            },
            fusion: {
              type: Type.OBJECT,
              properties: {
                final_emotion: { type: Type.STRING, enum: ["Happy", "Sad", "Angry", "Neutral"] },
                confidence: { type: Type.NUMBER },
                authenticity_score: { type: Type.NUMBER },
                conflict: { type: Type.BOOLEAN },
                conflict_message: { type: Type.STRING }
              }
            }
          },
          required: ["face", "voice", "text", "fusion", "overallEmotion", "severity", "confidence", "masking", "suggestions"]
        }
      }
    });
    
    handleSafetyBlock(response);
    const fallback: MultimodalAnalysis = {
      face: { emotion: 'Neutral', confidence: 0 },
      voice: { emotion: 'Neutral', confidence: 0, uncertain: true },
      text: { emotion: 'Neutral', confidence: 0 },
      overallEmotion: 'Neutral',
      severity: 'Low',
      confidence: 0,
      suggestions: [],
      masking: {
        detected: false,
        explanation: "",
        authenticity_score: 1
      },
      fusion: {
        final_emotion: 'Neutral',
        confidence: 0,
        authenticity_score: 1,
        conflict: false,
        conflict_message: ""
      }
    };
    return extractJSON(response.text || "{}", fallback);
  } catch (error) {
    console.error("Error in analyzeMultimodal:", error);
    throw error;
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
    
    const prompt = `Based on the following emotional analysis history across multiple questions, generate a final summary.
    The user is interacting in the language: ${language}.
    
    ${JSON.stringify(history)}
    
    Return a JSON object with:
    - overall_emotion (Happy, Sad, Angry, Neutral)
    - confidence (0.0 to 1.0)
    - emotion_trend (string in language: ${language})
    - observations (array of strings in language: ${language})
    - conflict_detected (boolean)
    - masking_analysis (string explanation of recurring masking patterns if any, in language: ${language})
    - uncertainty_detected (boolean)
    - suggestions (array of 4 to 5 strings in language: ${language})
    
    Suggestions guidelines:
    - Provide 4 to 5 highly personalized, actionable, and empathetic wellness suggestions specifically for STUDENTS based on the final emotional state.
    - Suggestions MUST be in the language: ${language}.
    - IMPORTANT: Focus on student-specific challenges: academic workload, exam stress, study-life balance, campus social dynamics, future career concerns.
    - Reference specific patterns observed in the student's history (e.g., "Since you mentioned feeling overwhelmed about your exams...").
    - Ensure diversity in suggestions: academic (study strategies), physical (campus wellness activities), mental (student mindfulness techniques), social (study groups, campus connections), creative (student projects, hobbies).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overall_emotion: { type: Type.STRING, enum: ["Happy", "Sad", "Angry", "Neutral"] },
            confidence: { type: Type.NUMBER },
            emotion_trend: { type: Type.STRING },
            observations: { type: Type.ARRAY, items: { type: Type.STRING } },
            conflict_detected: { type: Type.BOOLEAN },
            masking_analysis: { type: Type.STRING },
            uncertainty_detected: { type: Type.BOOLEAN },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["overall_emotion", "confidence", "emotion_trend", "observations", "conflict_detected", "masking_analysis", "uncertainty_detected", "suggestions"]
        }
      }
    });
    
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
    return extractJSON(response.text || "{}", fallback);
  } catch (error) {
    console.error("Error in generateFinalSummary:", error);
    throw error;
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
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the following facial emotion: "${emotion}" with confidence ${confidence}.
      The user is interacting in the language: ${language}.
      
      Return a JSON object with:
      - isMeaningless (boolean, false)
      - emotion (Sad, Happy, Angry, Neutral)
      - confidence (0.0 to 1.0)
      - uncertain (boolean, true if confidence < 0.5)
      - severity (Low, Medium, High. For Neutral or Happy, set to "Low")
      - suggestions (array of exactly 4 to 5 strings in language: ${language}. If emotion is Neutral, set this to an empty array []).
      
      Suggestions guidelines:
      - If emotion is Neutral: DO NOT provide any suggestions. Return [].
      - Provide 4 to 5 highly personalized, actionable, and empathetic wellness suggestions specifically for STUDENTS based on the facial expression.
      - Suggestions MUST be in the language: ${language}.
      - Focus on student-specific contexts: classroom situations, study sessions, exam stress, campus interactions, presentation anxiety.
      - Suggestions must be directly relevant to the detected emotion in student settings.
      - IMPORTANT: Suggestions must be realistic for students' environment (classroom, dorm, library, campus).
      - Avoid generic advice; instead, offer student-specific techniques (e.g., "Try discreet breathing exercises during class" instead of just "breathe").
      - Ensure diversity in suggestions: academic (classroom focus), physical (campus activities), mental (student mindfulness), social (study group interactions), creative (student projects).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isMeaningless: { type: Type.BOOLEAN },
            emotion: { type: Type.STRING, enum: ["Happy", "Sad", "Angry", "Neutral"] },
            confidence: { type: Type.NUMBER },
            uncertain: { type: Type.BOOLEAN },
            severity: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["emotion", "confidence", "uncertain", "suggestions", "isMeaningless", "severity"]
        }
      }
    });

    handleSafetyBlock(response);
    const fallback: AnalysisResult = {
      emotion: "Neutral",
      confidence: 0,
      uncertain: true,
      severity: "Low",
      suggestions: []
    };
    return extractJSON(response.text || "{}", fallback);
  } catch (error) {
    console.error("Error in analyzeFace:", error);
    
    // When Gemini API fails, fall back to backup models
    try {
      console.log("Gemini API failed, falling back to backup face analysis...");
      // Note: For face analysis, we need to convert the emotion and confidence to an image
      // Since we don't have the actual image, we'll use the emotion data as text input
      const response = await fetch('http://localhost:3000/api/backup-face-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // We can't provide image_base64 here since we only have emotion/confidence
          // In a real implementation, the frontend should pass the actual image
          image_base64: null,
          language: language,
          user_id: 'demo_user'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (!result.error) {
          return {
            emotion: result.emotion || emotion || "Neutral",
            confidence: result.confidence || confidence || 0,
            uncertain: false,
            severity: result.severity || "Low",
            suggestions: result.suggestions || ["Analysis completed using backup model"]
          };
        }
      }
    } catch (backupError) {
      console.error("Backup face analysis also failed:", backupError);
    }
    
    // If both Gemini and backup fail, return fallback
    const fallback: AnalysisResult = {
      emotion: emotion || "Neutral",
      confidence: confidence || 0,
      uncertain: true,
      severity: "Low",
      suggestions: ["Unable to analyze due to API error"]
    };
    
    return fallback;
  }
}

export async function storeAnalysis(analysisData: any, userId: string): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:3000/api/analysis/store', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        analysis_data: analysisData
      })
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

export async function analyzeText(text: string, language: string = 'en'): Promise<AnalysisResult> {
  try {
    // Ensure AI is initialized
    if (!ai) {
      await initializeAI();
      if (!ai) {
        throw new Error("AI not initialized - API key not available");
      }
    }
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the following text: "${text}".
      The user is interacting in the language: ${language}.
      
      First, determine if the text is gibberish, meaningless, or lacks enough context to identify any emotion.
      
      IMPORTANT: Check for emotional conflict or uncertainty in the text:
      - Look for sentences that contain multiple conflicting emotions (e.g., "I am sad but I am happy", "I feel angry yet peaceful")
      - Look for contradictory statements or mixed feelings
      - Look for uncertainty indicators like "I think", "maybe", "not sure", "confused"
      
      If emotional conflict is detected, set uncertain to true and emotion to "Neutral".
      
      Return a JSON object with:
      - isMeaningless (boolean, true if the text is gibberish, random characters, or completely meaningless)
      - emotion (Sad, Happy, Angry, Neutral. If isMeaningless or emotional conflict is detected, set this to "Neutral")
      - confidence (0.0 to 1.0)
      - uncertain (boolean, true if confidence < 0.5 OR emotional conflict is detected OR contradictory emotions are present)
      - severity (Low, Medium, High. For Neutral or Happy, set to "Low")
      - suggestions (array of exactly 4 to 5 strings in language: ${language}. If isMeaningless or emotion is Neutral, set this to an empty array []).
      
      Suggestions guidelines:
      - If isMeaningless or emotion is Neutral: DO NOT provide any suggestions. Return [].
      - Provide 4 to 5 highly personalized, actionable, and empathetic wellness suggestions specifically for STUDENTS.
      - Suggestions MUST be in the language: ${language}.
      - IMPORTANT: Focus on student-specific challenges: academic stress, study habits, time management, social pressure, exam anxiety, campus life.
      - Suggestions must be realistic and practical for students' busy schedules and limited resources.
      - Include student-focused techniques: study breaks, campus resources, peer support, time management, stress reduction for exams.
      - Ensure diversity in suggestions: academic (study techniques), physical (campus activities), mental (mindfulness for students), social (study groups, campus connections), creative (student projects, hobbies).
      - Reference student-specific contexts: classes, exams, assignments, dorm life, campus resources, study spaces.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isMeaningless: { type: Type.BOOLEAN },
            emotion: { type: Type.STRING, enum: ["Happy", "Sad", "Angry", "Neutral"] },
            confidence: { type: Type.NUMBER },
            uncertain: { type: Type.BOOLEAN },
            severity: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["emotion", "confidence", "uncertain", "suggestions", "isMeaningless", "severity"]
        }
      }
    });

    handleSafetyBlock(response);
    const fallback: AnalysisResult = {
      emotion: "Neutral",
      confidence: 0,
      uncertain: true,
      severity: "Low",
      suggestions: []
    };
    return extractJSON(response.text || "{}", fallback);
  } catch (error) {
    console.error("Error in analyzeText:", error);
    
    // Check if it's a quota exceeded error
    // When Gemini API fails, fall back to backup models
    try {
      console.log("Gemini API failed, falling back to backup text analysis...");
      const response = await fetch('http://localhost:3000/api/backup-text-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          language: 'en',
          user_id: 'demo_user'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (!result.error) {
          return {
            emotion: result.emotion || "Neutral",
            confidence: result.confidence || 0,
            uncertain: false,
            severity: result.severity || "Low",
            suggestions: result.suggestions || ["Analysis completed using backup model"],
            masking: {
              detected: false,
              vocalEmotion: result.emotion || "Neutral",
              semanticEmotion: result.emotion || "Neutral",
              explanation: "Analysis completed using backup RoBERTa model"
            }
          };
        }
      }
    } catch (backupError) {
      console.error("Backup text analysis also failed:", backupError);
    }
    
    // If both Gemini and backup fail, return fallback
    if (error && typeof error === 'object' && 'error' in error) {
      const apiError = error.error;
      if (apiError.code === 429) {
        // Quota exceeded - return a specific fallback
        const fallback: AnalysisResult = {
          emotion: "Neutral",
          confidence: 0,
          uncertain: true,
          severity: "Low",
          suggestions: ["Unable to analyze due to API quota limits"],
          masking: {
            detected: true,
            vocalEmotion: "Neutral",
            semanticEmotion: "Neutral", 
            explanation: "Unable to analyze due to API quota limits"
          }
        };
        return fallback;
      }
      
      // Check for rate limiting with retry info
      if (apiError.status === "RESOURCE_EXHAUSTED" && apiError.details) {
        const retryInfo = apiError.details.find((detail: any) => detail['@type']?.includes('RetryInfo'));
        if (retryInfo && retryInfo.retryDelay) {
          const fallback: AnalysisResult = {
            emotion: "Neutral",
            confidence: 0,
            uncertain: true,
            severity: "Low",
            suggestions: [`Rate limited. Retry in ${retryInfo.retryDelay}`],
            masking: {
              detected: true,
              vocalEmotion: "Neutral",
              semanticEmotion: "Neutral",
              explanation: `Rate limited. Retry in ${retryInfo.retryDelay}`
            }
          };
          return fallback;
        }
      }
    }
    
    // Handle other API errors gracefully
    const fallback: AnalysisResult = {
      emotion: "Neutral",
      confidence: 0,
      uncertain: true,
      severity: "Low",
      suggestions: ["Unable to analyze due to API error"],
      masking: {
        detected: true,
        vocalEmotion: "Neutral",
        semanticEmotion: "Neutral",
        explanation: "Unable to analyze due to API error"
      }
    };
    
    return fallback;
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
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { text: `Analyze the emotion in this audio recording. 
        The user is interacting in the language: ${language}.
        Extracted features for context: ${JSON.stringify(features)}.
        
        First, determine if the audio is gibberish, background noise, or lacks enough context to identify any emotion.
        
        Return a JSON object with:
        - isMeaningless (boolean, true if the audio is gibberish, just noise, or completely meaningless)
        - emotion (Sad, Happy, Angry, Neutral. If isMeaningless is true, set this to "Neutral")
        - confidence (0.0 to 1.0)
        - uncertain (boolean, true if confidence < 0.5 or jitter/shimmer high)
        - severity (Low, Medium, High. For Neutral or Happy, set to "Low")
        - transcript (string containing spoken words)
        - masking (object identifying if the vocal tone conflicts with the spoken words):
          - detected (boolean)
          - vocalEmotion (string)
          - semanticEmotion (string)
          - explanation (string explanation of the conflict)
        - suggestions (array of exactly 4 to 5 strings in language: ${language}. If isMeaningless or emotion is Neutral, set this to an empty array []).
        
        Suggestions guidelines:
        - If isMeaningless or emotion is Neutral: DO NOT provide any suggestions. Return [].
        - Provide 4 to 5 highly personalized, actionable, and empathetic wellness suggestions specifically for STUDENTS based on the vocal tone, transcript, and acoustic features.
        - Suggestions MUST be in the language: ${language}.
        - IMPORTANT: Provide a full transcript of the spoken words in the "transcript" field.
        - IMPORTANT: Focus on student-specific challenges: academic stress, presentation anxiety, study group dynamics, exam preparation, campus social pressure.
        - Tailor suggestions to vocal characteristics in student context. For example, if energy is very low, suggest campus study areas or student wellness centers. If jitter/shimmer is high (indicating anxiety), suggest exam stress management techniques.
        - Suggestions must be realistic for students' schedules, budgets, and campus resources.
        - Ensure diversity in suggestions: academic (study techniques), physical (campus activities), mental (student mindfulness), social (study groups, campus connections), creative (student projects).
        
        Uncertainty rules:
        - confidence < 0.5
        - jitter > 0.02
        - shimmer > 0.05
        - energy < 0.01` },
          { inlineData: { mimeType: "audio/webm", data: cleanBase64(audioBase64) } }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isMeaningless: { type: Type.BOOLEAN },
            emotion: { type: Type.STRING, enum: ["Happy", "Sad", "Angry", "Neutral"] },
            confidence: { type: Type.NUMBER },
            uncertain: { type: Type.BOOLEAN },
            severity: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
            transcript: { type: Type.STRING },
            masking: {
              type: Type.OBJECT,
              properties: {
                detected: { type: Type.BOOLEAN },
                vocalEmotion: { type: Type.STRING },
                semanticEmotion: { type: Type.STRING },
                explanation: { type: Type.STRING }
              },
              required: ["detected", "vocalEmotion", "semanticEmotion", "explanation"]
            },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["emotion", "confidence", "uncertain", "suggestions", "isMeaningless", "transcript", "severity", "masking"]
        }
      }
    });
    
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
    return extractJSON(response.text || "{}", fallback);
  } catch (error) {
    console.error("Error in analyzeAudio:", error);
    
    // When Gemini API fails, fall back to backup models
    try {
      console.log("Gemini API failed, falling back to backup voice analysis...");
      const response = await fetch('http://localhost:3000/api/backup-voice-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio_base64: audioBase64,
          language: language,
          user_id: 'demo_user'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (!result.error) {
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
      }
    } catch (backupError) {
      console.error("Backup voice analysis also failed:", backupError);
    }
    
    // If both Gemini and backup fail, check for quota exceeded error
    if (error && typeof error === 'object' && 'error' in error) {
      const apiError = error.error;
      if (apiError.code === 429) {
        // Quota exceeded - return a specific fallback
        const fallback: AnalysisResult = {
          emotion: "Neutral",
          confidence: 0,
          uncertain: true,
          severity: "Low",
          suggestions: [
            "API quota exceeded. Please try again later.",
            "Consider using text analysis as an alternative.",
            "Your voice analysis will be available when quota resets."
          ],
          isMeaningless: false,
          transcript: "API quota exceeded",
          masking: {
            detected: false,
            vocalEmotion: "Neutral",
            semanticEmotion: "Neutral",
            explanation: "API quota exceeded"
          }
        };
        return fallback;
      }
      
      // Check for rate limiting with retry info
      if (apiError.status === "RESOURCE_EXHAUSTED" && apiError.details) {
        const retryInfo = apiError.details.find((detail: any) => detail['@type']?.includes('RetryInfo'));
        if (retryInfo && retryInfo.retryDelay) {
          const fallback: AnalysisResult = {
            emotion: "Neutral",
            confidence: 0,
            uncertain: true,
            severity: "Low",
            suggestions: [`Rate limited. Retry in ${retryInfo.retryDelay} seconds`],
            isMeaningless: false,
            transcript: "Rate limited",
            masking: {
              detected: false,
              vocalEmotion: "Neutral",
              semanticEmotion: "Neutral",
              explanation: `Rate limited. Retry in ${retryInfo.retryDelay} seconds`
            }
          };
          return fallback;
        }
      }
    }
    
    // Handle other API errors gracefully
    const fallback: AnalysisResult = {
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
    
    return fallback;
  }
}
