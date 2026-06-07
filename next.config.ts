import type { NextConfig } from "next";

// Security headers applied to every response. These are the high-value,
// low-risk hardening headers — they don't interfere with inline styles or
// the third-party resources the app loads (Stripe, Supabase, fal, Microlink).
// A strict Content-Security-Policy is intentionally omitted for now: the app
// relies heavily on inline styles and several external origins, so a CSP needs
// to be authored and tested carefully before it can be enabled safely.
const securityHeaders = [
  // Clickjacking protection — the app should never be framed by another site.
  { key: "X-Frame-Options", value: "DENY" },
  // Stop browsers from MIME-sniffing responses away from their declared type.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Don't leak full URLs (which can carry IDs) to cross-origin destinations.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Force HTTPS for two years, including subdomains.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Deny powerful browser features we never use.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  // Defense-in-depth against clickjacking for browsers that honor CSP.
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
];

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // fluent-ffmpeg is a CJS server-only module — keep it out of the client bundle.
  serverExternalPackages: ["fluent-ffmpeg", "sharp"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
