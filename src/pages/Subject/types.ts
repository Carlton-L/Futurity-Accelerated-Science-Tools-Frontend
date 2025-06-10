export interface SubjectData {
  id: string;
  name: string;
  description: string;
  horizonRanking: number;
  whiteSpace: number;
  techTransfer: number;
  stats: {
    organizations: number;
    press: number;
    patents: number;
    papers: number;
    books: number;
    relatedDocs: number;
  };
}

export interface UserWhiteboard {
  subjects: string[];
}

export interface SubjectQueryResult {
  subject: SubjectData;
}

export interface WhiteboardQueryResult {
  userWhiteboard: UserWhiteboard;
}

export interface AddToWhiteboardResult {
  addSubjectToWhiteboard: {
    success: boolean;
    message: string;
  };
}

export interface AddToLabResult {
  addSubjectToLab: {
    success: boolean;
    message: string;
  };
}
