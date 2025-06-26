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

/**
 * Lab-specific API helper functions
 */
export const labAPI = {
  /**
   * Get a single lab by ID
   */
  getLab: (labId: string, token: string): Promise<Response> => {
    return apiFetch(
      `https://tools.futurity.science/api/lab/view?lab_id=${labId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
  },

  /**
   * List labs for a teamspace
   */
  listLabs: (teamspaceId: string, token: string): Promise<Response> => {
    return apiFetch(
      `https://tools.futurity.science/api/lab/list?teamspace_id=${teamspaceId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
  },

  /**
   * Update lab data
   */
  updateLab: (
    labId: string,
    updateData: any,
    token: string
  ): Promise<Response> => {
    return apiFetch(
      `https://tools.futurity.science/api/lab/update?lab_id=${labId}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      }
    );
  },

  /**
   * Create a new lab
   */
  createLab: (labData: any, token: string): Promise<Response> => {
    return apiFetch(`https://tools.futurity.science/api/lab/create`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(labData),
    });
  },

  /**
   * Delete a lab
   */
  deleteLab: (labId: string, token: string): Promise<Response> => {
    return apiFetch(
      `https://tools.futurity.science/api/lab/delete?lab_id=${labId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
  },
};
