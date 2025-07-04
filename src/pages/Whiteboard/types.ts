// ============================================================================
// Whiteboard Types
// ============================================================================

/**
 * Subject in whiteboard context from API
 */
export interface WhiteboardSubject {
  ent_fsid: string; // Subject unique identifier (e.g., "fsid_metaverse")
  ent_name: string; // Subject name
  ent_summary: string; // Subject description/summary
  indexes: Array<{
    HR: number; // Horizon Rank (0-10)
    TT: number; // Tech Transfer (0-10)
    WS: number; // White Space (0-10)
  }>; // May be empty array if not calculated
}

/**
 * Lab Seed collection of subjects and terms from API
 */
export interface WhiteboardLabSeed {
  uniqueID: string; // Lab seed unique identifier
  name: string;
  description: string;
  terms: string[]; // Array of term strings
  subjects: WhiteboardSubject[]; // Array of subjects in this lab seed
  createdAt: string; // ISO date string
}

/**
 * Complete whiteboard data from API
 */
export interface WhiteboardData {
  _id: string;
  uniqueID: string; // Whiteboard unique identifier for API calls
  userID: string;
  subjects: WhiteboardSubject[];
  labSeeds: WhiteboardLabSeed[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Subject search result from external search
 */
export interface SubjectSearchResult {
  _id: string;
  ent_fsid: string; // Subject unique identifier
  ent_name: string;
  ent_summary: string;

  // Search metadata
  relevanceScore?: number;
  source?: string; // Where it came from
  alreadyInWhiteboard?: boolean;
}

/**
 * Filter and sort options for whiteboard
 */
export interface WhiteboardFilters {
  // Search
  searchQuery: string;

  // Sort options
  sortBy: 'name' | 'addedAt';
  sortOrder: 'asc' | 'desc';
}

/**
 * Drag and drop item type
 */
export interface DragItem {
  type: string;
  fsid: string;
  sourceType: 'whiteboard' | 'labSeed';
  sourceLabSeedId?: string;
}

/**
 * Page context data for whiteboard
 */
export interface WhiteboardPageContext {
  pageType: 'whiteboard';
  pageTitle: string;
  drafts: Array<{
    id: string;
    name: string;
    subjects: Array<{
      id: string;
      name: string;
      title: string;
    }>;
    terms: Array<{
      id: string;
      name: string;
      text: string;
    }>;
  }>;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get metric value from subject indexes (returns null if not available)
 */
export const getMetricValue = (
  subject: WhiteboardSubject,
  metric: 'HR' | 'TT' | 'WS'
): number | null => {
  if (!subject.indexes || subject.indexes.length === 0) {
    return null;
  }

  const firstIndex = subject.indexes[0];
  return firstIndex[metric] ?? null;
};

/**
 * Check if subject has calculated metrics
 */
export const hasMetrics = (subject: WhiteboardSubject): boolean => {
  return subject.indexes && subject.indexes.length > 0;
};

/**
 * Filter subjects by search query
 */
export const filterSubjects = (
  subjects: WhiteboardSubject[],
  searchQuery: string
): WhiteboardSubject[] => {
  if (!searchQuery.trim()) {
    return subjects;
  }

  const query = searchQuery.toLowerCase();
  return subjects.filter(
    (subject) =>
      subject.ent_name.toLowerCase().includes(query) ||
      subject.ent_summary.toLowerCase().includes(query)
  );
};

/**
 * Sort subjects by specified criteria
 */
export const sortSubjects = (
  subjects: WhiteboardSubject[],
  sortBy: 'name' | 'addedAt',
  sortOrder: 'asc' | 'desc'
): WhiteboardSubject[] => {
  const sorted = [...subjects].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.ent_name.localeCompare(b.ent_name);
      case 'addedAt':
        // Since we don't have addedAt in the API data, sort by name as fallback
        return a.ent_name.localeCompare(b.ent_name);
      default:
        return 0;
    }
  });

  return sortOrder === 'desc' ? sorted.reverse() : sorted;
};

/**
 * Get color for metric based on value
 */
export const getMetricColor = (
  value: number | null,
  type: 'HR' | 'TT' | 'WS'
): string => {
  if (value === null) return '#666666';

  switch (type) {
    case 'HR':
      return '#D4AF37'; // Gold for Horizon Rank
    case 'TT':
      return '#20B2AA'; // Teal for Tech Transfer
    case 'WS':
      return '#FF6B47'; // Coral for White Space
    default:
      return '#666666';
  }
};

/**
 * Validate lab seed data
 */
export const validateLabSeed = (
  name: string,
  description: string
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!name.trim()) {
    errors.push('Lab seed name is required');
  }

  if (name.trim().length > 100) {
    errors.push('Lab seed name must be less than 100 characters');
  }

  if (description.length > 500) {
    errors.push('Description must be less than 500 characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Check if subject can be added to lab seed
 */
export const canAddSubjectToLabSeed = (
  subject: WhiteboardSubject,
  labSeed: WhiteboardLabSeed
): boolean => {
  return !labSeed.subjects.some((s) => s.ent_fsid === subject.ent_fsid);
};

/**
 * Get lab seed statistics
 */
export const getLabSeedStats = (labSeed: WhiteboardLabSeed) => {
  const totalSubjects = labSeed.subjects.length;
  const totalTerms = labSeed.terms.length;
  const subjectsWithMetrics = labSeed.subjects.filter(hasMetrics).length;
  const averageMetrics = {
    HR: 0,
    TT: 0,
    WS: 0,
  };

  if (subjectsWithMetrics > 0) {
    const totals = labSeed.subjects.reduce(
      (acc, subject) => {
        const hr = getMetricValue(subject, 'HR');
        const tt = getMetricValue(subject, 'TT');
        const ws = getMetricValue(subject, 'WS');

        if (hr !== null) acc.HR += hr;
        if (tt !== null) acc.TT += tt;
        if (ws !== null) acc.WS += ws;

        return acc;
      },
      { HR: 0, TT: 0, WS: 0 }
    );

    averageMetrics.HR = totals.HR / subjectsWithMetrics;
    averageMetrics.TT = totals.TT / subjectsWithMetrics;
    averageMetrics.WS = totals.WS / subjectsWithMetrics;
  }

  return {
    totalSubjects,
    totalTerms,
    subjectsWithMetrics,
    averageMetrics,
  };
};
