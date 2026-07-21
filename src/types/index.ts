export interface UserProfile {
  id: number;
  username: string;
  email: string;
  role: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ActivityLog {
  id: number;
  userId: number | null;
  username: string;
  action: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

export type AdminTab = "users" | "logs" | "matrix";
export type UserTab = "host" | "matrix";

export interface LoginFormState {
  username: string;
  password: string;
}

export interface RegisterFormState {
  username: string;
  email: string;
  password: string;
  role: string;
}

export interface NewUserFormState {
  username: string;
  email: string;
  password: string;
  role: string;
  status: string;
}

export interface EditUserFormState {
  username: string;
  email: string;
  role: string;
  status: string;
}
