// src/utils/api.ts

/**
 * Get the correct API URL for the current environment
 * In development: uses proxy routes to bypass CORS
 * In production: uses direct API URLs
 */
export const getApiUrl = (originalUrl: string): string => {
  // Only use proxy in development mode
  if (import.meta.env.DEV) {
    if (originalUrl.includes('fast.futurity.science')) {
      return originalUrl.replace('https://fast.futurity.science', '/api/fast');
    }
    if (originalUrl.includes('tools.futurity.science')) {
      return originalUrl.replace(
        'https://tools.futurity.science',
        '/api/tools'
      );
    }
  }

  // In production, return the original URL unchanged
  return originalUrl;
};

/**
 * Default headers for API requests
 */
export const DEFAULT_API_HEADERS = {
  Authorization: 'Bearer xE8C9T4QGRcbnUoZPrjkyI5mOVjKJAiJ',
  'Content-Type': 'application/json',
};

/**
 * Enhanced fetch with automatic URL transformation and default headers
 */
export const apiFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const transformedUrl = getApiUrl(url);

  return fetch(transformedUrl, {
    ...options,
    headers: {
      ...DEFAULT_API_HEADERS,
      ...options.headers,
    },
  });
};
