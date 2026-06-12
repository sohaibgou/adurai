import { redirect } from "next/navigation";

/**
 * Creative Studio is the app home now. The analytics dashboard moved to
 * /insights; every legacy "/dashboard" link or bookmark lands in the studio.
 * (/dashboard/autopilot is its own route and is unaffected.)
 */
export default function DashboardRedirect() {
  redirect("/creative-studio");
}
