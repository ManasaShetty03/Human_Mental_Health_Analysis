import { Analysis, UserStatistics } from '../types';

const API_BASE_URL = 'https://mental-health-analysis-1ljn.onrender.com/api';

export interface StoreAnalysisRequest {
  user_id: string;
  analysis_data: {
    session_id?: string;
    analysis_type: string;
    modality: string;
    results: any;
    confidence: number;
    emotion: string;
    mental_state: string;
    severity: string;
    suggestions: string[];
    is_backup: boolean;
    model_used: string;
    language: string;
    processing_time: number;
    metadata?: any;
  };
}

export interface StoreMultimodalRequest {
  user_id: string;
  multimodal_data: {
    session_id?: string;
    face: any;
    voice: any;
    text: any;
    overallEmotion: string;
    confidence: number;
    severity: string;
    suggestions: string[];
    masking: {
      detected: boolean;
      explanation: string;
      authenticity_score: number;
    };
    fusion: any;
    language: string;
    processing_time: number;
    metadata?: any;
  };
}

export interface CreateSessionRequest {
  user_id: string;
  session_data?: any;
}

export interface UpdateSessionRequest {
  update_data: any;
}

class HistoryService {
  // Store single analysis
  async storeAnalysis(request: StoreAnalysisRequest): Promise<{ analysis_id: string }> {
    const response = await fetch(`${API_BASE_URL}/analysis/store`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to store analysis: ${response.statusText}`);
    }

    return response.json();
  }

  // Store multimodal analysis
  async storeMultimodalAnalysis(request: StoreMultimodalRequest): Promise<{ analysis_id: string }> {
    const response = await fetch(`${API_BASE_URL}/analysis/store-multimodal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to store multimodal analysis: ${response.statusText}`);
    }

    return response.json();
  }

  // Get user history
  async getUserHistory(userId: string, limit: number = 50, analysisType?: string): Promise<{
    user_id: string;
    total_analyses: number;
    history: Analysis[];
  }> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      ...(analysisType && { analysis_type: analysisType }),
    });

    const response = await fetch(`${API_BASE_URL}/user/${userId}/history?${params}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch user history: ${response.statusText}`);
    }

    return response.json();
  }

  // Get specific analysis
  async getUserAnalysis(userId: string, analysisId: string): Promise<Analysis> {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/analysis/${analysisId}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Analysis not found');
      }
      throw new Error(`Failed to fetch analysis: ${response.statusText}`);
    }

    return response.json();
  }

  // Get user statistics
  async getUserStatistics(userId: string): Promise<UserStatistics> {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/statistics`);

    if (!response.ok) {
      throw new Error(`Failed to fetch user statistics: ${response.statusText}`);
    }

    return response.json();
  }

  // Get user sessions
  async getUserSessions(userId: string, limit: number = 20): Promise<{
    user_id: string;
    total_sessions: number;
    sessions: any[];
  }> {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });

    const response = await fetch(`${API_BASE_URL}/user/${userId}/sessions?${params}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch user sessions: ${response.statusText}`);
    }

    return response.json();
  }

  // Create new session
  async createSession(request: CreateSessionRequest): Promise<{ session_id: string }> {
    const response = await fetch(`${API_BASE_URL}/session/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.statusText}`);
    }

    return response.json();
  }

  // Update session
  async updateSession(sessionId: string, request: UpdateSessionRequest): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/session/${sessionId}/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Session not found');
      }
      throw new Error(`Failed to update session: ${response.statusText}`);
    }

    return response.json();
  }

  // Delete user data (GDPR compliance)
  async deleteUserData(userId: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/delete`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete user data: ${response.statusText}`);
    }

    return response.json();
  }
}

// Export singleton instance
export const historyService = new HistoryService();
