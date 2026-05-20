/**
 * /auth/confirm
 *
 * Handles Supabase's email verification link. Supabase redirects here after
 * the user clicks the confirmation email (emailRedirectTo points here).
 *
 * URL formats:
 *   ?token_hash=...&type=signup   (standard flow)
 *   ?token_hash=...&type=email
 *   ?code=...                     (PKCE flow)
 *
 * After verifying, calls /api/auth/mark-verified to set
 * app_metadata.email_link_verified = true, then redirects to /dashboard.
 *
 * NOTE: useSearchParams() requires a Suspense boundary in Next.js 14 App Router.
 * The inner ConfirmContent component is wrapped in Suspense by the outer page export.
 */

import { Suspense } from "react";
import ConfirmContent from "./confirm-content";

function LoadingCard() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FAF8F5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid #E8E5E0",
          borderRadius: 20,
          padding: "40px 36px",
          maxWidth: 420,
          width: "100%",
          textAlign: "center",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            width: 52, height: 52, borderRadius: 14,
            background: "linear-gradient(135deg, #FF3CAC, #FF6B35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px", fontSize: 24,
          }}
        >
          ⏳
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0D0D12", letterSpacing: "-0.03em", marginBottom: 10 }}>
          Verifying email…
        </h1>
        <p style={{ fontSize: 14, color: "#6B6B72", lineHeight: 1.6 }}>
          Please wait a moment.
        </p>
      </div>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={<LoadingCard />}>
      <ConfirmContent />
    </Suspense>
  );
}
