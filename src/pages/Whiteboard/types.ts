// ============================================================================
// Whiteboard Types
// ============================================================================

/**
 * Subject in whiteboard context with enhanced metrics
 */
export interface WhiteboardSubject {
  id: string;
  subjectId: string; // Reference to fst-subject collection
  name: string;
  description: string;
  slug: string;

  // Core metrics (0-100 except Horizon Rank which is 0-1)
  horizonRank: number; // 0-1: Technology maturity (0=speculative, 1=obsolete)
  techTransfer: number; // 0-100: Research to product velocity
  whiteSpace: number; // 0-100: Market opportunity (0=crowded, 100=wide open)

  // Metadata
  addedAt: string; // ISO date string
  addedById?: string;
  source?: 'search' | 'browse' | 'import'; // How it was added

  // Optional AI-generated insights
  aiInsights?: {
    category?: string;
    keywords?: string[];
    relatedSubjects?: string[]; // Subject IDs
    confidence?: number; // 0-100
  };
}

/**
 * Lab Seed collection of subjects for lab creation (formerly Draft)
 */
export interface WhiteboardDraft {
  id: string;
  name: string;
  description?: string;
  subjects: WhiteboardSubject[];
  terms: string[];

  // AI-generated taxonomy and insights
  aiTaxonomy?: {
    primaryCategory: string;
    subCategories: string[];
    confidence: number; // 0-100
    suggestedLabName?: string;
  };

  // Computed metrics
  metrics: DraftMetrics;

  // Metadata
  createdAt: string;
  updatedAt: string;
  createdById: string;

  // Publishing state
  isPublished: boolean;
  publishedLabId?: string;
  publishedAt?: string;
}

/**
 * Computed metrics for a lab seed (formerly draft metrics)
 */
export interface DraftMetrics {
  // Averages
  avgHorizonRank: number;
  avgTechTransfer: number;
  avgWhiteSpace: number;

  // Computed scores
  coherenceScore: number; // 0-100: How well subjects relate (Cluster Coefficient)
  innovationPotential: number; // 0-100: White Space × Tech Transfer
  maturityBalance: number; // 0-100: Spread across Horizon Ranks
  velocityScore: number; // 0-100: Average Tech Transfer

  // Distribution metrics
  subjectCount: number;
  categoryDiversity: number; // Number of distinct AI categories

  // Risk indicators
  competitionRisk: number; // 0-100: Based on low White Space
  speculationRisk: number; // 0-100: Based on low Horizon Rank
  stagnationRisk: number; // 0-100: Based on low Tech Transfer
}

/**
 * Visualization type for lab seed analysis
 */
export type VisualizationType =
  | 'list' // Simple subject listing
  | 'network' // Relationship graph
  | 'matrix' // Innovation opportunity matrix
  | 'radar' // Portfolio balance radar
  | 'heatmap' // Cluster coefficient heatmap
  | 'distribution'; // Metrics distribution

/**
 * Subject search result from external browse/search
 */
export interface SubjectSearchResult {
  id: string;
  name: string;
  slug: string;
  description: string;
  horizonRank: number;
  techTransfer: number;
  whiteSpace: number;

  // Search metadata
  relevanceScore?: number;
  source: string; // Where it came from
  alreadyInWhiteboard?: boolean;
}

/**
 * Filter and sort options for whiteboard
 */
export interface WhiteboardFilters {
  // Metric ranges
  horizonRankRange: [number, number];
  techTransferRange: [number, number];
  whiteSpaceRange: [number, number];

  // Categories
  categories: string[];

  // Search
  searchQuery: string;

  // Sort options
  sortBy: 'name' | 'horizonRank' | 'techTransfer' | 'whiteSpace' | 'addedAt';
  sortOrder: 'asc' | 'desc';
}

/**
 * Lab Seed creation/update requests (formerly Draft)
 */
export interface CreateDraftRequest {
  name: string;
  description?: string;
  subjectIds?: string[]; // Initial subjects
}

export interface UpdateDraftRequest {
  name?: string;
  description?: string;
  subjectIds?: string[]; // Complete list (for reordering)
}

export interface AddSubjectToDraftRequest {
  draftId: string;
  subjectId: string;
}

export interface RemoveSubjectFromDraftRequest {
  draftId: string;
  subjectId: string;
}

/**
 * Lab creation from lab seed
 */
export interface PublishDraftToLabRequest {
  draftId: string;
  labName: string;
  labDescription: string;
  labVisibility: 'Private' | 'Internal' | 'Public';

  // Optional organization
  categorizeSubjects?: boolean; // Use AI taxonomy for categories
  includeMetrics?: boolean; // Add metrics as subject notes
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate comprehensive metrics for a lab seed
 */
export const calculateDraftMetrics = (
  subjects: WhiteboardSubject[]
): DraftMetrics => {
  if (subjects.length === 0) {
    return {
      avgHorizonRank: 0,
      avgTechTransfer: 0,
      avgWhiteSpace: 0,
      coherenceScore: 0,
      innovationPotential: 0,
      maturityBalance: 0,
      velocityScore: 0,
      subjectCount: 0,
      categoryDiversity: 0,
      competitionRisk: 0,
      speculationRisk: 0,
      stagnationRisk: 0,
    };
  }

  // Calculate averages
  const avgHorizonRank =
    subjects.reduce((sum, s) => sum + s.horizonRank, 0) / subjects.length;
  const avgTechTransfer =
    subjects.reduce((sum, s) => sum + s.techTransfer, 0) / subjects.length;
  const avgWhiteSpace =
    subjects.reduce((sum, s) => sum + s.whiteSpace, 0) / subjects.length;

  // Innovation potential (higher white space + higher tech transfer = better)
  const innovationPotential = (avgWhiteSpace * avgTechTransfer) / 100;

  // Maturity balance (how spread out the horizon ranks are)
  const horizonRanks = subjects.map((s) => s.horizonRank);
  const horizonStdDev = Math.sqrt(
    horizonRanks.reduce(
      (sum, hr) => sum + Math.pow(hr - avgHorizonRank, 2),
      0
    ) / horizonRanks.length
  );
  const maturityBalance = Math.min(100, horizonStdDev * 300); // Scale to 0-100

  // Category diversity
  const categories = new Set(
    subjects.map((s) => s.aiInsights?.category).filter(Boolean)
  );
  const categoryDiversity = categories.size;

  // Risk calculations
  const competitionRisk = 100 - avgWhiteSpace; // Low white space = high competition
  const speculationRisk = (1 - avgHorizonRank) * 100; // Low horizon rank = high speculation
  const stagnationRisk = 100 - avgTechTransfer; // Low tech transfer = high stagnation

  // Cluster coefficient score (mock calculation - would use AI in real implementation)
  const coherenceScore = Math.max(
    0,
    100 - categoryDiversity * 10 - horizonStdDev * 50
  );

  return {
    avgHorizonRank,
    avgTechTransfer,
    avgWhiteSpace,
    coherenceScore: Math.min(100, Math.max(0, coherenceScore)),
    innovationPotential: Math.min(100, innovationPotential),
    maturityBalance,
    velocityScore: avgTechTransfer,
    subjectCount: subjects.length,
    categoryDiversity,
    competitionRisk,
    speculationRisk,
    stagnationRisk,
  };
};

/**
 * Get color scheme for metrics based on value and type
 */
export const getMetricColorScheme = (
  value: number,
  type: 'horizonRank' | 'techTransfer' | 'whiteSpace' | 'score'
): 'red' | 'orange' | 'green' | 'blue' => {
  switch (type) {
    case 'horizonRank':
      // Lower is more speculative (red), middle is emerging (orange), higher is mature (green)
      if (value < 0.3) return 'red';
      if (value < 0.7) return 'orange';
      return 'green';

    case 'techTransfer':
      // Higher is better (more active research → product pipeline)
      if (value < 40) return 'red';
      if (value < 70) return 'orange';
      return 'green';

    case 'whiteSpace':
      // Higher is better (more opportunity)
      if (value < 30) return 'red';
      if (value < 60) return 'orange';
      return 'green';

    case 'score':
      // Generic score where higher is better
      if (value < 40) return 'red';
      if (value < 70) return 'orange';
      return 'green';

    default:
      return 'blue';
  }
};

/**
 * Generate innovation opportunity quadrant
 */
export const getInnovationQuadrant = (
  whiteSpace: number,
  techTransfer: number
): { name: string; color: string; description: string } => {
  const wsHigh = whiteSpace >= 50;
  const ttHigh = techTransfer >= 50;

  if (wsHigh && ttHigh) {
    return {
      name: 'Blue Ocean',
      color: 'blue',
      description: 'High opportunity, high velocity - ideal for innovation',
    };
  }
  if (wsHigh && !ttHigh) {
    return {
      name: 'Emerging',
      color: 'orange',
      description: 'High opportunity, low velocity - early stage potential',
    };
  }
  if (!wsHigh && ttHigh) {
    return {
      name: 'Competitive',
      color: 'red',
      description: 'Low opportunity, high velocity - intense competition',
    };
  }
  return {
    name: 'Saturated',
    color: 'gray',
    description: 'Low opportunity, low velocity - mature/declining market',
  };
};

/**
 * Generate AI taxonomy suggestions for a lab seed
 * (Mock implementation - would use real AI service)
 */
export const generateTaxonomySuggestions = (
  subjects: WhiteboardSubject[]
): {
  primaryCategory: string;
  subCategories: string[];
  confidence: number;
  suggestedLabName: string;
} => {
  if (subjects.length === 0) {
    return {
      primaryCategory: 'Uncategorized',
      subCategories: [],
      confidence: 0,
      suggestedLabName: 'New Lab',
    };
  }

  // Mock AI logic based on subject keywords
  const keywords = subjects.flatMap((s) => s.name.toLowerCase().split(' '));

  // Simple heuristics for demonstration
  if (
    keywords.some((k) =>
      [
        'quantum',
        'computing',
        'ai',
        'artificial',
        'machine',
        'learning',
      ].includes(k)
    )
  ) {
    return {
      primaryCategory: 'Advanced Computing',
      subCategories: [
        'Quantum Systems',
        'AI & Machine Learning',
        'Computing Infrastructure',
      ],
      confidence: 85,
      suggestedLabName: 'Next-Gen Computing Lab',
    };
  }

  if (
    keywords.some((k) =>
      ['bio', 'health', 'medical', 'genetic', 'pharmaceutical'].includes(k)
    )
  ) {
    return {
      primaryCategory: 'Biotechnology',
      subCategories: [
        'Medical Technology',
        'Genetic Engineering',
        'Drug Discovery',
      ],
      confidence: 90,
      suggestedLabName: 'BioTech Innovation Lab',
    };
  }

  if (
    keywords.some((k) =>
      ['climate', 'energy', 'carbon', 'renewable', 'solar', 'wind'].includes(k)
    )
  ) {
    return {
      primaryCategory: 'Climate Technology',
      subCategories: ['Clean Energy', 'Carbon Solutions', 'Sustainability'],
      confidence: 88,
      suggestedLabName: 'Climate Solutions Lab',
    };
  }

  if (
    keywords.some((k) =>
      ['space', 'satellite', 'aerospace', 'rocket', 'orbit'].includes(k)
    )
  ) {
    return {
      primaryCategory: 'Space Technology',
      subCategories: [
        'Satellite Systems',
        'Launch Technology',
        'Space Exploration',
      ],
      confidence: 82,
      suggestedLabName: 'Space Innovation Lab',
    };
  }

  // Default fallback
  return {
    primaryCategory: 'Technology Innovation',
    subCategories: ['Emerging Technology'],
    confidence: 60,
    suggestedLabName: 'Innovation Lab',
  };
};

/**
 * Validate lab seed before publishing
 */
export const validateDraftForPublishing = (
  draft: WhiteboardDraft
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required validations
  if (draft.subjects.length === 0) {
    errors.push('Lab seed must contain at least one subject');
  }

  if (!draft.name.trim()) {
    errors.push('Lab seed must have a name');
  }

  // Warning validations
  if (draft.subjects.length < 3) {
    warnings.push('Consider adding more subjects for a richer lab experience');
  }

  if (draft.metrics.coherenceScore < 50) {
    warnings.push(
      'Low cluster coefficient score - subjects may not relate well together'
    );
  }

  if (draft.metrics.categoryDiversity === 1) {
    warnings.push(
      'All subjects are in the same category - consider diversifying'
    );
  }

  if (draft.metrics.innovationPotential < 30) {
    warnings.push(
      'Low innovation potential - consider subjects with higher opportunity or velocity'
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};
