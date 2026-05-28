import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth-context";
import { Analytics } from "@vercel/analytics/next";
import ConditionalFooter from "@/components/conditional-footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const geist = Geist({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Adur.ai — AI Meta Ads Analysis for E-commerce",
  description:
    "Upload your Meta Ads Manager CSV and get instant AI-powered campaign analysis with actionable recommendations.",
  other: {
    "facebook-domain-verification": "j4aw10l2gpa6yxt2zyta5h7e1599l3",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${geist.variable} ${geist.className} h-full antialiased`} suppressHydrationWarning={true}>
      <body className="min-h-full flex flex-col" suppressHydrationWarning={true}>
        {/* Capture Supabase hash tokens BEFORE any JS bundle runs and strips them */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){var h=window.location.hash;if(h&&(h.indexOf('access_token=')!==-1||h.indexOf('error=')!==-1)){window.location.replace('/auth/confirm'+h);}})();` }} />
        <AuthProvider>
          {children}
          <ConditionalFooter />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
