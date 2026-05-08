interface ApiConfig {
  GEMINI_API_KEY: string | null;
}

// Backend URL - Update this to your Render backend URL
// For local development: http://localhost:3000
// For production: https://your-render-app-name.onrender.com
const BACKEND_URL = 'http://localhost:3000'; // TODO: Update to your Render URL

let cachedConfig: ApiConfig | null = null;

export async function getApiConfig(): Promise<ApiConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/config`);
    if (!response.ok) {
      throw new Error('Failed to fetch API configuration');
    }
    
    const config = await response.json();
    cachedConfig = config;
    return config;
  } catch (error) {
    console.error('Error fetching API config:', error);
    return { GEMINI_API_KEY: null };
  }
}

export async function getGeminiApiKey(): Promise<string | null> {
  const config = await getApiConfig();
  return config.GEMINI_API_KEY;
}

// Export backend URL for other API calls
export { BACKEND_URL };
