"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextValue {
  session:       Session | null;
  user:          User | null;
  loading:       boolean;
  emailVerified: boolean | null; // null = loading, true = verified, false = needs verification
  signOut:       () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session:       null,
  user:          null,
  loading:       true,
  emailVerified: null,
  signOut:       async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session,       setSession]       = useState<Session | null>(null);
  const [user,          setUser]          = useState<User | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
      })
      .catch(() => {
        // Supabase unreachable — treat as logged out, don't crash
      })
      .finally(() => {
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch real email-verification status from DB whenever the user changes
  useEffect(() => {
    if (!user) { setEmailVerified(null); return; }
    fetch("/api/auth/verify-status")
      .then(r => r.json())
      .then(({ emailVerified }: { emailVerified: boolean }) => setEmailVerified(emailVerified))
      .catch(() => setEmailVerified(true)); // fail open
  }, [user?.id]);

  const signOut = async () => {
    try { await supabase.auth.signOut(); } catch { /* ignore */ }
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, emailVerified, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
