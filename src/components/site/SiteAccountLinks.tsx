"use client";

import type { ReactNode } from "react";
import { usePortalSession } from "@/components/portal/PortalSession";
import { portalLogins } from "@/lib/portal-roles";
import { workspacePath } from "@/lib/portal-routes";
import { SiteLink } from "./SiteLink";

const actions = {
  intake: { href: workspacePath({ role: "patient", section: "intake" }), label: "Update my intake" },
  reports: { href: workspacePath({ role: "patient", section: "reports" }), label: "Open my medical reports" },
  patients: { href: workspacePath({ role: "doctor", section: "patients" }), label: "Review assigned patients" },
  journey: { href: "/patient-journey", label: "Plan my care journey" },
  hospitals: { href: "/hospitals", label: "Explore the hospital network" },
  doctors: { href: "/doctors", label: "Explore doctor-led care" },
};

export function SiteAccountLink({ patient, doctor, children, className = "btn btn-ghost" }: {
  patient: "intake" | "reports" | "journey";
  doctor: "patients" | "hospitals" | "doctors";
  children?: ReactNode;
  className?: string;
}) {
  const { user, role } = usePortalSession();
  if (!user) return children;
  const link = role ? actions[role === "patient" ? patient : doctor] : { href: "/portal", label: "Open my portal" };
  return <SiteLink className={className} href={link.href}>{link.label}</SiteLink>;
}

export function ContactPortalCard() {
  const { role } = usePortalSession();
  return <div className="way" data-reveal="">
    <span className="mono">{role === "doctor" ? "Doctor portal" : "Patient portal"}</span>
    <p>{role === "doctor" ? "Review your assigned patients’ intakes and medical reports." : "Save your details and upload reports for your assigned doctor."}</p>
    <div className="way-links">
      <SiteAccountLink patient="reports" doctor="patients" className="">
        <SiteLink href="/login/patient">Patient login</SiteLink>
      </SiteAccountLink>
    </div>
  </div>;
}

export function FooterPortalLinks() {
  const { user, role } = usePortalSession();
  if (!user) return portalLogins.map(({ href, label }) => <li key={href}><SiteLink href={href}>{label} login</SiteLink></li>);
  if (!role) return <li><SiteLink href="/portal">Open my portal</SiteLink></li>;
  return <li><SiteLink href={workspacePath({ role, section: "overview" })}>{role === "doctor" ? "Doctor portal" : "Patient portal"}</SiteLink></li>;
}
