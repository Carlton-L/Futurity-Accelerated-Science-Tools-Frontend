export interface PageContextData {
  pageType: string;
  pageTitle: string;
  snapshotId?: string;
  snapshotTitle?: string;
  additionalInfo?: Record<string, string | number | boolean>;
}

export interface PageContextType {
  pageContext: PageContextData;
  updatePageContext: (context: Partial<PageContextData>) => void;
  getContextMessage: () => string;
}
