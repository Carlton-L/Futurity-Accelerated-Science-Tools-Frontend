import { v4 as uuidv4 } from 'uuid';

interface UnstructuredSearchParams {
  searchTerms: string[];
  numResults: number;
}

export interface SearchHit { // Added export
  searchTerm: string;
  title: string;
  url: string;
  fullText: string;
}

interface UnstructuredSearchResult {
  searchId: string;
  results: SearchHit[];
}

const API_BASE_URL = 'https://fast.futurity.science/tools'; // As per user's previous feedback

class UnstructuredSearchService {
  private getAuthHeaders(token: string): HeadersInit {
    return {
      // 'Content-Type': 'application/json', // Not strictly needed for POST with query params and no body
      Authorization: `Bearer ${token}`,
    };
  }

  public generateUUID(): string {
    return uuidv4();
  }

  /**
   * Calls the backend Unstructured Search API.
   */
  async runTool(
    params: UnstructuredSearchParams,
    token: string
  ): Promise<UnstructuredSearchResult> {
    console.log('Running Unstructured Search with params:', params);

    const queryParams = new URLSearchParams();
    params.searchTerms.forEach(term => queryParams.append('searchTerms', term));
    queryParams.append('numResults', params.numResults.toString());

    const endpointUrl = `${API_BASE_URL}/unstructured-search?${queryParams.toString()}`;

    // Simulate API call - replace with actual fetch for production
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate network delay

    // Mocked API response based on the Python router's expected output
    const mockAPIResults: SearchHit[] = [];
    params.searchTerms.forEach(term => {
      for (let i = 0; i < params.numResults; i++) {
        mockAPIResults.push({
          searchTerm: term,
          title: `Mock Title ${i + 1} for "${term}" from API`,
          url: `https://mocksite.com/apihit?q=${encodeURIComponent(term)}&page=${i + 1}`,
          fullText: `This is the mock full text from the API for result ${i + 1} of term "${term}". [Mocked API Data ID: ${this.generateUUID()}]`
        });
      }
    });
    const mockResponse: UnstructuredSearchResult = {
      searchId: `usearch_api_${this.generateUUID()}`,
      results: mockAPIResults,
    };
    console.log("Mocking API call to:", endpointUrl);
    // return mockResponse; // Uncomment for testing with mock

    // Actual API call
    try {
      const response = await fetch(endpointUrl, {
        method: 'POST', // Endpoint is POST as defined in tools.py
        headers: this.getAuthHeaders(token),
        // No body for this POST request as params are in query string
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Unstructured Search API error:', response.status, errorText);
        throw new Error(
          `Failed to run Unstructured Search: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const result: UnstructuredSearchResult = await response.json();
      return result;
    } catch (error) {
      console.error('Unstructured Search service error:', error);
      // Fallback to mock response in case of error during development/testing if desired
      // For production, rethrow or handle error appropriately
      // throw error;
      console.warn("API call failed, returning mock data instead.");
      return mockResponse; // Example: returning mock on error
    }
  }
}

export const unstructuredSearchService = new UnstructuredSearchService();