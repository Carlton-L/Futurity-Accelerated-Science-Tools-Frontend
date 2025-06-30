import { v4 as uuidv4 } from 'uuid';

// Assuming fst-labdata is a specific format, perhaps a JSON structure or CSV content
type FstLabData = string | Record<string, any>; // Could be string (CSV) or JSON object

interface KeywordHeatmapperParams {
  keywordAppearanceTable: HeatmapDataPoint[]; // Changed FstLabData to HeatmapDataPoint[] for clarity with backend
  // Potentially other parameters like color schemes, normalization methods, etc.
}

export interface HeatmapDataPoint { // Added export
  documentId: string;
  keyword: string;
  frequency: number;
}

interface KeywordHeatmapperResult {
  heatmapId: string;
  message: string; // Added from backend response model
  heatmapSvg?: string;
  heatmapData?: HeatmapDataPoint[];
  statistics?: Record<string, any>;
}

const API_BASE_URL = 'https://fast.futurity.science/tools';

class KeywordHeatmapperService {
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
   * Simulate calling the Keyword Heatmapper API
   */
  async runTool(
    params: KeywordHeatmapperParams,
    token: string
  ): Promise<KeywordHeatmapperResult> {
    console.log('Running Keyword Heatmapper with params:', params);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1800));

    // const mockHeatmapData: HeatmapDataPoint[] = [
    //   { documentId: "doc1", keyword: "AI", frequency: 15 },
    //   { documentId: "doc2", keyword: "Data", frequency: 20 },
    // ];
    // const mockResult: KeywordHeatmapperResult = {
    //   heatmapId: `heatmap_${this.generateUUID()}`,
    //   message: "Mocked heatmap generated.",
    //   heatmapSvg: `<svg width="100" height="50"><rect x="10" y="10" width="80" height="30" style="fill:rgb(200,100,50);" /><text x="15" y="30" fill="white">Mock SVG</text></svg>`,
    //   heatmapData: mockHeatmapData,
    //   statistics: { totalKeywords: 2, totalDocuments: 2, maxFrequency: 20 }
    // };
    // return mockResult; // For testing without backend

    try {
      // The backend endpoint is /tools/keyword-heatmapper
      const response = await fetch(`${API_BASE_URL}/keyword-heatmapper`, {
        method: 'POST',
        headers: this.getAuthHeaders(token),
        body: JSON.stringify(params), // params already contains keywordAppearanceTable as HeatmapDataPoint[]
      });

      if (!response.ok) {
        const errorText = await response.text();
        let detail = errorText;
        try {
            const errorJson = JSON.parse(errorText);
            detail = errorJson.detail || errorText;
        } catch (e) { /* not JSON */ }
        console.error('Keyword Heatmapper API error:', response.status, detail);
        throw new Error(
          `Failed to run Keyword Heatmapper: ${response.status} ${response.statusText} - ${detail}`
        );
      }

      const result: KeywordHeatmapperResult = await response.json();
      return result;
    } catch (error) {
      console.error('Keyword Heatmapper service error:', error);
      throw error; // Rethrow for the component to handle
    }
  }
}

export const keywordHeatmapperService = new KeywordHeatmapperService();