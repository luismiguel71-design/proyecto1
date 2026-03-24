'use client';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from './client';

export const signInUser = (email: string, password: string) => {
  if (!auth) {
    return Promise.reject(new Error("Firebase Auth is not configured."));
  }
  return signInWithEmailAndPassword(auth, email, password);
};

export const signOutUser = () => {
  if (!auth) {
    return Promise.reject(new Error("Firebase Auth is not configured."));
  }
  return signOut(auth);
};

export const getCurrentUser = (callback: (user: User | null) => void) => {
  if (!auth) {
    callback(null);
    return () => {}; // return empty unsubscribe function
  }
  return onAuthStateChanged(auth, callback);
};
