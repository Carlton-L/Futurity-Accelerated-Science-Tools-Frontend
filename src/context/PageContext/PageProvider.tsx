// src/contexts/PageContext/PageProvider.tsx

import React, { useState } from 'react';
import type { ReactNode } from 'react';
import PageContext from './PageContext';
import type { PageContextData, PageContextType } from './pageTypes';

interface PageProviderProps {
  children: ReactNode;
}

const defaultPageContext: PageContextData = {
  pageType: 'unknown',
  // Need to change this back to "Unknown Page"
  pageTitle: 'Home Page',
};

export const PageProvider: React.FC<PageProviderProps> = ({ children }) => {
  const [pageContext, setPageContext] =
    useState<PageContextData>(defaultPageContext);

  const updatePageContext = (newContext: Partial<PageContextData>) => {
    setPageContext((prev) => ({ ...prev, ...newContext }));
  };

  const getContextMessage = (): string => {
    // For snapshot pages, prioritize snapshot title
    if (pageContext.pageType === 'snapshot' && pageContext.snapshotTitle) {
      return pageContext.snapshotTitle;
    }

    // For other pages, use page title
    return pageContext.pageTitle;
  };

  const value: PageContextType = {
    pageContext,
    updatePageContext,
    getContextMessage,
  };

  return <PageContext.Provider value={value}>{children}</PageContext.Provider>;
};
