import type { PortalRole } from "./portal-roles";

const treatments = { href: "/treatments", label: "Treatments", description: "Browse medical, surgical, dental, rehabilitation and wellness services." };
const hospitals = { href: "/hospitals", label: "Hospitals", description: "See how Medtours selects hospitals and checks their accreditation." };
const doctors = { href: "/doctors", label: "Doctors", description: "Meet the clinical lead and learn how the team reviews reports and arranges specialist consultations." };
const contact = { href: "/contact", label: "Contact", description: "Find phone, WhatsApp and email details for the coordination team." };

const patientPages = [
  { href: "/patient-journey", label: "Care journey", description: "Plan each step, from sharing your reports to follow-up at home." },
  treatments,
  hospitals,
  { href: "/hospitality", label: "Hospitality", description: "Plan accommodation, airport pickup and support for a travelling companion." },
  { href: "/wellness", label: "Wellness", description: "Explore screening and restorative programmes." },
  doctors,
  { href: "/faq", label: "FAQ", description: "Find answers about travel, estimates and arranging your visit." },
  contact,
];

const doctorPages = [
  doctors,
  hospitals,
  treatments,
  { href: "/patient-journey", label: "Patient journey", description: "Review the steps your patients follow before travel, during treatment and after discharge." },
  contact,
];

export function roleSiteNavigation(role: PortalRole) {
  return role === "doctor" ? doctorPages : patientPages;
}
