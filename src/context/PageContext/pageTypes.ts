// Note: User interface is imported from AuthContext
// import type { User } from '../AuthContext/authTypes';

export interface Team {
  id: string;
  name: string;
}

export interface Subject {
  id: string;
  name: string;
  title?: string;
}

export interface Organization {
  id: string;
  name: string;
  title?: string;
}

export interface Analysis {
  id: string;
  title: string;
  name?: string;
}

export interface Term {
  id: string;
  name: string;
  text?: string;
}

export interface Draft {
  id: string;
  name: string;
  subjects: Subject[];
  terms: Term[];
}

export interface Lab {
  id: string;
  name: string;
  title?: string;
}

export interface IdeaSeed {
  id: string;
  name: string;
  title?: string;
  labId: string;
  labName?: string;
}

// Page-specific context types

// Base page context interface
export interface BasePageContext {
  pageType: string;
  pageTitle: string;
}

export interface SearchPageContext {
  pageType: 'search';
  pageTitle: string;
  searchQuery: string;
  exactMatch?: {
    type: 'subject';
    subject: Subject;
  };
  relatedSubjects: Subject[];
  organizations: Organization[];
  analyses: Analysis[];
}

export interface WhiteboardPageContext extends BasePageContext {
  pageType: 'whiteboard';
  whiteboard?: {
    id: string;
    name: string;
  };
}

export interface SubjectPageContext {
  pageType: 'subject';
  pageTitle: string;
  subject: Subject;
}

export interface OrganizationPageContext {
  pageType: 'organization';
  pageTitle: string;
  organization: Organization;
}

// Lab tab types - updated to include 'plan' as the first tab
export type LabTab = 'plan' | 'gather' | 'analyze' | 'forecast' | 'invent';

export interface LabPageContext extends BasePageContext {
  pageType: 'lab';
  lab: {
    id: string;
    name: string;
    title: string;
  };
  currentTab: LabTab;
}

export interface CreateLabPageContext {
  pageType: 'create-lab';
  pageTitle: string;
}

export interface LabAdminPageContext {
  pageType: 'lab-admin';
  pageTitle: string;
  lab: Lab;
}

export interface OrgAdminPageContext {
  pageType: 'org-admin';
  pageTitle: string;
}

export interface TutorialsPageContext {
  pageType: 'tutorials';
  pageTitle: string;
}

export interface TeamHomePageContext {
  pageType: 'team-home';
  pageTitle: string;
  team: Team;
}

export interface TeamCreationPageContext {
  pageType: 'team-creation';
  pageTitle: string;
}

export interface TeamAdminPageContext {
  pageType: 'team-admin';
  pageTitle: string;
  team: Team;
}

export interface UserProfilePageContext {
  pageType: 'user-profile';
  pageTitle: string;
  userId?: string; // If viewing someone else's profile
}

export interface UserSettingsPageContext {
  pageType: 'user-settings';
  pageTitle: string;
}

export interface IdeaSeedPageContext {
  pageType: 'idea-seed';
  pageTitle: string;
  ideaSeed: IdeaSeed;
}

export interface UnknownPageContext {
  pageType: 'unknown';
  pageTitle: string;
}

export type PageContextData =
  | SearchPageContext
  | WhiteboardPageContext
  | SubjectPageContext
  | OrganizationPageContext
  | LabPageContext
  | CreateLabPageContext
  | LabAdminPageContext
  | OrgAdminPageContext
  | TutorialsPageContext
  | TeamHomePageContext
  | TeamCreationPageContext
  | TeamAdminPageContext
  | UserProfilePageContext
  | UserSettingsPageContext
  | IdeaSeedPageContext
  | UnknownPageContext;

export interface PageContextType {
  // Page context
  pageContext: PageContextData;

  // Actions
  updatePageContext: (
    context: Partial<PageContextData> | PageContextData
  ) => void;
  setPageContext: (context: PageContextData) => void;
  clearPageContext: () => void;

  // Helper methods
  getContextMessage: () => string;
  getContextForChat: () => string;
}

// Navigation breadcrumb interface
export interface BreadcrumbItem {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

// Extended page context with navigation
export interface ExtendedPageContext extends PageContextData {
  breadcrumbs?: BreadcrumbItem[];
  showBackButton?: boolean;
  backButtonUrl?: string;
  actions?: React.ReactNode;
}

// Page layout configuration
export interface PageLayoutConfig {
  showSidebar?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
  containerMaxWidth?: string;
  backgroundColor?: string;
  padding?: string | number;
}

// Page metadata for SEO and analytics
export interface PageMetadata {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
  robots?: string;
  structuredData?: Record<string, any>;
}

// Complete page context with all optional extensions
export interface FullPageContext extends ExtendedPageContext {
  layout?: PageLayoutConfig;
  metadata?: PageMetadata;
  isLoading?: boolean;
  error?: string | null;
  lastUpdated?: Date;
}

// Page context action types for reducer
export type PageContextAction =
  | { type: 'SET_CONTEXT'; payload: PageContextData }
  | { type: 'CLEAR_CONTEXT' }
  | { type: 'UPDATE_CONTEXT'; payload: Partial<PageContextData> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_BREADCRUMBS'; payload: BreadcrumbItem[] }
  | { type: 'SET_LAYOUT'; payload: PageLayoutConfig }
  | { type: 'SET_METADATA'; payload: PageMetadata };

// Context provider props
export interface PageContextProviderProps {
  children: React.ReactNode;
  initialContext?: PageContextData;
}

// Hook return type
export interface UsePageContextReturn {
  context: FullPageContext | null;
  setPageContext: (context: PageContextData) => void;
  clearPageContext: () => void;
  updatePageContext: (updates: Partial<PageContextData>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateBreadcrumbs: (breadcrumbs: BreadcrumbItem[]) => void;
  setLayout: (layout: PageLayoutConfig) => void;
  setMetadata: (metadata: PageMetadata) => void;
  isCurrentPage: (pageType: string) => boolean;
  isCurrentLab: (labId: string) => boolean;
  isCurrentTab: (tab: LabTab) => boolean;
}
