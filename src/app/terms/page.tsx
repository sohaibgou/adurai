import Link from "next/link";

export const metadata = {
  title:       "Terms of Service — Adur.ai",
  description: "Terms and conditions for using Adur.ai.",
};

const UPDATED = "May 19, 2026";
const CONTACT = "legal@adur.ai";

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

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p style={{ ...P, color: "#6B6B72", marginBottom: 4 }}>
            Last updated: {UPDATED}
          </p>
          <p style={{ ...P, color: "#6B6B72" }}>
            These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of Adur.ai (&ldquo;Adur&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;). By creating an account or using our service you agree to these Terms.
          </p>
          <div style={{ height: 1, background: "#E8E5E0", marginTop: 32 }} />
        </div>

        {/* 1 */}
        <h2 className="font-heading" style={H2}>1. Description of Service</h2>
        <p style={P}>Adur.ai is an AI-powered Meta Ads management platform. The service allows you to analyse your Meta Ads campaigns, receive AI-generated recommendations, and optionally enable automated campaign management (&ldquo;AI Manager&rdquo;) that can pause underperforming campaigns, adjust budgets, and send you performance briefings.</p>
        <p style={P}>The service is provided on a subscription basis. Plan features and pricing are described on our pricing page and may be updated from time to time with reasonable notice.</p>

        {/* 2 */}
        <h2 className="font-heading" style={H2}>2. Account Registration</h2>
        <p style={P}>You must provide a valid email address and create a password to use Adur. You are responsible for maintaining the security of your account credentials. You must notify us immediately if you suspect unauthorised access to your account.</p>
        <p style={P}>You must be at least 18 years old and have the legal authority to bind yourself (or your company) to these Terms. If you are accepting these Terms on behalf of a company, you represent that you have the authority to do so.</p>

        {/* 3 */}
        <h2 className="font-heading" style={H2}>3. Subscription Plans and Billing</h2>
        <p style={P}>Adur offers the following subscription plans:</p>
        <ul style={{ margin: "0 0 14px 20px", padding: 0 }}>
          <li style={LI}>• <strong>Free</strong> — up to 3 analyses per month at no charge</li>
          <li style={LI}>• <strong>Starter — $19/month</strong> — 10 analyses per month, full 7-Day Battle Plan, creative tools, PDF exports</li>
          <li style={LI}>• <strong>Growth — $49/month</strong> — unlimited analyses, expanded Creative Studio limits, and Meta account connection (when available)</li>
          <li style={LI}>• <strong>Autopilot (Pro) — $99/month</strong> — everything in Growth, plus AI Manager, 24/7 monitoring, and automated actions (when available)</li>
        </ul>
        <p style={P}>Subscriptions are billed monthly in advance via Stripe. By subscribing you authorise us to charge your payment method on a recurring basis. All fees are non-refundable except where required by applicable law or at our sole discretion.</p>
        <p style={P}>You may cancel your subscription at any time from your account settings. Cancellation takes effect at the end of the current billing period. We do not prorate unused portions of a billing period.</p>
        <p style={P}>We reserve the right to change pricing with 30 days&rsquo; notice. Continued use after the notice period constitutes acceptance of new pricing.</p>

        {/* 4 */}
        <h2 className="font-heading" style={H2}>4. Meta Ads Integration</h2>
        <p style={P}>To use AI Manager and live analysis features you must connect a Meta Ads account by providing a valid Meta access token. By doing so you:</p>
        <ul style={{ margin: "0 0 14px 20px", padding: 0 }}>
          {[
            "Represent that you are authorised to manage the connected Meta Ads account",
            "Grant Adur permission to read campaign performance data on your behalf",
            "Grant Adur permission to execute campaign actions (pause, budget adjustment) subject to your chosen autopilot mode (Auto, Confirm, or Alerts Only)",
            "Accept sole responsibility for the consequences of any automated actions taken on your campaigns",
          ].map((item) => (
            <li key={item} style={LI}>• {item}</li>
          ))}
        </ul>
        <p style={P}><strong>Important:</strong> When AI Manager is set to &ldquo;Auto&rdquo; mode, Adur will make changes to your live campaigns without requesting prior approval for each action. You accept full responsibility for ensuring this mode is appropriate for your account. Adur is not liable for any advertising spend, lost revenue, or campaign performance outcomes resulting from automated actions.</p>

        {/* 5 */}
        <h2 className="font-heading" style={H2}>5. AI-Powered Features</h2>
        <p style={P}>Adur uses Claude (Anthropic) as its AI engine. AI-generated analyses, recommendations, and actions are provided for informational and operational purposes only. They do not constitute financial, marketing, or business advice.</p>
        <p style={P}>AI outputs may contain errors, be based on incomplete data, or may not reflect current market conditions. You should apply your own judgement before acting on any AI-generated recommendation. Adur makes no warranty that AI recommendations will improve campaign performance or achieve any particular outcome.</p>

        {/* 6 */}
        <h2 className="font-heading" style={H2}>6. Acceptable Use</h2>
        <p style={P}>You agree not to:</p>
        <ul style={{ margin: "0 0 14px 20px", padding: 0 }}>
          {[
            "Use Adur to manage ad accounts you are not authorised to access",
            "Attempt to reverse-engineer, scrape, or extract data from Adur beyond normal use",
            "Use Adur to circumvent Meta's advertising policies or terms of service",
            "Share your account credentials with third parties",
            "Resell or white-label Adur without a written agreement with us",
            "Use Adur for any unlawful purpose or in violation of any applicable law or regulation",
          ].map((item) => (
            <li key={item} style={LI}>• {item}</li>
          ))}
        </ul>
        <p style={P}>We reserve the right to suspend or terminate accounts that violate these terms, without prior notice or refund.</p>

        {/* 7 */}
        <h2 className="font-heading" style={H2}>7. Intellectual Property</h2>
        <p style={P}>Adur.ai and all associated software, designs, trademarks, and content are owned by us or our licensors. Nothing in these Terms transfers any ownership to you.</p>
        <p style={P}>You retain ownership of your campaign data and any content you upload. You grant us a limited, non-exclusive licence to process that data for the purpose of providing the service.</p>

        {/* 8 */}
        <h2 className="font-heading" style={H2}>8. Disclaimer of Warranties</h2>
        <p style={P}>THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.</p>
        <p style={P}>We do not warrant that the service will be uninterrupted, error-free, or that any particular campaign result will be achieved. Meta API availability and policy changes are outside our control.</p>

        {/* 9 */}
        <h2 className="font-heading" style={H2}>9. Limitation of Liability</h2>
        <p style={P}>TO THE MAXIMUM EXTENT PERMITTED BY LAW, ADUR.AI AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF AD SPEND, LOST PROFITS, OR LOST REVENUE, ARISING FROM YOUR USE OF THE SERVICE.</p>
        <p style={P}>OUR TOTAL LIABILITY TO YOU FOR ANY CLAIM ARISING UNDER THESE TERMS SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE 12 MONTHS PRECEDING THE CLAIM.</p>

        {/* 10 */}
        <h2 className="font-heading" style={H2}>10. Indemnification</h2>
        <p style={P}>You agree to indemnify and hold harmless Adur.ai and its team from any claims, damages, losses, or costs (including legal fees) arising from your use of the service, your violation of these Terms, or your violation of any third-party rights including Meta&rsquo;s platform policies.</p>

        {/* 11 */}
        <h2 className="font-heading" style={H2}>11. Termination</h2>
        <p style={P}>Either party may terminate these Terms at any time. You may do so by cancelling your subscription and deleting your account. We may terminate or suspend your access immediately if you breach these Terms or if required by law.</p>
        <p style={P}>On termination: your access to the service ends, your data is retained for 30 days to allow you to request a copy, and then deleted per our Privacy Policy.</p>

        {/* 12 */}
        <h2 className="font-heading" style={H2}>12. Changes to These Terms</h2>
        <p style={P}>We may update these Terms from time to time. We will notify you of material changes by email or in-app notice at least 14 days before they take effect. Continued use of the service after the effective date constitutes acceptance.</p>

        {/* 13 */}
        <h2 className="font-heading" style={H2}>13. Governing Law</h2>
        <p style={P}>These Terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales, unless otherwise required by applicable consumer protection law in your jurisdiction.</p>

        {/* 14 */}
        <h2 className="font-heading" style={H2}>14. Contact</h2>
        <p style={P}>For questions about these Terms, contact us at:</p>
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
          <Link href="/privacy" style={{ fontSize: 14, color: "#6B6B72", fontFamily: "var(--font-inter)", textDecoration: "none", fontWeight: 500 }}>
            Privacy Policy →
          </Link>
          <Link href="/" style={{ fontSize: 14, color: "#6B6B72", fontFamily: "var(--font-inter)", textDecoration: "none", fontWeight: 500 }}>
            Back to Adur.ai →
          </Link>
        </div>
      </div>
    </div>
  );
}
