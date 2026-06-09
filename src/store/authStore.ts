import { create } from 'zustand';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthState {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  init: () => () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAdmin: false,
  loading: true,

  signInWithGoogle: async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  },

  signOut: async () => {
    await fbSignOut(auth);
  },

  init: () =>
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const profileSnap = await getDoc(doc(db, 'users', user.uid, 'settings', 'profile'));
          const isAdmin = profileSnap.exists() && profileSnap.data()?.role === 'admin';
          set({ user, isAdmin, loading: false });
        } catch {
          set({ user, isAdmin: false, loading: false });
        }
      } else {
        set({ user: null, isAdmin: false, loading: false });
      }
    }),
}));
