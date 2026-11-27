import type { PortalRole } from "./portal-roles";

export type WorkspacePage =
  | { role: "patient"; section: "overview" | "intake" | "reports" | "account" }
  | { role: "doctor"; section: "overview" | "patients" | "account" }
  | { role: "doctor"; section: "patient"; patientId: string };

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function getWorkspacePage(role: string, segments: string[]): WorkspacePage | null {
  if (role !== "doctor" && role !== "patient") return null;
  if (segments.length === 0) return { role, section: "overview" };
  const [section, patientId] = segments;
  if (segments.length === 1) {
    if (section === "account") return { role, section };
    if (role === "patient" && (section === "reports" || section === "intake")) return { role, section };
    if (role === "doctor" && section === "patients") return { role, section };
  }
  if (role === "doctor" && segments.length === 2 && section === "patients" && uuid.test(patientId)) {
    return { role, section: "patient", patientId };
  }
  return null;
}

export function workspacePath(page: WorkspacePage) {
  const base = `/portal/${page.role}`;
  if (page.section === "patient") return `${base}/patients/${page.patientId}`;
  return page.section === "overview" ? base : `${base}/${page.section}`;
}

// Return only recognized routes inside the authenticated account's workspace.
export function loginDestination(role: PortalRole, next: string | null) {
  const [root, portal, requestedRole, ...segments] = (next ?? "").split("/");
  const page = root === "" && portal === "portal" && requestedRole === role && getWorkspacePage(role, segments);
  return page ? workspacePath(page) : `/portal/${role}`;
}

export function workspaceLinks(role: PortalRole) {
  const base = `/portal/${role}`;
  const features = role === "doctor"
    ? [{ label: "Assigned patients", href: base + "/patients" }]
    : [{ label: "My intake", href: base + "/intake" }, { label: "My reports", href: base + "/reports" }];
  return [{ label: "Overview", href: base }, ...features, { label: "My account", href: base + "/account" }];
}
