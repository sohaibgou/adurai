/**
 * Meta (Facebook) Pixel — thin client-side wrapper.
 *
 * The pixel library is loaded lazily via dynamic import so it never touches the
 * server bundle and only ships to the browser when first used. Initialization is
 * a no-op unless NEXT_PUBLIC_META_PIXEL_ID is configured, so local/preview
 * environments without a pixel id simply do nothing.
 *
 * Standard events fired across the app (see callers):
 *   ViewContent          — homepage load
 *   Lead                 — signup completed
 *   InitiateCheckout     — CSV analysis started
 *   CompleteRegistration — analysis completed
 *   AddToCart            — upgrade paywall shown
 *   Purchase             — payment succeeded
 */

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export const MetaPixel = {
  init: () => {
    if (typeof window !== "undefined" && PIXEL_ID) {
      import("react-facebook-pixel").then((module) => {
        const ReactPixel = module.default;
        ReactPixel.init(PIXEL_ID);
        ReactPixel.pageView();
      });
    }
  },

  /** Fire a PageView — call on client-side route changes (SPA navigation). */
  pageView: () => {
    if (typeof window !== "undefined" && PIXEL_ID) {
      import("react-facebook-pixel").then((module) => {
        module.default.pageView();
      });
    }
  },

  track: (event: string, data?: object) => {
    if (typeof window !== "undefined" && PIXEL_ID) {
      import("react-facebook-pixel").then((module) => {
        module.default.track(event, data ?? {});
      });
    }
  },
};
