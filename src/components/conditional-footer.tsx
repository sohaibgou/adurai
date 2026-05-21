"use client";

import { usePathname } from "next/navigation";
import SiteFooter from "@/components/landing/site-footer";

// App routes that use the sidebar layout — no footer there
const NO_FOOTER_PREFIXES = [
  "/dashboard",
  "/creative-studio",
  "/analyze",
  "/results",
];

export default function ConditionalFooter() {
  const pathname = usePathname();
  const hide = NO_FOOTER_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
  if (hide) return null;
  return <SiteFooter />;
}
