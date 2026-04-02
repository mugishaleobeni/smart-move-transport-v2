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
  updateProfile: (data: any) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Try to restore session from storage for instant UI (Revalidated below)
    const storedUser = localStorage.getItem('smartmove_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setIsAdmin(parsed.role === 'admin');
        setLoading(false); // Quick show, then revalidate
      } catch (e) {
        localStorage.removeItem('smartmove_user');
      }
    }

    // 2. Revalidate Flask Session
    const checkSession = async () => {
      try {
        const response = await api.get('/auth/me');
        if (response.data.authenticated) {
          const userData = {
            uid: response.data.uid,
            email: response.data.email,
            name: response.data.name,
            phone: response.data.phone,
            role: response.data.role
          };
          setUser(userData);
          setIsAdmin(userData.role === 'admin');
          localStorage.setItem('smartmove_user', JSON.stringify(userData));
        } else {
          setUser(null);
          setIsAdmin(false);
          localStorage.removeItem('smartmove_user');
        }
      } catch (error) {
        console.log('Session revalidation failed');
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // 3. Listen for Firebase Auth changes (if used)
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser && !storedUser) {
        // Only force logout if we have NO flask session and NO firebase user
        // but we prioritize Flask session for Admin.
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
        console.log('Firebase signOut failed');
      }
      await api.post('/auth/logout');
      setUser(null);
      setIsAdmin(false);
      localStorage.removeItem('smartmove_user');
    } catch (error) {
      console.error('Sign out failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: any) => {
    setLoading(true);
    try {
      const response = await api.put('/auth/update-profile', data);
      if (response.data.message) {
        // Refresh local user data
        const meResponse = await api.get('/auth/me');
        if (meResponse.data.authenticated) {
          setUser({
            uid: meResponse.data.uid,
            email: meResponse.data.email,
            name: meResponse.data.name,
            phone: meResponse.data.phone,
            role: meResponse.data.role
          });
        }
      }
      return response.data;
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signInWithGoogle, loginManual, registerManual, updateProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
