// src/contexts/PageContext/usePage.ts
import { useContext } from 'react';
import PageContext from './PageContext';
import type { PageContextType } from './pageTypes';

export const usePage = (): PageContextType => {
  const context = useContext(PageContext);
  if (!context) {
    throw new Error('usePage must be used within a PageProvider');
  }
  console.log('🔍 usePage - returning context:', context);
  return context;
};

// Hook for easy context access in chat components
export const useChatContext = () => {
  const { pageContext, getContextForChat } = usePage();
  console.log('🔍 useChatContext - pageContext:', pageContext);

  const contextString = getContextForChat();
  console.log('🔍 useChatContext - contextString:', contextString);

  return {
    pageContext,
    contextString,
  };
};
