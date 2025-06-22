// src/contexts/PageContext/PageProvider.tsx
import React, { useState } from 'react';
import type { ReactNode } from 'react';
import PageContext from './PageContext';
import type {
  PageContextData,
  PageContextType,
  SearchPageContext,
  SubjectPageContext,
  OrganizationPageContext,
  LabPageContext,
  WhiteboardPageContext,
  TeamHomePageContext,
  TeamAdminPageContext,
  LabAdminPageContext,
  IdeaSeedPageContext,
  UserProfilePageContext,
  Subject,
  Organization,
  Analysis,
} from './pageTypes';
import { useAuth } from '../AuthContext';

interface PageProviderProps {
  children: ReactNode;
}

const defaultPageContext: PageContextData = {
  pageType: 'unknown',
  pageTitle: 'Unknown Page',
};

export const PageProvider: React.FC<PageProviderProps> = ({ children }) => {
  const [pageContext, setPageContextState] =
    useState<PageContextData>(defaultPageContext);
  const { user } = useAuth();

  const setPageContext = (context: PageContextData) => {
    setPageContextState(context);
  };

  const updatePageContext = (newContext: Partial<PageContextData>) => {
    setPageContextState(
      (prev) => ({ ...prev, ...newContext } as PageContextData)
    );
  };

  const clearPageContext = () => {
    setPageContextState(defaultPageContext);
  };

  const getContextMessage = (): string => {
    return pageContext.pageTitle;
  };

  const getContextForChat = (): string => {
    let contextString = '';

    // Global context
    if (user) {
      contextString += `User: ${user.username} (ID: ${user._id})\n`;
    }

    // Page-specific context
    contextString += `\nCurrent Page: ${pageContext.pageType}\n`;
    contextString += `Page Title: ${pageContext.pageTitle}\n`;

    if (pageContext.pageType === 'search') {
      const searchContext = pageContext as SearchPageContext;
      contextString += `Search Query: "${searchContext.searchQuery}"\n`;
      if (searchContext.exactMatch) {
        contextString += `Exact Match: ${searchContext.exactMatch.subject.name} (Subject ID: ${searchContext.exactMatch.subject.id})\n`;
      }
      if (searchContext.relatedSubjects?.length > 0) {
        contextString += `Related Subjects: ${searchContext.relatedSubjects
          .map((s: Subject) => `${s.name} (${s.id})`)
          .join(', ')}\n`;
      }
      if (searchContext.organizations?.length > 0) {
        contextString += `Organizations: ${searchContext.organizations
          .map((o: Organization) => `${o.name} (${o.id})`)
          .join(', ')}\n`;
      }
      if (searchContext.analyses?.length > 0) {
        contextString += `Analyses: ${searchContext.analyses
          .map((a: Analysis) => `${a.title} (${a.id})`)
          .join(', ')}\n`;
      }
    } else if (pageContext.pageType === 'subject') {
      const subjectContext = pageContext as SubjectPageContext;
      contextString += `Subject: ${subjectContext.subject.name} (ID: ${subjectContext.subject.id})\n`;
    } else if (pageContext.pageType === 'organization') {
      const orgContext = pageContext as OrganizationPageContext;
      contextString += `Organization: ${orgContext.organization.name} (ID: ${orgContext.organization.id})\n`;
    } else if (pageContext.pageType === 'lab') {
      const labContext = pageContext as LabPageContext;
      contextString += `Lab: ${labContext.lab.name} (ID: ${labContext.lab.id})\n`;
      contextString += `Current Tab: ${labContext.currentTab}\n`;
    } else if (pageContext.pageType === 'whiteboard') {
      const whiteboardContext = pageContext as WhiteboardPageContext;
      if (whiteboardContext.drafts.length > 0) {
        contextString += `Drafts: ${whiteboardContext.drafts.length}\n`;
        whiteboardContext.drafts.forEach((draft) => {
          contextString += `  - ${draft.name}: ${draft.subjects.length} subjects, ${draft.terms.length} terms\n`;
        });
      } else {
        contextString += `No drafts currently\n`;
      }
    } else if (pageContext.pageType === 'team-home') {
      const teamContext = pageContext as TeamHomePageContext;
      contextString += `Team: ${teamContext.team.name} (ID: ${teamContext.team.id})\n`;
    } else if (pageContext.pageType === 'team-admin') {
      const teamAdminContext = pageContext as TeamAdminPageContext;
      contextString += `Team: ${teamAdminContext.team.name} (ID: ${teamAdminContext.team.id})\n`;
    } else if (pageContext.pageType === 'lab-admin') {
      const labAdminContext = pageContext as LabAdminPageContext;
      contextString += `Lab: ${labAdminContext.lab.name} (ID: ${labAdminContext.lab.id})\n`;
    } else if (pageContext.pageType === 'idea-seed') {
      const ideaSeedContext = pageContext as IdeaSeedPageContext;
      contextString += `IdeaSeed: ${ideaSeedContext.ideaSeed.name} (ID: ${ideaSeedContext.ideaSeed.id})\n`;
      contextString += `Associated Lab: ${
        ideaSeedContext.ideaSeed.labName || 'Unknown'
      } (ID: ${ideaSeedContext.ideaSeed.labId})\n`;
    } else if (pageContext.pageType === 'user-profile') {
      const userProfileContext = pageContext as UserProfilePageContext;
      if (userProfileContext.userId) {
        contextString += `Viewing User Profile: ${userProfileContext.userId}\n`;
      } else {
        contextString += `Viewing Own Profile\n`;
      }
    }

    return contextString.trim();
  };

  const value: PageContextType = {
    pageContext,
    updatePageContext,
    setPageContext,
    clearPageContext,
    getContextMessage,
    getContextForChat,
  };

  return <PageContext.Provider value={value}>{children}</PageContext.Provider>;
};
