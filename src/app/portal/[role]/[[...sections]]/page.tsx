import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PortalAccess } from "@/components/portal/PortalAccess";
import { getWorkspacePage } from "@/lib/portal-routes";

type Props = { params: Promise<{ role: string; sections?: string[] }> };

async function resolvePage(params: Props["params"]) {
  const { role, sections } = await params;
  return getWorkspacePage(role, sections ?? []) ?? notFound();
}

const titles = {
  overview: "Overview", intake: "My intake", reports: "My reports", patients: "Assigned patients",
  patient: "Patient record", account: "My account",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await resolvePage(params);
  const portal = page.role === "doctor" ? "Doctor portal" : "Patient portal";
  return {
    title: `${titles[page.section]} · ${portal}`,
    robots: { index: false, follow: false }, referrer: "no-referrer", alternates: { canonical: null },
  };
}

export default async function WorkspacePage({ params }: Props) {
  const page = await resolvePage(params);
  return <PortalAccess selectedRole={page.role} page={page} />;
}
