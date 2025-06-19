export type User = {
  _id: string;
  username: string;
  email: string;
  fullname: string;
  role: string;
  status: number;
  debug_mode: number;
  research_team: number;
  email_validated: number;
  auth_key: string;
  created_at: number;
  updated_at: number;
  guid: string;
  biography?: string;
  picture_url?: string;
  thumb_url?: string;
  team_id?: string;
  changing_email?: string | null;
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  errors: string[];
};

export type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
};
