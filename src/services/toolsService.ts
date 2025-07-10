// services/toolsService.ts

const API_BASE_URL = 'https://fast.futurity.science/analyze';

// Type definitions for Text Summarizer
export interface TextSummarizerRequest {
  text: string;
}

export interface TextSummarizerResponse {
  summary: string;
}

// Type definitions for Correlation Finder
export interface TimeseriesItem {
  ent_name: string;
  ent_fsid: string;
  ent_metric_type: string;
  metric: string;
  units: string;
  ent_place: string;
}

export interface AvailableSeriesRequest {
  dataset: string;
}

export interface AvailableSeriesResponse {
  series: TimeseriesItem[];
  count: number;
  columns: string[];
}

export interface CorrelationFinderRequest {
  dataset1: string;
  dataset2: string;
  fsid1: string;
  fsid2: string;
  analysis_type: string;
  forecast_years: number;
}

export interface InflectionPoint {
  year: number;
  value: number;
  type: 'local_maximum' | 'local_minimum';
}

export interface ForecastData {
  years: number[];
  values: number[];
  model_params: {
    order: number[];
    aic: number;
    bic: number;
  };
}

export interface CorrelationFinderResponse {
  correlation: number;
  correlation_interpretation: string;
  plot: string; // JSON string containing Plotly plot data
  overlapping_years: number;
  year_range: {
    start: number;
    end: number;
  };
  forecast: Record<string, ForecastData>;
  inflection_points: Record<
    string,
    {
      count: number;
      points: InflectionPoint[];
    }
  >;
}

// Cache keys for localStorage
const CACHE_KEYS = {
  AVAILABLE_SERIES: 'futurity_tools_available_series',
  AVAILABLE_SERIES_TIMESTAMP: 'futurity_tools_available_series_timestamp',
} as const;

// Cache TTL: 24 hours for available series (they don't change often)
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

class ToolsService {
  private getAuthHeaders(token: string): HeadersInit {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  // ===================
  // TEXT SUMMARIZER
  // ===================

  /**
   * Summarize text using the text summarizer tool
   */
  async summarizeText(
    text: string,
    token: string
  ): Promise<TextSummarizerResponse> {
    const request: TextSummarizerRequest = {
      text: text.trim(),
    };

    console.log('🔤 Summarizing text:', {
      textLength: text.length,
      textPreview: text.substring(0, 100) + '...',
    });

    const response = await fetch(`${API_BASE_URL}/text_summarizer/`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      }
      if (response.status === 403) {
        throw new Error('You do not have permission to use this tool.');
      }
      if (response.status === 400) {
        const errorText = await response.text();
        throw new Error(`Invalid request: ${errorText}`);
      }

      const errorText = await response.text();
      throw new Error(
        `Failed to summarize text: ${response.status} ${response.statusText}. ${errorText}`
      );
    }

    const result = await response.json();
    console.log('✅ Text summarized successfully:', {
      originalLength: text.length,
      summaryLength: result.summary.length,
    });

    return result;
  }

  // ===================
  // CORRELATION FINDER
  // ===================

  /**
   * Get available timeseries from cache or API
   */
  async getAvailableTimeseries(
    token: string,
    forceRefresh: boolean = false
  ): Promise<TimeseriesItem[]> {
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = this.getCachedAvailableSeries();
      if (cached) {
        console.log(
          '💾 Using cached available series:',
          cached.length,
          'items'
        );
        return cached;
      }
    }

    console.log('🌐 Fetching available timeseries from API...');

    const request: AvailableSeriesRequest = {
      dataset: 'timeseries',
    };

    const response = await fetch(
      `${API_BASE_URL}/correlation_finder/available_series/`,
      {
        method: 'POST',
        headers: this.getAuthHeaders(token),
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      }
      if (response.status === 403) {
        throw new Error('You do not have permission to use this tool.');
      }

      const errorText = await response.text();
      throw new Error(
        `Failed to fetch available timeseries: ${response.status} ${response.statusText}. ${errorText}`
      );
    }

    const result: AvailableSeriesResponse = await response.json();

    console.log('✅ Available timeseries fetched:', {
      count: result.count,
      seriesReturned: result.series.length,
    });

    // Cache the results
    this.cacheAvailableSeries(result.series);

    return result.series;
  }

  /**
   * Run correlation analysis between two timeseries
   */
  async runCorrelationAnalysis(
    fsid1: string,
    fsid2: string,
    forecastYears: number,
    token: string
  ): Promise<CorrelationFinderResponse> {
    const request: CorrelationFinderRequest = {
      dataset1: 'timeseries',
      dataset2: 'timeseries',
      fsid1,
      fsid2,
      analysis_type: 'correlation',
      forecast_years: forecastYears,
    };

    console.log('📊 Running correlation analysis:', {
      fsid1,
      fsid2,
      forecastYears,
    });

    const response = await fetch(`${API_BASE_URL}/correlation_finder/`, {
      method: 'POST',
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      }
      if (response.status === 403) {
        throw new Error('You do not have permission to use this tool.');
      }
      if (response.status === 400) {
        const errorText = await response.text();
        throw new Error(`Invalid correlation request: ${errorText}`);
      }

      const errorText = await response.text();
      throw new Error(
        `Failed to run correlation analysis: ${response.status} ${response.statusText}. ${errorText}`
      );
    }

    const result = await response.json();

    console.log('✅ Correlation analysis completed:', {
      correlation: result.correlation,
      overlappingYears: result.overlapping_years,
      yearRange: result.year_range,
    });

    return result;
  }

  // ===================
  // CACHE MANAGEMENT
  // ===================

  /**
   * Cache available series in localStorage
   */
  private cacheAvailableSeries(series: TimeseriesItem[]): void {
    try {
      const timestamp = Date.now();
      localStorage.setItem(CACHE_KEYS.AVAILABLE_SERIES, JSON.stringify(series));
      localStorage.setItem(
        CACHE_KEYS.AVAILABLE_SERIES_TIMESTAMP,
        timestamp.toString()
      );
      console.log('💾 Cached available series:', series.length, 'items');
    } catch (error) {
      console.error('Failed to cache available series:', error);
    }
  }

  /**
   * Get cached available series if valid
   */
  private getCachedAvailableSeries(): TimeseriesItem[] | null {
    try {
      const cached = localStorage.getItem(CACHE_KEYS.AVAILABLE_SERIES);
      const timestampStr = localStorage.getItem(
        CACHE_KEYS.AVAILABLE_SERIES_TIMESTAMP
      );

      if (!cached || !timestampStr) {
        return null;
      }

      const timestamp = parseInt(timestampStr, 10);
      const now = Date.now();

      // Check if cache is expired
      if (now - timestamp > CACHE_TTL) {
        console.log('⏰ Available series cache expired');
        this.clearAvailableSeriesCache();
        return null;
      }

      const series: TimeseriesItem[] = JSON.parse(cached);
      return series;
    } catch (error) {
      console.error('Failed to get cached available series:', error);
      this.clearAvailableSeriesCache();
      return null;
    }
  }

  /**
   * Clear cached available series
   */
  clearAvailableSeriesCache(): void {
    try {
      localStorage.removeItem(CACHE_KEYS.AVAILABLE_SERIES);
      localStorage.removeItem(CACHE_KEYS.AVAILABLE_SERIES_TIMESTAMP);
      console.log('🗑️ Cleared available series cache');
    } catch (error) {
      console.error('Failed to clear available series cache:', error);
    }
  }

  /**
   * Check if cached data exists and is valid
   */
  hasCachedAvailableSeries(): boolean {
    return this.getCachedAvailableSeries() !== null;
  }

  /**
   * Get cache info for debugging
   */
  getCacheInfo(): {
    hasCached: boolean;
    cachedCount: number;
    cacheAge: number;
    isExpired: boolean;
  } {
    const timestampStr = localStorage.getItem(
      CACHE_KEYS.AVAILABLE_SERIES_TIMESTAMP
    );
    const cached = localStorage.getItem(CACHE_KEYS.AVAILABLE_SERIES);

    if (!cached || !timestampStr) {
      return {
        hasCached: false,
        cachedCount: 0,
        cacheAge: 0,
        isExpired: true,
      };
    }

    try {
      const timestamp = parseInt(timestampStr, 10);
      const now = Date.now();
      const cacheAge = now - timestamp;
      const series: TimeseriesItem[] = JSON.parse(cached);

      return {
        hasCached: true,
        cachedCount: series.length,
        cacheAge,
        isExpired: cacheAge > CACHE_TTL,
      };
    } catch (error) {
      return {
        hasCached: false,
        cachedCount: 0,
        cacheAge: 0,
        isExpired: true,
      };
    }
  }

  // ===================
  // HELPER METHODS
  // ===================

  /**
   * Filter timeseries based on search query
   */
  filterTimeseries(
    series: TimeseriesItem[],
    searchQuery: string
  ): TimeseriesItem[] {
    if (!searchQuery.trim()) {
      return series;
    }

    const query = searchQuery.toLowerCase().trim();

    return series.filter((item) => {
      // Safely convert properties to lowercase, handling null/undefined values
      const name = (item.ent_name || '').toLowerCase();
      const fsid = (item.ent_fsid || '').toLowerCase();
      const metric = (item.metric || '').toLowerCase();
      const units = (item.units || '').toLowerCase();
      const place = (item.ent_place || '').toLowerCase();
      const metricType = (item.ent_metric_type || '').toLowerCase();

      return (
        name.includes(query) ||
        fsid.includes(query) ||
        metric.includes(query) ||
        units.includes(query) ||
        place.includes(query) ||
        metricType.includes(query)
      );
    });
  }

  /**
   * Get display name for timeseries item
   */
  getTimeseriesDisplayName(item: TimeseriesItem): string {
    const name = item.ent_name || 'Unknown';
    const metric = item.metric || 'Unknown metric';
    const units = item.units || 'Unknown units';
    const place = item.ent_place || 'Unknown location';

    return `${name} (${metric} in ${units}) - ${place}`;
  }

  /**
   * Get short display name for timeseries item
   */
  getTimeseriesShortName(item: TimeseriesItem): string {
    const name = item.ent_name || 'Unknown';
    const place = item.ent_place || 'Unknown location';

    return `${name} - ${place}`;
  }

  /**
   * Parse correlation interpretation to get sentiment
   */
  getCorrelationSentiment(
    interpretation: string
  ): 'positive' | 'negative' | 'weak' | 'strong' {
    if (!interpretation) {
      return 'weak'; // default for undefined/null
    }

    const lower = interpretation.toLowerCase();

    if (lower.includes('strong')) {
      return 'strong';
    } else if (lower.includes('weak') || lower.includes('very weak')) {
      return 'weak';
    } else if (lower.includes('positive')) {
      return 'positive';
    } else if (lower.includes('negative')) {
      return 'negative';
    }

    return 'weak'; // default
  }

  /**
   * Format correlation value for display
   */
  formatCorrelation(correlation: number): string {
    return (correlation * 100).toFixed(1) + '%';
  }

  /**
   * Format forecast years display
   */
  formatForecastYears(years: number[]): string {
    if (years.length === 0) return 'No forecast';
    const start = Math.min(...years);
    const end = Math.max(...years);
    return years.length === 1 ? `${start}` : `${start}-${end}`;
  }

  // ===================
  // FUTURE STORIES
  // ===================

  /**
   * Generate a future story
   */
  async generateFutureStory(
    storyDetails: string,
    formatOption:
      | 'future_journalist'
      | 'microfiction'
      | 'aidvertising'
      | 'social_media'
      | 'screenplay_pitch'
      | 'custom',
    yearRange: [number, number],
    customPrompt: string | null,
    token: string
  ): Promise<{ story: string; error: string | null }> {
    const request = {
      story_details: storyDetails.trim(),
      format_option: formatOption,
      year_range: yearRange,
      ...(customPrompt && { custom_prompt: customPrompt }),
    };

    console.log('📝 Generating future story:', {
      formatOption,
      yearRange,
      storyDetailsLength: storyDetails.length,
      hasCustomPrompt: !!customPrompt,
    });

    const response = await fetch(
      'https://fast.futurity.science/launch/future_stories/',
      {
        method: 'POST',
        headers: this.getAuthHeaders(token),
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      }
      if (response.status === 403) {
        throw new Error('You do not have permission to use this tool.');
      }
      if (response.status === 400) {
        const errorText = await response.text();
        throw new Error(`Invalid request: ${errorText}`);
      }

      const errorText = await response.text();
      throw new Error(
        `Failed to generate future story: ${response.status} ${response.statusText}. ${errorText}`
      );
    }

    const result = await response.json();

    console.log('✅ Future story generated successfully:', {
      storyLength: result.story?.length || 0,
      hasError: !!result.error,
    });

    return result;
  }

  // ===================
  // FUTUREGRAPHER
  // ===================

  /**
   * Generate a future image (now returns URL instead of base64)
   */
  async generateFutureImage(
    prompt: string,
    token: string
  ): Promise<{
    success: boolean;
    enhanced_prompt: string;
    used_prompt: string;
    image_url: string;
    message: string;
    error: string | null;
  }> {
    const request = {
      prompt: prompt.trim(),
    };

    console.log('🎨 Generating future image:', {
      promptLength: prompt.length,
      promptPreview: prompt.substring(0, 100) + '...',
    });

    const response = await fetch(
      'https://fast.futurity.science/launch/futuregrapher/',
      {
        method: 'POST',
        headers: this.getAuthHeaders(token),
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required. Please log in again.');
      }
      if (response.status === 403) {
        throw new Error('You do not have permission to use this tool.');
      }
      if (response.status === 400) {
        const errorText = await response.text();
        throw new Error(`Invalid request: ${errorText}`);
      }

      const errorText = await response.text();
      throw new Error(
        `Failed to generate future image: ${response.status} ${response.statusText}. ${errorText}`
      );
    }

    const result = await response.json();

    console.log('✅ Future image generated successfully:', {
      success: result.success,
      imageUrl: result.image_url,
      hasError: !!result.error,
    });

    return result;
  }

  // ===================
  // HELPER METHODS FOR INVENTION TOOLS
  // ===================

  /**
   * Get format option display names
   */
  getFormatOptionDisplayName(option: string): string {
    const displayNames: Record<string, string> = {
      future_journalist: 'Future Journalist Article',
      microfiction: 'Microfiction (Short Story)',
      aidvertising: 'Future Advertisement',
      social_media: 'Social Media Post',
      screenplay_pitch: 'Screenplay Pitch',
      custom: 'Custom Format',
    };

    return displayNames[option] || option;
  }

  /**
   * Get format option descriptions
   */
  getFormatOptionDescription(option: string): string {
    const descriptions: Record<string, string> = {
      future_journalist: 'Write a magazine article from a future date',
      microfiction: 'Write a short story (1000 words or less)',
      aidvertising: 'Make an ad for your future product or service',
      social_media:
        'Create a short social post from a person living in the future world',
      screenplay_pitch: 'Write the pitch to make a movie of your idea',
      custom: 'Use your own custom story format',
    };

    return descriptions[option] || '';
  }

  /**
   * Download image from URL
   */
  async downloadImageFromUrl(
    imageUrl: string,
    filename?: string
  ): Promise<void> {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'futuregrapher-image.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
      throw new Error('Failed to download image');
    }
  }

  /**
   * Extract filename from image URL
   */
  getFilenameFromUrl(url: string): string {
    try {
      const urlPath = new URL(url).pathname;
      return urlPath.split('/').pop() || 'futuregrapher-image.png';
    } catch (error) {
      return 'futuregrapher-image.png';
    }
  }

  // ===================
  // DEPRECATED METHODS (for backward compatibility)
  // ===================

  /**
   * @deprecated Use downloadImageFromUrl instead
   * Convert base64 image data to blob URL
   */
  convertBase64ToBlob(
    base64Data: string,
    mimeType: string = 'image/png'
  ): string {
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    return URL.createObjectURL(blob);
  }

  /**
   * @deprecated Use downloadImageFromUrl instead
   * Download image from base64 data
   */
  downloadImageFromBase64(base64Data: string, filename: string): void {
    const blobUrl = this.convertBase64ToBlob(base64Data);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  }
}

export const toolsService = new ToolsService();
