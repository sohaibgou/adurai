import Link from "next/link";

export const metadata = {
  title:       "Privacy Policy — Adur.ai",
  description: "How Adur.ai collects, uses, and protects your personal data.",
};

const UPDATED = "May 19, 2026";
const CONTACT = "privacy@adur.ai";

// ── Design tokens ─────────────────────────────────────────────────────────────
const H2: React.CSSProperties = {
  fontSize: "clamp(18px, 2.5vw, 22px)",
  fontWeight: 800,
  letterSpacing: "-0.03em",
  color: "#0D0D12",
  marginBottom: 12,
  marginTop: 40,
};
const P: React.CSSProperties = {
  fontSize: 15,
  color: "#4B4B55",
  lineHeight: 1.75,
  marginBottom: 14,
  fontFamily: "var(--font-inter)",
};
const LI: React.CSSProperties = {
  fontSize: 15,
  color: "#4B4B55",
  lineHeight: 1.75,
  marginBottom: 6,
  fontFamily: "var(--font-inter)",
  paddingLeft: 8,
};

export default function PrivacyPage() {
  return (
    <div style={{ background: "#FAF8F5", minHeight: "100vh" }}>

      {/* ── Nav ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(250,248,245,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #E8E5E0",
        padding: "0 24px", height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logos/logo-black.svg" alt="Adur.ai" style={{ height: 36, width: "auto" }} />
        </Link>
        <Link href="/" style={{ fontSize: 14, color: "#6B6B72", fontFamily: "var(--font-inter)", textDecoration: "none", fontWeight: 500 }}>
          ← Back to home
        </Link>
      </nav>

      {/* ── Content ── */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "56px 24px 96px" }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <span style={{
            display: "inline-block", fontSize: 11, fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.12em", color: "#FF3CAC", marginBottom: 12,
          }}>
            Legal
          </span>
          <h1 className="font-heading" style={{
            fontSize: "clamp(32px, 5vw, 46px)", fontWeight: 900,
            letterSpacing: "-0.04em", color: "#0D0D12", lineHeight: 1.1, marginBottom: 16,
          }}>
            Privacy Policy
          </h1>
          <p style={{ ...P, color: "#6B6B72", marginBottom: 4 }}>
            Last updated: {UPDATED}
          </p>
          <p style={{ ...P, color: "#6B6B72" }}>
            This Privacy Policy explains how Adur.ai (&ldquo;Adur&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) collects, uses, and protects your information when you use our service at adur.ai.
          </p>
          <div style={{ height: 1, background: "#E8E5E0", marginTop: 32 }} />
        </div>

        {/* 1 */}
        <h2 className="font-heading" style={H2}>1. Information We Collect</h2>
        <p style={P}><strong>Account information.</strong> When you create an account we collect your email address and a hashed password. We do not store plain-text passwords.</p>
        <p style={P}><strong>Meta Ads credentials.</strong> When you connect a Meta Ads account we store your Meta access token and ad account ID in encrypted form. This token is used exclusively to retrieve and manage your Meta Ads campaigns on your behalf.</p>
        <p style={P}><strong>Billing information.</strong> Payments are processed by Stripe. We never see or store your full credit card number. We store only the Stripe customer ID and subscription status needed to manage your plan.</p>
        <p style={P}><strong>Usage data.</strong> We collect information about how you use Adur — pages visited, features used, analyses run, and timestamps. This helps us improve the product.</p>
        <p style={P}><strong>Campaign data.</strong> When you run an analysis or enable AI Manager, we temporarily process your Meta Ads campaign metrics (spend, impressions, clicks, ROAS, CPA). We may cache recent results to display them in your dashboard.</p>

        {/* 2 */}
        <h2 className="font-heading" style={H2}>2. How We Use Your Information</h2>
        <ul style={{ margin: "0 0 14px 20px", padding: 0 }}>
          {[
            "To provide and operate the Adur.ai service",
            "To connect to your Meta Ads account and perform analyses you request",
            "To execute automated actions (pause, scale, alert) when you enable AI Manager",
            "To send you account-related emails including action approval requests and briefings",
            "To process your subscription payments via Stripe",
            "To improve our product through aggregated, anonymised usage analytics",
            "To comply with legal obligations",
          ].map((item) => (
            <li key={item} style={LI}>• {item}</li>
          ))}
        </ul>
        <p style={P}>We do not sell your personal data to third parties. We do not use your campaign data for advertising purposes.</p>

        {/* 3 */}
        <h2 className="font-heading" style={H2}>3. Meta Ads Data</h2>
        <p style={P}>Adur connects to Meta&rsquo;s Marketing API using an access token you provide. By connecting your Meta account you authorise Adur to:</p>
        <ul style={{ margin: "0 0 14px 20px", padding: 0 }}>
          {[
            "Read campaign performance data (spend, impressions, clicks, ROAS, CPA)",
            "Pause or adjust budgets on campaigns — only when you explicitly approve, or when AI Manager is enabled in Auto mode",
            "Pass your access token to our AI model (Claude by Anthropic) via a secure server-side connection",
          ].map((item) => (
            <li key={item} style={LI}>• {item}</li>
          ))}
        </ul>
        <p style={P}>Your Meta access token is stored encrypted at rest in our database (Supabase). It is never logged in plain text and never exposed to the browser after initial submission.</p>
        <p style={P}>You can disconnect your Meta account at any time from the dashboard. Upon disconnection your access token is deleted from our systems within 24 hours.</p>
        <p id="data-deletion" style={{ ...P, scrollMarginTop: 80 }}>
          <strong>Data deletion requests.</strong> If you used Facebook Login or connected a Meta account, you can request deletion of your Meta-related data by visiting{" "}
          <a href="https://www.facebook.com/settings?tab=applications" target="_blank" rel="noopener noreferrer" style={{ color: "#FF3CAC", textDecoration: "none" }}>
            Facebook → Settings → Apps and Websites
          </a>
          {" "}and removing Adur.ai, or by emailing{" "}
          <a href="mailto:privacy@adur.ai" style={{ color: "#FF3CAC", textDecoration: "none" }}>privacy@adur.ai</a>.
          We will delete all associated campaign data and access tokens within 24 hours and confirm with a deletion code.
        </p>

        {/* 4 */}
        <h2 className="font-heading" style={H2}>4. Third-Party Services</h2>
        <p style={P}>Adur uses the following third-party processors:</p>
        <ul style={{ margin: "0 0 14px 20px", padding: 0 }}>
          {[
            "Supabase — database and authentication (EU/US servers)",
            "Stripe — payment processing (PCI-DSS Level 1 certified)",
            "Anthropic (Claude) — AI analysis of your campaign data, via a secure server-side API call",
            "Meta Platforms — Marketing API used to read and manage your ad campaigns",
            "Resend — transactional email delivery (action approvals, briefings)",
            "Vercel — hosting and serverless functions",
          ].map((item) => (
            <li key={item} style={LI}>• {item}</li>
          ))}
        </ul>
        <p style={P}>Each processor handles data only as required to perform their service and is bound by their own privacy policies and data processing agreements.</p>

        {/* 5 */}
        <h2 className="font-heading" style={H2}>5. Data Retention</h2>
        <p style={P}>We retain your account data for as long as your account is active. Subscription and billing records are retained for 7 years as required by financial regulations. Campaign performance data cached in our systems is retained for 90 days.</p>
        <p style={P}>When you delete your account all personal data is deleted within 30 days, except where retention is required by law.</p>

        {/* 6 */}
        <h2 className="font-heading" style={H2}>6. Your Rights</h2>
        <p style={P}>Depending on your location you may have rights including:</p>
        <ul style={{ margin: "0 0 14px 20px", padding: 0 }}>
          {[
            "Access — request a copy of the personal data we hold about you",
            "Correction — ask us to correct inaccurate data",
            "Deletion — request deletion of your personal data",
            "Portability — receive your data in a machine-readable format",
            "Objection — object to certain processing activities",
            "Restriction — ask us to restrict processing in certain circumstances",
          ].map((item) => (
            <li key={item} style={LI}>• {item}</li>
          ))}
        </ul>
        <p style={P}>To exercise any of these rights, email us at <a href={`mailto:${CONTACT}`} style={{ color: "#FF3CAC", textDecoration: "none" }}>{CONTACT}</a>. We will respond within 30 days.</p>

        {/* 7 */}
        <h2 className="font-heading" style={H2}>7. Cookies</h2>
        <p style={P}>We use strictly necessary cookies to maintain your authenticated session. We do not use tracking or advertising cookies. We do not use third-party analytics that set persistent cookies.</p>

        {/* 8 */}
        <h2 className="font-heading" style={H2}>8. Security</h2>
        <p style={P}>We apply industry-standard security measures: HTTPS for all data in transit, encryption at rest for sensitive fields (access tokens), role-based access controls, and regular security reviews. However, no system is completely secure — if you believe your account has been compromised, contact us immediately.</p>

        {/* 9 */}
        <h2 className="font-heading" style={H2}>9. Children&rsquo;s Privacy</h2>
        <p style={P}>Adur.ai is not directed at children under 16. We do not knowingly collect personal data from children. If you believe a child has provided us with personal data, please contact us and we will delete it promptly.</p>

        {/* 10 */}
        <h2 className="font-heading" style={H2}>10. Changes to This Policy</h2>
        <p style={P}>We may update this Privacy Policy from time to time. We will notify you of material changes by email or by displaying a notice in the product. Continued use of Adur after the effective date constitutes acceptance of the updated policy.</p>

        {/* 11 */}
        <h2 className="font-heading" style={H2}>11. Contact</h2>
        <p style={P}>For privacy-related questions or requests, contact us at:</p>
        <div style={{
          padding: "20px 24px", borderRadius: 14,
          background: "#fff", border: "1px solid #E8E5E0",
          fontFamily: "var(--font-inter)", fontSize: 14, color: "#0D0D12", lineHeight: 1.8,
        }}>
          <strong>Adur.ai</strong><br />
          Email: <a href={`mailto:${CONTACT}`} style={{ color: "#FF3CAC", textDecoration: "none" }}>{CONTACT}</a><br />
          Website: <a href="https://adur.ai" style={{ color: "#FF3CAC", textDecoration: "none" }}>adur.ai</a>
        </div>

        {/* Bottom link */}
        <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid #E8E5E0", display: "flex", gap: 24 }}>
          <Link href="/terms" style={{ fontSize: 14, color: "#6B6B72", fontFamily: "var(--font-inter)", textDecoration: "none", fontWeight: 500 }}>
            Terms of Service →
          </Link>
          <Link href="/" style={{ fontSize: 14, color: "#6B6B72", fontFamily: "var(--font-inter)", textDecoration: "none", fontWeight: 500 }}>
            Back to Adur.ai →
          </Link>
        </div>
      </div>
    </div>
  );
}
