import { v4 as uuidv4 } from 'uuid';

// --- Common Interfaces ---
interface BaseToolParams {
  prompt?: string;
  character_description?: string;
}

interface BaseToolResult {
  message: string;
  error?: string;
}

// --- FutureGrapher Interfaces ---
export interface FutureGrapherParams {
  prompt: string;
}

export interface FutureGrapherResult extends BaseToolResult {
  image_url?: string;
}

// --- FutureStories Interfaces ---
export interface FutureStoryParams {
  prompt: string;
}

export interface FutureStoryResult extends BaseToolResult {
  story?: string;
}

// --- FutureFolk Interfaces ---
export interface FutureFolkParams {
  character_description: string;
}

export interface FutureFolkResult extends BaseToolResult {
  character_sheet?: Record<string, any>; // JSON object
}

const API_BASE_URL = 'https://fast.futurity.science/visualization'; // Updated base URL

class VisualizationService {
  private getAuthHeaders(token: string): HeadersInit {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`, // Assuming token-based auth if needed
    };
  }

  public generateUUID(): string {
    return uuidv4();
  }

  private async handleApiResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text();
      let detail = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        detail = errorJson.detail || errorJson.error || errorText;
      } catch (e) {
        /* not JSON */
      }
      console.error('API error:', response.status, detail);
      throw new Error(
        `API request failed: ${response.status} ${response.statusText} - ${detail}`
      );
    }
    return response.json() as Promise<T>;
  }

  /**
   * Call the FutureGrapher tool
   */
  async runFutureGrapher(
    params: FutureGrapherParams,
    token: string = 'dummy-auth-token' // Placeholder token
  ): Promise<FutureGrapherResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/futuregrapher`, {
        method: 'POST',
        headers: this.getAuthHeaders(token),
        body: JSON.stringify(params),
      });
      return this.handleApiResponse<FutureGrapherResult>(response);
    } catch (error) {
      console.error('FutureGrapher service error:', error);
      throw error;
    }
  }

  /**
   * Call the FutureStories tool
   */
  async runFutureStories(
    params: FutureStoryParams,
    token: string = 'dummy-auth-token' // Placeholder token
  ): Promise<FutureStoryResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/futurestories`, {
        method: 'POST',
        headers: this.getAuthHeaders(token),
        body: JSON.stringify(params),
      });
      return this.handleApiResponse<FutureStoryResult>(response);
    } catch (error) {
      console.error('FutureStories service error:', error);
      throw error;
    }
  }

  /**
   * Call the FutureFolk tool
   */
  async runFutureFolk(
    params: FutureFolkParams,
    token: string = 'dummy-auth-token' // Placeholder token
  ): Promise<FutureFolkResult> {
    try {
      const response = await fetch(`${API_BASE_URL}/futurefolk`, {
        method: 'POST',
        headers: this.getAuthHeaders(token),
        body: JSON.stringify(params),
      });
      return this.handleApiResponse<FutureFolkResult>(response);
    } catch (error) {
      console.error('FutureFolk service error:', error);
      throw error;
    }
  }
}

export const visualizationService = new VisualizationService();