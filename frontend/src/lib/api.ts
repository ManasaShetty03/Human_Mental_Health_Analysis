// API Configuration with environment variable support
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://mental-health-analysis-1ljn.onrender.com';

// Helper function to construct API URLs
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${baseUrl}/${cleanEndpoint}`;
};

// Export common API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: getApiUrl('api/login'),
  SIGNUP: getApiUrl('api/signup'),
  
  // User endpoints
  USER_HISTORY: (userId: string, limit?: number) => 
    getApiUrl(`api/user/${userId}/history${limit ? `?limit=${limit}` : ''}`),
  USER_STATISTICS: (userId: string) => getApiUrl(`api/user/${userId}/statistics`),
  USER_ANALYSIS: (userId: string, analysisId: string) => 
    getApiUrl(`api/user/${userId}/analysis/${analysisId}`),
  USER_SESSIONS: (userId: string, limit?: number) => 
    getApiUrl(`api/user/${userId}/sessions${limit ? `?limit=${limit}` : ''}`),
  
  // Analysis endpoints
  STORE_ANALYSIS: getApiUrl('api/analysis/store'),
  STORE_MULTIMODAL: getApiUrl('api/analysis/store-multimodal'),
  
  // Session endpoints
  CREATE_SESSION: getApiUrl('api/session/create'),
  UPDATE_SESSION: (sessionId: string) => getApiUrl(`api/session/${sessionId}/update`),
  
  // Config endpoint
  CONFIG: getApiUrl('api/config'),
  
  // Backup endpoints
  BACKUP_VOICE_ANALYSIS: getApiUrl('api/backup-voice-analysis'),
  BACKUP_TEXT_ANALYSIS: getApiUrl('api/backup-text-analysis'),
  BACKUP_FACE_ANALYSIS: getApiUrl('api/backup-face-analysis'),
};

// Export for backward compatibility
export default API_BASE_URL;
