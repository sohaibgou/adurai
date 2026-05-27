"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

// ── Magic-link detection via JWT "amr" claim ──────────────────────────────────
// Supabase SSR's createBrowserClient strips the URL hash synchronously during
// import — before any module-level code can read window.location.hash.
// Instead, we inspect the JWT payload: when a session comes from a magic link
// (OTP), Supabase sets amr: [{ method: "otp" }] in the access token.
function isMagicLinkSession(session: Session | null): boolean {
  if (!session?.access_token) return false;
  try {
    const [, b64] = session.access_token.split(".");
    const payload = JSON.parse(atob(b64)) as {
      amr?: Array<{ method: string }>;
    };
    return Array.isArray(payload.amr) && payload.amr.some((a) => a.method === "otp");
  } catch {
    return false;
  }
}

// Read email_link_verified straight from the JWT payload.
// The DB is authoritative, but this lets us avoid a mark-verified call when
// the user is already verified (e.g. they signed in via magic link later on).
function jwtEmailLinkVerified(session: Session | null): boolean {
  if (!session?.access_token) return false;
  try {
    const [, b64] = session.access_token.split(".");
    const payload = JSON.parse(atob(b64)) as {
      app_metadata?: { email_link_verified?: boolean };
    };
    return payload.app_metadata?.email_link_verified === true;
  } catch {
    return false;
  }
}

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

/* ── Inline success toast ──────────────────────────────────────────────────── */

function VerifySuccessToast({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <>
      <style>{`
        @keyframes slideDownFade {
          0%   { opacity: 0; transform: translateY(-16px) translateX(-50%); }
          12%  { opacity: 1; transform: translateY(0)     translateX(-50%); }
          80%  { opacity: 1; transform: translateY(0)     translateX(-50%); }
          100% { opacity: 0; transform: translateY(-8px)  translateX(-50%); }
        }
      `}</style>
      <div
        style={{
          position:      "fixed",
          top:           20,
          left:          "50%",
          transform:     "translateX(-50%)",
          zIndex:        99999,
          animation:     "slideDownFade 4s ease forwards",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            display:      "flex",
            alignItems:   "center",
            gap:          10,
            padding:      "12px 20px",
            borderRadius: 100,
            background:   "#ffffff",
            border:       "1px solid rgba(22,163,74,0.28)",
            boxShadow:    "0 4px 24px rgba(0,0,0,0.10), 0 0 0 1px rgba(22,163,74,0.10)",
            whiteSpace:   "nowrap",
          }}
        >
          <div style={{
            width: 22, height: 22, borderRadius: "50%",
            background: "linear-gradient(135deg,#16A34A,#22c55e)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 2px 8px rgba(22,163,74,0.35)",
          }}>
            <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
              <path d="M1 4.5L4 7.5L10 1.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{
            fontSize: 14, fontWeight: 600, color: "#0D0D12",
            fontFamily: "var(--font-inter, system-ui, sans-serif)",
            letterSpacing: "-0.01em",
          }}>
            Email verified — all features unlocked 🎉
          </span>
        </div>
      </div>
    </>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const [session,       setSession]       = useState<Session | null>(null);
  const [user,          setUser]          = useState<User | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [showToast,     setShowToast]     = useState(false);

  // Prevent calling mark-verified more than once per page load
  const markVerifiedCalledRef = useRef(false);

  // Track current user ID so the visibilitychange handler can detect switches
  const currentUserIdRef = useRef<string | null>(null);
  useEffect(() => { currentUserIdRef.current = user?.id ?? null; }, [user?.id]);

  // ── Show toast when we return from a verification redirect ───────────────
  useEffect(() => {
    if (typeof sessionStorage === "undefined") return;
    if (sessionStorage.getItem("adur_just_verified") === "1") {
      sessionStorage.removeItem("adur_just_verified");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4200);
    }
  }, []);

  // ── Core: call /api/auth/mark-verified ────────────────────────────────────
  function runMarkVerified(accessToken: string) {
    if (markVerifiedCalledRef.current) return;
    markVerifiedCalledRef.current = true;

    // Optimistically mark verified so the banner disappears immediately
    setEmailVerified(true);

    (async () => {
      try {
        const res = await fetch("/api/auth/mark-verified", {
          method:  "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (res.ok) {
          // Show the success toast immediately (no page reload needed)
          setShowToast(true);
          setTimeout(() => setShowToast(false), 4200);

          // Refresh the JWT so it carries email_link_verified: true.
          // This is a bonus — the main loop-prevention comes from using router.replace
          // below (which keeps this auth-context mounted so markVerifiedCalledRef stays true).
          try { await supabase.auth.refreshSession(); } catch { /* non-critical */ }
        }
      } catch { /* non-critical */ }

      // ⚠️  IMPORTANT: use router.replace (client-side nav) NOT window.location.replace
      // (full page reload). A full reload re-mounts AuthProvider, resets markVerifiedCalledRef
      // to false, and re-triggers runMarkVerified on every load → infinite redirect loop.
      // Client-side nav keeps this component mounted so the ref remains true.
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      router.replace("/dashboard");
    })();
  }

  useEffect(() => {
    // ── Step 1: load initial session ─────────────────────────────────────────
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Detect magic link via JWT "amr" claim (reliable — no URL hash needed).
        // Only call mark-verified if the JWT shows the user is NOT yet verified.
        if (isMagicLinkSession(session) && !jwtEmailLinkVerified(session) && session?.access_token) {
          runMarkVerified(session.access_token);
        }
      })
      .catch(() => { /* Supabase unreachable — treat as logged out */ })
      .finally(() => { setLoading(false); });

    // ── Step 2: keep session in sync ─────────────────────────────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Handle both SIGNED_IN (new session) and USER_UPDATED (existing session
      // updated — happens when already logged in and clicking the magic link).
      if (
        (event === "SIGNED_IN" || event === "USER_UPDATED") &&
        session?.access_token &&
        isMagicLinkSession(session) &&
        !jwtEmailLinkVerified(session)
      ) {
        runMarkVerified(session.access_token);
      }
    });

    // ── Step 3: cross-tab session guard ──────────────────────────────────────
    // When the user returns to this tab, re-fetch the session from Supabase.
    // If another tab signed in as a different account or signed out, redirect
    // immediately so both tabs can never be logged into different accounts.
    function handleVisibilityChange() {
      if (document.visibilityState !== "visible") return;
      supabase.auth.getSession().then(({ data: { session: freshSession } }) => {
        const prevId = currentUserIdRef.current;
        const newId  = freshSession?.user?.id ?? null;

        if (prevId === newId) return; // nothing changed

        // Update state to match the fresh session
        setSession(freshSession);
        setUser(freshSession?.user ?? null);

        if (!newId) {
          // Signed out in another tab → go to login
          window.location.href = "/login";
        } else {
          // Different account signed in → reload dashboard for the new user
          window.location.href = "/dashboard";
        }
      }).catch(() => { /* non-critical */ });
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch real email-verification status from DB when user changes ─────────
  useEffect(() => {
    if (!user) { setEmailVerified(null); return; }
    // Skip if mark-verified already ran this page load (optimistic state is set)
    if (markVerifiedCalledRef.current) return;

    fetch("/api/auth/verify-status")
      .then(r => r.json())
      .then(({ emailVerified }: { emailVerified: boolean }) => {
        if (!markVerifiedCalledRef.current) setEmailVerified(emailVerified);
      })
      .catch(() => setEmailVerified(true)); // fail open
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const signOut = async () => {
    try { await supabase.auth.signOut(); } catch { /* ignore */ }
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, emailVerified, signOut }}>
      <VerifySuccessToast visible={showToast} />
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
