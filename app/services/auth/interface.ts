export interface AuthUser {
  id: string;
  email: string | null;
  name?: string | null;
  avatarUrl?: string | null;
  metadata?: Record<string, unknown>;
}

export interface AuthService {
  signIn(email: string, password: string): Promise<AuthUser>;
  signUp(email: string, password: string, name: string): Promise<AuthUser>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<AuthUser | null>;
  // Add other auth methods as needed
}
