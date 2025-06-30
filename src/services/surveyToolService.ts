import { v4 as uuidv4 } from 'uuid';

interface SurveyToolParams {
  surveyTemplateCsv: string; // Content of the CSV or a link/ID
  targetRespondents: string[]; // List of emails or identifiers
  // Add other relevant parameters
}

interface SurveyToolResult {
  surveyDistributionId: string;
  analysisReportId?: string;
  message: string; // Added from backend response model
  parsedQuestionsCount?: number; // Added from backend response model
  respondentsCount: number; // Added from backend response model
}

const API_BASE_URL = 'https://fast.futurity.science/tools';

class SurveyToolService {
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
   * Simulate calling the Survey Tool API
   */
  async runTool(
    params: SurveyToolParams,
    token: string
  ): Promise<SurveyToolResult> {
    console.log('Running Survey Tool with params:', params);
    // console.log('Running Survey Tool with params:', params); // Already present
    // await new Promise((resolve) => setTimeout(resolve, 1500)); // Mock delay

    // const mockResult: SurveyToolResult = {
    //   surveyDistributionId: `survey_dist_${this.generateUUID()}`,
    //   analysisReportId: `report_ana_${this.generateUUID()}`,
    //   message: "Survey created and distribution (mocked).",
    //   parsedQuestionsCount: params.surveyTemplateCsv.split('\n')[0]?.split(',').length || 0,
    //   respondentsCount: params.targetRespondents.length
    // };
    // return mockResult; // For testing without backend

    try {
      const response = await fetch(`${API_BASE_URL}/survey-tool`, {
        method: 'POST',
        headers: this.getAuthHeaders(token),
        body: JSON.stringify(params), // FastAPI will parse this into SurveyToolRequest
      });

      if (!response.ok) {
        const errorText = await response.text();
        let detail = errorText;
        try {
            const errorJson = JSON.parse(errorText);
            detail = errorJson.detail || errorText;
        } catch (e) { /* not JSON */ }
        console.error('Survey Tool API error:', response.status, detail);
        throw new Error(
          `Failed to run Survey Tool: ${response.status} ${response.statusText} - ${detail}`
        );
      }

      const result: SurveyToolResult = await response.json();
      return result;
    } catch (error) {
      console.error('Survey Tool service error:', error);
      throw error; // Rethrow for the component to handle
    }
  }
}

export const surveyToolService = new SurveyToolService();