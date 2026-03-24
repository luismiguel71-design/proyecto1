'use client';
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { app } from './client';

const auth = getAuth(app);

export const signInUser = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signOutUser = () => {
  return signOut(auth);
};

export const getCurrentUser = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
