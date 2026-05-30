import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { signIn, signUp, signOut, getProfile } from '../services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = profile?.role === 'admin';

  // Fetch profile whenever the auth user changes
  const loadProfile = async (authUser) => {
    if (!authUser) { setProfile(null); return; }
    try {
      const p = await getProfile(authUser.id);
      setProfile(p);
    } catch (err) {
      // Ignore abort errors from React Strict Mode double-mount
      if (!err?.message?.includes('AbortError')) console.error(err);
    }
  };

  useEffect(() => {
    // Check existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      loadProfile(u).finally(() => setLoading(false));
    }).catch(() => setLoading(false));

    // Subscribe to auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const u = session?.user ?? null;
        setUser(u);
        await loadProfile(u);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async (email, password) => {
    const data = await signIn(email, password);
    return data;
  };

  const handleSignUp = async (email, password) => {
    const data = await signUp(email, password);
    return data;
  };

  const handleSignOut = async () => {
    // Clear state immediately — don't wait for Supabase round-trip
    setUser(null);
    setProfile(null);
    try {
      await signOut();
    } catch (err) {
      // Even if the network call fails, the user is locally signed out
      console.warn('Sign out network error (ignored):', err);
    }
    // Hard clear of any lingering Supabase session keys in storage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-')) localStorage.removeItem(key);
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAdmin,
        loading,
        signIn: handleSignIn,
        signUp: handleSignUp,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
