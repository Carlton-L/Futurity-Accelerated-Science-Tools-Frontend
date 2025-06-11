export interface RelatedDocument {
  id: string;
  filename: string;
  type: 'PDF' | 'Image' | 'Document';
  fileExtension: string;
  size: string; // e.g., "2.4 MB"
  uploadDate: string; // ISO date string
  downloadUrl: string;
}

export interface RelatedDocumentsProps {
  documents?: RelatedDocument[];
  height?: string;
}
