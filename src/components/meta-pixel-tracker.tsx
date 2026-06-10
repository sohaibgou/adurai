"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { MetaPixel } from "@/lib/meta-pixel";

/**
 * Mounts the Meta Pixel once for the whole app and fires a PageView on every
 * client-side navigation. Rendered inside the (server) root layout so the layout
 * itself stays a server component and keeps exporting `metadata`.
 *
 * init() already fires the first PageView, so we skip the duplicate on initial
 * mount and only track on subsequent pathname changes.
 */
export default function MetaPixelTracker() {
  const pathname = usePathname();
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      MetaPixel.init();
      initialized.current = true;
      return; // init() already counts as the first PageView
    }
    MetaPixel.pageView();
  }, [pathname]);

  return null;
}
