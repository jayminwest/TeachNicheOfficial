import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '@/app/lib/firebase';

export interface AuthUser {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  metadata?: Record<string, any>;
}

function transformUser(firebaseUser: FirebaseUser): AuthUser {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email,
    name: firebaseUser.displayName,
    avatarUrl: firebaseUser.photoURL,
    metadata: {
      provider: firebaseUser.providerData[0]?.providerId || 'firebase',
      emailVerified: firebaseUser.emailVerified,
      createdAt: firebaseUser.metadata.creationTime,
      lastSignInTime: firebaseUser.metadata.lastSignInTime
    }
  };
}

export async function signInWithEmail(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: transformUser(userCredential.user), error: null };
  } catch (error) {
    return { user: null, error };
  }
}

export async function signUpWithEmail(email: string, password: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { user: transformUser(userCredential.user), error: null };
  } catch (error) {
    return { user: null, error };
  }
}

export async function signUp(email: string, password: string, name: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    return { user: transformUser(userCredential.user), error: null };
  } catch (error) {
    return { user: null, error };
  }
}

export async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(userCredential);
    const token = credential?.accessToken;
    return { 
      user: transformUser(userCredential.user), 
      token,
      error: null 
    };
  } catch (error: any) {
    return { user: null, token: null, error };
  }
}

export async function signOut() {
  try {
    await firebaseSignOut(auth);
    return { error: null };
  } catch (error) {
    return { error };
  }
}

export async function getCurrentUser() {
  return new Promise<AuthUser | null>((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();
      resolve(user ? transformUser(user) : null);
    });
  });
}

const firebaseAuthService = {
  signInWithEmail,
  signUp,
  signInWithGoogle,
  signOut,
  getCurrentUser
};

export default firebaseAuthService;
