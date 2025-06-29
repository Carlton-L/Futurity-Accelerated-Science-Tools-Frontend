import { v4 as uuidv4 } from 'uuid';

// Define input/output types for this specific tool if known, otherwise use 'any'
interface InnovationStrategiesMakerParams {
  // Define specific parameters for this tool's form
  ideaInput: string;
  selectedStrategies: string[];
  // Add other relevant parameters
}

interface InnovationStrategiesMakerResult {
  strategyReport: string;
  message: string; // Added from backend response model
}

const API_BASE_URL = 'https://fast.futurity.science/tools';

class InnovationStrategiesMakerService {
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
   * Simulate calling the Innovation Strategies Maker API
   */
  async runTool(
    params: InnovationStrategiesMakerParams,
    token: string
  ): Promise<InnovationStrategiesMakerResult> {
    // console.log('Running Innovation Strategies Maker with params:', params); // Already present
    // await new Promise((resolve) => setTimeout(resolve, 1500)); // Mock delay

    // const mockResult: InnovationStrategiesMakerResult = {
    //   strategyReport: `Based on your input "${params.ideaInput}" and selected strategies (${params.selectedStrategies.join(', ')}), here is a generated innovation strategy report... [Mocked Data - ${this.generateUUID()}]`,
    //   message: "Mocked report generated successfully."
    // };
    // return mockResult; // For testing without backend

    try {
      const response = await fetch(`${API_BASE_URL}/innovation-strategies-maker`, {
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
        console.error('Innovation Strategies Maker API error:', response.status, detail);
        throw new Error(
          `Failed to run Innovation Strategies Maker: ${response.status} ${response.statusText} - ${detail}`
        );
      }

      const result: InnovationStrategiesMakerResult = await response.json();
      return result;
    } catch (error) {
      console.error('Innovation Strategies Maker service error:', error);
      throw error; // Rethrow for the component to handle
    }
  }
}

export const innovationStrategiesMakerService = new InnovationStrategiesMakerService();