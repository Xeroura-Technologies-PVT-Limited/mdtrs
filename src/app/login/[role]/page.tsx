import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PortalAccess } from "@/components/portal/PortalAccess";
import { portalLogins } from "@/lib/portal-roles";

type LoginPageProps = { params: Promise<{ role: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return portalLogins.map(({ role }) => ({ role }));
}

function getLogin(role: string) {
  return portalLogins.find(login => login.role === role) ?? notFound();
}

export async function generateMetadata({ params }: LoginPageProps): Promise<Metadata> {
  const login = getLogin((await params).role);
  return {
    title: `${login.label} login`,
    description: login.role === "doctor"
      ? "Sign in to review the intake details and reports of patients assigned to you."
      : "Sign in to update your intake details and share medical reports with your assigned doctor.",
    alternates: { canonical: login.href },
    robots: { index: false, follow: false },
    referrer: "no-referrer",
  };
}

export default async function LoginPage({ params }: LoginPageProps) {
  const login = getLogin((await params).role);
  return <PortalAccess selectedRole={login.role} />;
}
