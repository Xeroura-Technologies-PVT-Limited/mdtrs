export const portalLogins = [
  { role: "doctor", label: "Doctor", href: "/login/doctor" },
  { role: "patient", label: "Patient", href: "/login/patient" },
] as const;

export type PortalRole = (typeof portalLogins)[number]["role"];
