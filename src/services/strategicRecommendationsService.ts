import { v4 as uuidv4 } from 'uuid';

interface StrategicRecommendationsParams {
  labId: string; // To know which lab's reports to draw from
  targetAudience: string; // e.g., industries, cities, governments
  // Add other relevant parameters
}

interface StrategicRecommendationsResult {
  recommendationReport: string;
  message: string; // Added from backend response model
}

const API_BASE_URL = 'https://fast.futurity.science/tools';

class StrategicRecommendationsService {
  private getAuthHeaders(token: string): HeadersInit {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  public generateUUID(): string {
    return uuidv4();
  }

  /**
   * Simulate calling the Strategic Recommendations API
   */
  async runTool(
    params: StrategicRecommendationsParams,
    token: string
  ): Promise<StrategicRecommendationsResult> {
    // console.log('Running Strategic Recommendations with params:', params); // Already present
    // await new Promise((resolve) => setTimeout(resolve, 1500)); // Mock delay

    // const mockResult: StrategicRecommendationsResult = {
    //   recommendationReport: `Strategic recommendations for Lab ID "${params.labId}" targeting "${params.targetAudience}": ... [Mocked Data - ${this.generateUUID()}]`,
    //   message: "Mocked strategic recommendations generated."
    // };
    // return mockResult; // For testing without backend

    try {
      const response = await fetch(`${API_BASE_URL}/strategic-recommendations`, {
        method: 'POST',
        headers: this.getAuthHeaders(token),
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let detail = errorText;
        try {
            const errorJson = JSON.parse(errorText);
            detail = errorJson.detail || errorText;
        } catch (e) { /* not JSON */ }
        console.error('Strategic Recommendations API error:', response.status, detail);
        throw new Error(
          `Failed to run Strategic Recommendations: ${response.status} ${response.statusText} - ${detail}`
        );
      }

      const result: StrategicRecommendationsResult = await response.json();
      return result;
    } catch (error) {
      console.error('Strategic Recommendations service error:', error);
      throw error; // Rethrow for the component to handle
    }
  }
}

export const strategicRecommendationsService = new StrategicRecommendationsService();