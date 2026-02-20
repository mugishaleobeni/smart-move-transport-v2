import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any; isAdmin?: boolean }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mock admin credentials
  const MOCK_ADMIN = {
    email: 'leo@gmail.com',
    password: '123456',
    id: 'mock-admin-id'
  };

  const checkAdmin = async (userId: string, email?: string): Promise<boolean> => {
    // Check for mock admin email
    if (email === MOCK_ADMIN.email || userId === MOCK_ADMIN.id) {
      setIsAdmin(true);
      return true;
    }

    try {
      const { data } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: 'admin',
      });
      const admin = !!data;
      setIsAdmin(admin);
      return admin;
    } catch {
      setIsAdmin(false);
      return false;
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Listener for ongoing auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) return;

        // If we have a mock admin, don't let Supabase state change clear it
        const isMockAdmin = !!localStorage.getItem('mock_admin_user');
        if (isMockAdmin && !session) return;

        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => checkAdmin(session.user.id, session.user.email), 0);
        } else {
          setIsAdmin(false);
        }
      }
    );

    // Initial load - wait for admin check before setting loading false
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        // Check for persisted mock admin
        const persistedMockAdmin = localStorage.getItem('mock_admin_user');
        if (persistedMockAdmin) {
          const mockUser = JSON.parse(persistedMockAdmin);
          setUser(mockUser);
          setIsAdmin(true);
        } else if (session?.user) {
          setSession(session);
          setUser(session?.user ?? null);
          await checkAdmin(session.user.id, session.user.email);
        }
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    // Handle mock login
    if (email === MOCK_ADMIN.email && password === MOCK_ADMIN.password) {
      const mockUser = {
        id: MOCK_ADMIN.id,
        email: MOCK_ADMIN.email,
        aud: 'authenticated',
        role: 'authenticated',
        app_metadata: {},
        user_metadata: { full_name: 'Leo Admin' },
        created_at: new Date().toISOString(),
      } as User;

      setUser(mockUser);
      setIsAdmin(true);
      setLoading(false);
      localStorage.setItem('mock_admin_user', JSON.stringify(mockUser));
      return { error: null, isAdmin: true };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    let adminStatus = false;
    if (!error && data.session?.user) {
      adminStatus = await checkAdmin(data.session.user.id, data.session.user.email);
    }
    return { error, isAdmin: adminStatus };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
    localStorage.removeItem('mock_admin_user');
  };

  return (
    <AuthContext.Provider value={{ user, session, isAdmin, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
