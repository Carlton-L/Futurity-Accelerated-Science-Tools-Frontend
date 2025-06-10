import type { ReactNode } from 'react';

export interface CardScrollerProps {
  children: ReactNode;
  height?: string;
  gap?: number;
  padding?: number;
  buttonWidth?: number;
  emptyMessage?: string;
}
