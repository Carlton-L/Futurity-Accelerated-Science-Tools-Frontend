export interface Lab {
  id: string;
  name: string;
  description: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  ownerId: string;
  adminIds: string[];
  memberIds: string[];
  subjects: LabSubject[];
  analyses: LabAnalysis[];
}

export interface LabSubject {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectSlug: string;
  addedAt: string; // ISO date string
  addedById: string;
  notes?: string;
}

export interface LabAnalysis {
  id: string;
  title: string;
  description: string;
  status: 'Draft' | 'In Progress' | 'Review' | 'Complete' | 'Archived';
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  createdById: string;
  assignedToIds: string[];
  subjects: string[]; // Subject IDs related to this analysis
  tags: string[];
}

export interface LabMember {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: 'Owner' | 'Admin' | 'Member' | 'Viewer';
  joinedAt: string; // ISO date string
  invitedById?: string;
}

export interface LabSettings {
  visibility: 'Private' | 'Internal' | 'Public';
  allowMemberInvites: boolean;
  allowSubjectAddition: boolean;
  allowAnalysisCreation: boolean;
  defaultAnalysisStatus: LabAnalysis['status'];
  notifications: {
    newMembers: boolean;
    newSubjects: boolean;
    newAnalyses: boolean;
    analysisUpdates: boolean;
  };
}

export interface LabUpdateRequest {
  name: string;
  description: string;
}

export interface LabCreateRequest {
  name: string;
  description: string;
  visibility: LabSettings['visibility'];
}

export interface LabInviteRequest {
  email: string;
  role: LabMember['role'];
  message?: string;
}

export interface LabQueryResult {
  lab: Lab;
}

export interface LabsQueryResult {
  labs: Lab[];
  total: number;
}

export interface LabMembersQueryResult {
  labMembers: LabMember[];
  total: number;
}

export interface LabSettingsQueryResult {
  labSettings: LabSettings;
}

export interface UpdateLabResult {
  updateLab: {
    success: boolean;
    message: string;
    lab?: Lab;
  };
}

export interface CreateLabResult {
  createLab: {
    success: boolean;
    message: string;
    lab?: Lab;
  };
}

export interface InviteToLabResult {
  inviteToLab: {
    success: boolean;
    message: string;
  };
}

export interface AddSubjectToLabResult {
  addSubjectToLab: {
    success: boolean;
    message: string;
    labSubject?: LabSubject;
  };
}

export interface CreateAnalysisResult {
  createAnalysis: {
    success: boolean;
    message: string;
    analysis?: LabAnalysis;
  };
}
