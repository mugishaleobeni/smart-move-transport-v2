import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, signInWithGoogle as firebaseSignInWithGoogle } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import api from '@/lib/api';

interface User {
  uid: string;
  email: string | null;
  name: string | null;
  phone?: string | null;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  loginManual: (credentials: any) => Promise<void>;
  registerManual: (data: any) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in via Flask session
    const checkSession = async () => {
      try {
        const response = await api.get('/auth/me');
        if (response.data.authenticated) {
          // You might want to store user details in session or fetch them here
          setUser({
            uid: response.data.uid,
            email: response.data.email,
            name: response.data.name,
            phone: response.data.phone,
            role: response.data.role
          });
          setIsAdmin(response.data.role === 'admin');
        }
      } catch (error) {
        console.log('No active session');
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // We handle the login via the manual call to signInWithGoogle
        // But if the user refreshes, we might need to re-verify or rely on Flask session
      } else {
        // If Firebase says logged out, we should probably clear local state
        // but Flask session might still be active. Usually they are synced.
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const { idToken } = await firebaseSignInWithGoogle();

      // Verify token with backend
      const response = await api.post('/auth/login', { idToken });

      if (response.data.user) {
        const userData = response.data.user;
        setUser(userData);
        setIsAdmin(userData.role === 'admin');
      }
    } catch (error: any) {
      console.error('Sign in failed:', error);
      if (error.response) {
        console.error('Backend Error Response:', error.response.data);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginManual = async (credentials: any) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login/manual', credentials);
      if (response.data.user) {
        const userData = response.data.user;
        setUser(userData);
        setIsAdmin(userData.role === 'admin');
      }
    } catch (error) {
      console.error('Manual login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const registerManual = async (data: any) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/register/manual', data);
      return response.data;
    } catch (error) {
      console.error('Manual registration failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      try {
        await auth.signOut();
      } catch (e) {
        console.log('Firebase signOut failed or not logged in via Firebase');
      }
      await api.post('/auth/logout');
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('Sign out failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signInWithGoogle, loginManual, registerManual, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
