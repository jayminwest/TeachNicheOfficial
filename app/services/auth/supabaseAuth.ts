import firebaseAuthService from './firebase-auth-service';

export const signInWithEmail = async (email: string, password: string) => {
  const { user, error } = await firebaseAuthService.signInWithEmail(email, password);
  if (error) throw error;
  return { user };
}

export const signOut = async () => {
  const { error } = await firebaseAuthService.signOut();
  if (error) throw error;
}

export const getCurrentUser = async () => {
  return await firebaseAuthService.getCurrentUser();
}

export const signInWithGoogle = async () => {
  try {
    const { user, token, error } = await firebaseAuthService.signInWithGoogle();
    return { 
      data: { 
        user, 
        session: token ? { access_token: token } : null 
      }, 
      error 
    };
  } catch (err) {
    return { data: null, error: err as Error };
  }
}

export const signUp = async (email: string, password: string, name = '') => {
  console.log('Attempting signup with email:', email);
  const { user, error } = await firebaseAuthService.signUp(email, password, name);
  
  if (error) {
    console.error('Signup error:', error);
    throw error;
  }
  
  console.log('Signup response:', user);
  return { user };
}
