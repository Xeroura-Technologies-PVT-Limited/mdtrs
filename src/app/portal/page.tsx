import type { Metadata } from "next";
import { Suspense } from "react";
import { PortalFromQuery } from "@/components/portal/PortalAccess";

export const metadata: Metadata = {
  title: "Care portal",
  description: "Sign in to complete your patient details, attach medical reports, or review patients assigned to you.",
  alternates: { canonical: "/portal" },
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function PortalPage() {
  return <Suspense fallback={<p className="wrap" role="status">Opening the care portal…</p>}><PortalFromQuery /></Suspense>;
}
