export type User = {
  id: string;
  name: string;
};

export type AuthContextType = {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
};
