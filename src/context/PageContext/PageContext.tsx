import { createContext } from 'react';
import type { PageContextType } from './pageTypes';

const PageContext = createContext<PageContextType | undefined>(undefined);

export default PageContext;
