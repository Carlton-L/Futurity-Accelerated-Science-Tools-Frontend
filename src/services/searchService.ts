const API_BASE_URL = 'https://tools.futurity.science/api/search';

// API Response Types
export interface SearchSubjectResult {
  _id: { $oid: string };
  ent_fsid: string;
  ent_name: string;
  ent_summary?: string;
  Books_hitcounts?: number;
  Gnews_hitcounts?: number;
  Google_hitcounts?: number;
  Papers_hitcounts?: number;
  Related_terms?: string;
  wikipedia_definition?: string;
  wiktionary_definition?: string;
  category?: string;
  ent_start?: string;
  ent_year?: number;
  inventor?: string;
  last_update?: { $date: { $numberLong: string } };
}

export interface SearchSimilarSubjectResult {
  _id: { $oid: string };
  ent_name: string;
  ent_fsid: string;
  percent: number;
}

export interface SearchAnalysisResult {
  _id: { $oid: string };
  lab_id: string;
  ent_fsid: string;
  ent_name: string;
  ent_summary: string;
  ent_start: string;
  ent_tags: string;
  ent_inventors: string;
  ent_image: string;
  new_ent_id: string;
  status: string;
  visible: boolean;
  picture_url: string | null;
  ent_authors?: any[];
  ent_labs?: { $oid: string }[];
}

export interface SearchOrgResult {
  _id: { $oid: string };
  ent_name: string;
  ent_fsid: string;
}

export interface SearchSubjectsResponse {
  results: {
    keyword: string;
    exact_match?: SearchSubjectResult;
    rows: SearchSubjectResult[];
    count: number;
  };
}

export interface SearchSimilarSubjectsResponse {
  results: {
    keyword: string;
    rows: SearchSimilarSubjectResult[];
    count: number;
  };
}

export interface SearchAnalysesResponse {
  results: {
    keyword: string;
    rows: SearchAnalysisResult[];
    count: number;
  };
}

export interface SearchOrgsResponse {
  results: {
    keyword: string;
    rows: SearchOrgResult[];
    count: number;
  };
}

// Combined search results for the UI
export interface CombinedSearchResults {
  keyword: string;
  exactMatch: SearchSubjectResult | null;
  subjects: SearchSubjectResult[];
  similarSubjects: SearchSimilarSubjectResult[];
  analyses: SearchAnalysisResult[];
  organizations: SearchOrgResult[];
  totalResults: {
    subjects: number;
    analyses: number;
    organizations: number;
  };
}

class SearchService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  async searchSubjects(
    keyword: string,
    limit: number = 300
  ): Promise<SearchSubjectsResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/subjects?keyword=${encodeURIComponent(
          keyword
        )}&limit=${limit}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Search subjects error:', error);
      throw error;
    }
  }

  async searchSimilarSubjects(
    keyword: string
  ): Promise<SearchSimilarSubjectsResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/similar-subjects?keyword=${encodeURIComponent(
          keyword
        )}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Search similar subjects error:', error);
      throw error;
    }
  }

  async searchAnalyses(
    keyword: string,
    limit: number = 35
  ): Promise<SearchAnalysesResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/analyses?keyword=${encodeURIComponent(
          keyword
        )}&limit=${limit}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Search analyses error:', error);
      throw error;
    }
  }

  async searchOrganizations(
    keyword: string,
    limit: number = 35
  ): Promise<SearchOrgsResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/orgs?keyword=${encodeURIComponent(
          keyword
        )}&limit=${limit}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Search organizations error:', error);
      throw error;
    }
  }

  async performCombinedSearch(keyword: string): Promise<CombinedSearchResults> {
    try {
      // Execute all searches in parallel
      const [
        subjectsResponse,
        similarSubjectsResponse,
        analysesResponse,
        orgsResponse,
      ] = await Promise.all([
        this.searchSubjects(keyword),
        this.searchSimilarSubjects(keyword),
        this.searchAnalyses(keyword),
        this.searchOrganizations(keyword),
      ]);

      return {
        keyword,
        exactMatch: subjectsResponse.results.exact_match || null,
        subjects: subjectsResponse.results.rows,
        similarSubjects: similarSubjectsResponse.results.rows,
        analyses: analysesResponse.results.rows,
        organizations: orgsResponse.results.rows,
        totalResults: {
          subjects: subjectsResponse.results.count,
          analyses: analysesResponse.results.count,
          organizations: orgsResponse.results.count,
        },
      };
    } catch (error) {
      console.error('Combined search error:', error);
      throw error;
    }
  }

  // Helper function to create subject slug from name
  createSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_-]+/g, '_') // Replace spaces and hyphens with underscores
      .replace(/^_+|_+$/g, ''); // Remove leading/trailing underscores
  }
}

export const searchService = new SearchService();
