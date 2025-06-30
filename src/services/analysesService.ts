// services/analysesService.ts

const API_BASE_URL = 'https://fast.futurity.science/management/analyses';

// Type definitions for the Analyses API
export interface AnalysisAuthor {
  id: string;
  name?: string; // Will be available when we have the author endpoint
}

export interface AnalysisMetadata {
  lab_id?: string;
  ent_name: string;
  ent_summary: string;
  ent_start: string;
  ent_tags: string;
  ent_inventors: string;
  ent_image?: string;
  picture_url?: string | null;
  thumb_url?: string | null;
  status: 'soon' | 'ready' | 'draft' | 'published';
  visible: boolean;
  ent_authors: string[];
}

export interface Analysis {
  _id: string;
  uniqueID: string;
  unique_name: string;
  lab_uniqueID: string;
  name: string;
  metadata: AnalysisMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface AnalysisWithContent extends Analysis {
  analysis: string; // HTML content
}

class AnalysesService {
  private getAuthHeaders(token: string): HeadersInit {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  // Get all analyses
  async getAnalyses(token: string): Promise<Analysis[]> {
    const response = await fetch(`${API_BASE_URL}/`, {
      method: 'GET',
      headers: this.getAuthHeaders(token),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch analyses: ${response.status}`);
    }

    const analyses: Analysis[] = await response.json();

    // Filter only visible analyses
    return analyses.filter((analysis) => analysis.metadata.visible === true);
  }

  // Get a specific analysis by ID with HTML content
  async getAnalysisById(
    analysisId: string,
    token: string
  ): Promise<AnalysisWithContent> {
    const response = await fetch(
      `${API_BASE_URL}/${analysisId}?include_html=true`,
      {
        method: 'GET',
        headers: this.getAuthHeaders(token),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch analysis: ${response.status}`);
    }

    return response.json();
  }

  // Helper method to get display name for analysis
  getDisplayName(analysis: Analysis): string {
    return analysis.metadata.ent_name || analysis.name;
  }

  // Helper method to get authors display (currently using inventors)
  getAuthorsDisplay(analysis: Analysis): string {
    // For now, return inventors. Later we can fetch actual author names
    return analysis.metadata.ent_inventors || 'Unknown';
  }

  // Helper method to get status badge color
  getStatusColor(status: string): string {
    switch (status) {
      case 'ready':
      case 'published':
        return 'success';
      case 'draft':
        return 'warning';
      case 'soon':
        return 'info';
      default:
        return 'default';
    }
  }

  // Helper method to format tags
  formatTags(tags: string): string[] {
    return tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
  }
}

export const analysesService = new AnalysesService();
