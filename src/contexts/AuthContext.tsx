/**
 * AuthContext — manages user authentication state.
 *
 * Provides sign-in (Google & email/password), sign-out, account deletion,
 * re-authentication, email verification, and current user state.
 *
 * @module contexts/AuthContext
 */

import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut as firebaseSignOut,
  deleteUser as firebaseDeleteUser,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  EmailAuthProvider,
  type User,
  type UserCredential,
} from 'firebase/auth';
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

import { auth, googleAuthProvider, isFirebaseConfigured } from '../services/firebase';
import { syncOnSignIn } from '../services/syncService';
import { clearAllData } from '../utils/localStorage';

// ─── Types ───────────────────────────────────────────────────────────

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<UserCredential>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  reauthenticate: (password?: string | null) => Promise<void>;
  getAuthProvider: () => string | null;
  isFirebaseConfigured: () => boolean;
}

// ─── Context ─────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured() || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await syncOnSignIn(firebaseUser);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<void> => {
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured');
      return;
    }
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (error) {
      console.error('Google sign-in failed:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string): Promise<void> => {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase not configured');
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Email sign-in failed:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string): Promise<UserCredential> => {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase not configured');
    }
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (result.user) {
        try {
          await sendEmailVerification(result.user);
        } catch (verifyErr) {
          console.warn('Email verification send failed:', verifyErr);
        }
      }
      return result;
    } catch (error) {
      console.error('Email sign-up failed:', error);
      throw error;
    }
  };

  const resendVerificationEmail = async (): Promise<void> => {
    if (!auth.currentUser) {
      throw new Error('No user signed in');
    }
    try {
      await sendEmailVerification(auth.currentUser);
    } catch (error) {
      console.error('Resend verification failed:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    if (!isFirebaseConfigured()) {
      throw new Error('Firebase not configured');
    }
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Password reset failed:', error);
      throw error;
    }
  };

  const getAuthProvider = (): string | null => {
    if (!auth.currentUser) return null;
    const providers = auth.currentUser.providerData;
    if (!providers || providers.length === 0) return null;
    return providers[0].providerId;
  };

  const reauthenticate = async (password: string | null = null): Promise<void> => {
    if (!auth.currentUser) {
      throw new Error('No user signed in');
    }

    const providerId = getAuthProvider();

    if (providerId === 'google.com') {
      await reauthenticateWithPopup(auth.currentUser, googleAuthProvider);
    } else if (providerId === 'password') {
      if (!password) {
        throw new Error('Password required for re-authentication');
      }
      const credential = EmailAuthProvider.credential(auth.currentUser.email!, password);
      await reauthenticateWithCredential(auth.currentUser, credential);
    } else {
      throw new Error('Unsupported auth provider');
    }
  };

  const signOut = async (): Promise<void> => {
    if (!isFirebaseConfigured()) return;
    try {
      await firebaseSignOut(auth);
      clearAllData();
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  };

  const deleteAccount = async (): Promise<void> => {
    if (!isFirebaseConfigured() || !auth.currentUser) return;
    try {
      await firebaseDeleteUser(auth.currentUser);
    } catch (error) {
      console.error('Account deletion failed:', error);
      throw error;
    }
  };

  const value: AuthContextValue = {
    user,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    resendVerificationEmail,
    signOut,
    deleteAccount,
    reauthenticate,
    getAuthProvider,
    isFirebaseConfigured,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
