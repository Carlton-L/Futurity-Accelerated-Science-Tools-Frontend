import { v4 as uuidv4 } from 'uuid';

interface WordCloudGeneratorParams {
  textData: string; // Changed from keywordAppearanceTable to match component and backend
  maxWords?: number;
  // width and height are not used by current backend, can be added later if needed
}

export interface WordFrequency { // Added export
  text: string;
  value: number;
}

interface WordCloudGeneratorResult {
  wordCloudId: string;
  message: string; // Added from backend response model
  imageUrl?: string;
  imageSvg?: string;
  wordFrequencies?: WordFrequency[];
}

const API_BASE_URL = 'https://fast.futurity.science/tools';

class WordCloudGeneratorService {
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
   * Simulate calling the Word Cloud Generator API
   */
  async runTool(
    params: WordCloudGeneratorParams,
    token: string
  ): Promise<WordCloudGeneratorResult> {
    console.log('Running Word Cloud Generator with params:', params);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1700));

    // const mockWordFrequencies: WordFrequency[] = [
    //   { text: "Innovation", value: 50 },
    //   { text: "Futurity", value: 60 },
    // ];
    // const mockResult: WordCloudGeneratorResult = {
    //   wordCloudId: `wc_${this.generateUUID()}`,
    //   message: "Mocked word cloud generated.",
    //   imageSvg: `<svg width="100" height="50"><text x="10" y="30">Mock Cloud</text></svg>`,
    //   wordFrequencies: mockWordFrequencies,
    // };
    // return mockResult; // For testing without backend

    try {
      const response = await fetch(`${API_BASE_URL}/word-cloud-generator`, {
        method: 'POST',
        headers: this.getAuthHeaders(token),
        body: JSON.stringify(params), // params should match WordCloudGeneratorParams {textData, maxWords}
      });

      if (!response.ok) {
        const errorText = await response.text();
        let detail = errorText;
        try {
            const errorJson = JSON.parse(errorText);
            detail = errorJson.detail || errorText;
        } catch (e) { /* not JSON */ }
        console.error('Word Cloud Generator API error:', response.status, detail);
        throw new Error(
          `Failed to run Word Cloud Generator: ${response.status} ${response.statusText} - ${detail}`
        );
      }

      const result: WordCloudGeneratorResult = await response.json();
      return result;
    } catch (error) {
      console.error('Word Cloud Generator service error:', error);
      throw error; // Rethrow for the component to handle
    }
  }
}

export const wordCloudGeneratorService = new WordCloudGeneratorService();