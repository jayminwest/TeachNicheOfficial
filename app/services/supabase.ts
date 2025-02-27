import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { app } from '@/app/lib/firebase';

const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

const firebaseClient = {
  auth: {
    getSession: async () => {
      const user = auth.currentUser;
      return { 
        data: { 
          session: user ? { 
            user: {
              id: user.uid,
              email: user.email,
              user_metadata: {
                full_name: user.displayName || '',
                avatar_url: user.photoURL || ''
              },
              app_metadata: {
                provider: 'firebase',
                providers: ['firebase']
              }
            } 
          } : null 
        }, 
        error: null 
      };
    }
  },
};

export const supabase = firebaseClient;
export default firebaseClient;
