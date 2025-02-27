import { supabase } from '@/app/lib/supabase';
import { AuthService, AuthUser } from './interface';

export class SupabaseAuth implements AuthService {
  async signIn(email: string, password: string): Promise<AuthUser> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    return this.transformUser(data.user);
  }
  
  async signUp(email: string, password: string, name: string): Promise<AuthUser> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name
        }
      }
    });
    
    if (error) throw error;
    
    return this.transformUser(data.user);
  }
  
  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
  
  async getCurrentUser(): Promise<AuthUser | null> {
    const { data } = await supabase.auth.getUser();
    return data.user ? this.transformUser(data.user) : null;
  }
  
  private transformUser(user: any): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name,
      avatarUrl: user.user_metadata?.avatar_url
    };
  }
}
