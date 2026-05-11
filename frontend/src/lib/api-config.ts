interface ApiConfig {
  GEMINI_API_KEY: string | null;
}

let cachedConfig: ApiConfig | null = null;

export async function getApiConfig(): Promise<ApiConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const response = await fetch('/api/config');
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
