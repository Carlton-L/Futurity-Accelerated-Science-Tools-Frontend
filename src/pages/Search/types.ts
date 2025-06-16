// Search Page Types
// TODO: Move to shared types file when project grows

export interface SubjectIndices {
  horizon: number; // 0-1 scale
  techTransfer: number; // 0-100 scale
  whiteSpace: number; // 0-100 scale
}

export interface SubjectStats {
  books: number;
  papers: number;
  patents: number;
  press: number;
  organizations: number;
}

export interface ExactMatchSubject {
  id: string;
  title: string;
  description: string;
  slug: string; // URL-friendly identifier for routing
  indices: SubjectIndices;
  stats: SubjectStats;
}

export interface RelatedSubject {
  id: string;
  title: string;
  summary: string;
  slug: string; // URL-friendly identifier for routing
  horizonRanking?: number; // Optional horizon ranking for display
}

export interface RelatedAnalysis {
  id: string;
  labId: string;
  title: string;
  summary: string;
  status: 'Ready' | 'Coming soon...';
  imageUrl?: string;
  createdAt: string; // ISO date string
}

export interface RelatedOrganization {
  id: string;
  title: string;
  summary: string;
  slug: string; // URL-friendly identifier for routing
  sector?: string;
  industry?: string;
  country?: string;
}

export interface SearchData {
  query: string;
  exactMatch: ExactMatchSubject | null;
  relatedSubjects: RelatedSubject[];
  relatedAnalyses: RelatedAnalysis[];
  relatedOrganizations: RelatedOrganization[];
  totalResults: {
    subjects: number;
    analyses: number;
    organizations: number;
  };
}

export interface SearchProps {
  initialQuery?: string;
  initialData?: SearchData;
  onSubjectCreate?: (query: string) => void;
  onSubjectClick?: (subject: ExactMatchSubject | RelatedSubject) => void;
  onAnalysisClick?: (analysis: RelatedAnalysis) => void;
  onOrganizationClick?: (organization: RelatedOrganization) => void;
  onViewAllResults?: (query: string) => void;
}

// API Request/Response Types
export interface CreateSubjectRequest {
  name: string;
  description?: string;
  initialNotes?: string;
}

export interface CreateSubjectResponse {
  id: string;
  slug: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface SearchAPIParams {
  query: string;
  limit?: number;
  offset?: number;
  includeExactMatch?: boolean;
  includeRelated?: boolean;
}

export interface SearchAPIResponse {
  query: string;
  exactMatch: ExactMatchSubject | null;
  relatedSubjects: {
    items: RelatedSubject[];
    total: number;
    hasMore: boolean;
  };
  relatedAnalyses: {
    items: RelatedAnalysis[];
    total: number;
    hasMore: boolean;
  };
  relatedOrganizations: {
    items: RelatedOrganization[];
    total: number;
    hasMore: boolean;
  };
  searchTime: number; // milliseconds
}

// Utility type for generic search results
export type SearchResultItem =
  | RelatedSubject
  | RelatedAnalysis
  | RelatedOrganization;

export type SearchResultType = 'subject' | 'analysis' | 'organization';

// State management types
export interface SearchState {
  query: string;
  isLoading: boolean;
  isCreatingSubject: boolean;
  hasExactMatch: boolean;
  data: SearchData | null;
  error: string | null;
}

export type SearchAction =
  | { type: 'SET_QUERY'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_CREATING_SUBJECT'; payload: boolean }
  | { type: 'SET_DATA'; payload: SearchData }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'TOGGLE_EXACT_MATCH' }
  | { type: 'RESET' };

// Hook return types
export interface UseSearch {
  state: SearchState;
  actions: {
    setQuery: (query: string) => void;
    search: (query: string) => Promise<void>;
    createSubject: (name: string) => Promise<CreateSubjectResponse>;
    toggleExactMatch: () => void;
    reset: () => void;
  };
}
