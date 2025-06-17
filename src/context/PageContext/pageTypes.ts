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

export type LabTab = 'dashboard' | 'gather' | 'analyze' | 'forecast' | 'invent';

// Page-specific context types
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

export interface WhiteboardPageContext {
  pageType: 'whiteboard';
  pageTitle: string;
  drafts: Draft[];
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

export interface LabPageContext {
  pageType: 'lab';
  pageTitle: string;
  lab: Lab;
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
