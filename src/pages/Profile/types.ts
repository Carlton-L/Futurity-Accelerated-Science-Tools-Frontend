export interface EditingState {
  fullname: boolean;
  biography: boolean;
  email: boolean;
  password: boolean;
}

export interface FormData {
  fullname: string;
  biography: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ShowPasswordState {
  current: boolean;
  new: boolean;
  confirm: boolean;
}

export interface ValidationErrors {
  [key: string]: string | undefined;
  fullname?: string;
  biography?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export interface ProfileUpdateRequest {
  email: string;
  fullname: string;
  biography: string;
  picture_url: string;
  thumb_url: string;
  email_validated: boolean;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export interface EditableFieldProps {
  field: keyof FormData;
  label: string;
  value: string;
  placeholder: string;
  type?: string;
  isTextarea?: boolean;
  helper?: string | null;
}

export interface PasswordFieldProps {
  field: keyof ShowPasswordState;
  label: string;
  placeholder: string;
}

export interface ProfileCardProps {
  title: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  children: React.ReactNode;
  bg?: string;
}
