import { useContext } from 'react';
import PageContext from './PageContext';
import type { PageContextType } from './pageTypes';

export const usePage = (): PageContextType => {
  const context = useContext(PageContext);
  if (!context) {
    throw new Error('usePage must be used within a PageProvider');
  }
  return context;
};
