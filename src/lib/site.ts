/** Site-wide content: contact details, navigation, treatments and FAQ.
 *  Edit copy here; pages read from this file. */

export const SITE = {
  name: "Medtours",
  tagline: "Heal With Experience",
  domain: "medtoursin.com",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://medtoursin.com",
  description:
    "Medical travel to India for international patients and the people who travel with them. Accredited hospitals, an itemised estimate before you fly, and one coordinator from visa to recovery.",
  founder: "Dr. Ravi Teja",
  phone: "+91 99856 66688",
  phoneHref: "tel:+919985666688",
  whatsapp: "https://wa.me/919985666688",
  email: "drravitejabuddha@gmail.com",
};

export type NavLink = { href: string; label: string; kicker: string };

export const NAV: NavLink[] = [
  { href: "/treatments", label: "Treatments", kicker: "Care" },
  { href: "/#journeys", label: "Patients & attenders", kicker: "For you" },
  { href: "/#hospitals", label: "Accredited hospitals", kicker: "Trust" },
  { href: "/#journey", label: "Your journey", kicker: "How" },
  { href: "/about", label: "About us", kicker: "Who" },
  { href: "/faq", label: "Questions", kicker: "Help" },
  { href: "/contact", label: "Contact", kicker: "Talk" },
];

export const GUIDE_LINKS: NavLink[] = [
  { href: "/patient-journey", label: "Patient journey", kicker: "Itinerary" },
  { href: "/hospitals", label: "Hospitals", kicker: "Network" },
  { href: "/doctors", label: "Doctors", kicker: "Clinical team" },
  { href: "/wellness", label: "Wellness", kicker: "Programmes" },
  { href: "/hospitality", label: "Hospitality", kicker: "Your stay" },
];

export type Treatment = {
  slug: string;
  name: string;
  group: "Clinical" | "Wellness";
  render: string;
  alt: string;
  summary: string;
  intro: string;
  areas: { name: string; text: string }[];
  arrange: string[];
  notes: { title: string; text: string }[];
};

export function treatmentSources(file: string) {
  const prefix = file.replace("/treatments/", "/treatments/previews/").replace(/\.webp$/, "");
  return `${prefix}-600.webp 600w, ${prefix}-900.webp 900w, ${file} 1280w`;
}

export const TREATMENTS: Treatment[] = [
  {
    slug: "medical",
    name: "Medical",
    group: "Clinical",
    render: "/editorial/treatments/medical.webp",
    alt: "A doctor and patient reviewing a tablet together",
    summary:
      "Diagnosis and treatment without surgery, and second opinions from senior physicians before you decide.",
    intro:
      "Many patients come to India first for answers: a clear diagnosis, a review of the treatment they have been offered at home, or care that is hard to get quickly where they live. We connect you with senior physicians who look at your full history before suggesting anything.",
    areas: [
      { name: "Cardiology", text: "Assessment of chest pain, rhythm problems and heart failure, with imaging and stress testing arranged in one visit." },
      { name: "Oncology", text: "Tumour board reviews, chemotherapy, immunotherapy and radiation planning at hospitals with dedicated cancer centres." },
      { name: "Neurology", text: "Evaluation of epilepsy, stroke, movement disorders and headaches, with MRI and EEG on site." },
      { name: "Gastroenterology & liver", text: "Endoscopy, liver disease management and nutrition support, with hepatology teams where needed." },
      { name: "Second opinions", text: "A senior specialist reviews your reports and the plan you were given, and tells you plainly what they would recommend." },
    ],
    arrange: [
      "A doctor on our team reads your reports before any hospital is suggested",
      "Video consultation with the specialist before you travel",
      "Tests grouped into as few days as possible",
      "Written summary and prescriptions to take home",
    ],
    notes: [
      { title: "Bring your history", text: "Recent scans on disc, reports and a list of current medicines help the specialist avoid repeating tests." },
      { title: "Length of stay", text: "Diagnostic visits are often short. Your coordinator plans the stay once the specialist has seen your reports." },
    ],
  },
  {
    slug: "surgical",
    name: "Surgical",
    group: "Clinical",
    render: "/editorial/treatments/surgical.webp",
    alt: "A surgical team preparing an operating room",
    summary:
      "Planned operations by experienced surgical teams, from joint replacement to cardiac and transplant surgery.",
    intro:
      "For planned surgery, the questions are always the same: who is the surgeon, what does it cost, and how long until I can fly home. We answer all three in writing before you book a ticket.",
    areas: [
      { name: "Cardiac surgery", text: "Bypass, valve repair and replacement, and minimally invasive procedures where suitable." },
      { name: "Joint replacement", text: "Hip and knee replacement, including revision surgery, with physiotherapy from the first day." },
      { name: "Spine", text: "Disc and decompression surgery, fusion, and non-surgical options assessed first." },
      { name: "Transplant", text: "Kidney and liver transplant programmes, following Indian transplant law on donor eligibility and approvals." },
      { name: "General & laparoscopic", text: "Gallbladder, hernia, bariatric and other keyhole procedures." },
    ],
    arrange: [
      "Surgeon profiles and hospital options to compare",
      "An itemised estimate covering surgery, stay and follow-up",
      "Pre-operative tests scheduled for the day you arrive",
      "Fit-to-fly review before your return flight",
    ],
    notes: [
      { title: "Transplant rules", text: "Living-donor transplants need legal approval in India. We explain the documents early so there are no surprises." },
      { title: "Recovery time", text: "Your surgeon sets the date you can fly. We book your stay to match, with room to extend." },
    ],
  },
  {
    slug: "dental",
    name: "Dental",
    group: "Clinical",
    render: "/editorial/treatments/dental.webp",
    alt: "A dentist examining a patient in a dental chair",
    summary:
      "Implants, smile restoration and full-mouth rehabilitation, often completed within a single trip.",
    intro:
      "Dental work is planned around time. We share your X-rays and photos with the clinic first, so the dentist can tell you how many visits you need and whether it fits into one trip.",
    areas: [
      { name: "Implants", text: "Single and multiple implants, with bone grafting assessed from your scans." },
      { name: "Crowns & veneers", text: "Ceramic crowns and veneers made in partner labs, fitted before you leave." },
      { name: "Full-mouth rehabilitation", text: "Planned restoration of bite and function, staged across one or two visits." },
      { name: "Root canal & oral surgery", text: "Endodontic treatment, extractions and wisdom teeth." },
    ],
    arrange: [
      "Treatment plan from your X-rays before you travel",
      "Appointments packed into the fewest days",
      "Stay near the clinic",
      "Follow-up checks by video after you return",
    ],
    notes: [
      { title: "Two-stage treatment", text: "Some implants need a healing gap between stages. Your dentist will say up front if a second trip is needed." },
    ],
  },
  {
    slug: "rehabilitation",
    name: "Rehabilitation",
    group: "Clinical",
    render: "/editorial/treatments/rehabilitation.webp",
    alt: "A physiotherapist supporting a patient at parallel bars",
    summary:
      "Physiotherapy and recovery programmes after surgery, stroke or injury, built into your stay.",
    intro:
      "Recovery decides how well an operation works. We build rehabilitation into your plan from the start, whether you come for surgery or for rehabilitation alone.",
    areas: [
      { name: "Post-operative physiotherapy", text: "Daily sessions after joint, spine or cardiac surgery, led by the hospital's physiotherapy team." },
      { name: "Neuro rehabilitation", text: "Programmes after stroke, brain injury or spinal cord injury, with speech and occupational therapy." },
      { name: "Sports injury", text: "Assessment and graded return to activity after ligament, tendon and muscle injuries." },
      { name: "Pain management", text: "Multidisciplinary care for long-term back, neck and joint pain." },
    ],
    arrange: [
      "Rehabilitation goals agreed before admission",
      "Accessible stays and transport",
      "Home exercise plan in writing",
      "Teleconsult reviews after you go home",
    ],
    notes: [
      { title: "Bring an attender", text: "Neuro rehabilitation goes better with a family member who learns the exercises too. We arrange their stay as well." },
    ],
  },
  {
    slug: "longevity",
    name: "Longevity",
    group: "Wellness",
    render: "/editorial/treatments/longevity.webp",
    alt: "A clinician measuring a patient's blood pressure",
    summary:
      "Advanced screening and a personal plan to stay healthy for longer, reviewed by physicians.",
    intro:
      "Longevity care starts with an honest picture of your health today. Screening is arranged in a day or two, and a physician goes through every result with you.",
    areas: [
      { name: "Executive health check", text: "Blood work, imaging and specialist consultations completed in one or two days." },
      { name: "Cardiac risk screening", text: "ECG, echocardiogram, stress testing and coronary calcium scoring where indicated." },
      { name: "Cancer screening", text: "Age- and risk-appropriate screening, with follow-up arranged if anything needs attention." },
      { name: "Personal health plan", text: "Nutrition, exercise and follow-up schedule written up by the reviewing physician." },
    ],
    arrange: [
      "Screening package matched to your age and history",
      "Results explained in person, not just emailed",
      "Specialist referral the same week if needed",
      "A written plan to share with your doctor at home",
    ],
    notes: [
      { title: "Fasting tests", text: "Some tests need an early, fasting start. Your coordinator will tell you the evening before." },
    ],
  },
  {
    slug: "holistic-health",
    name: "Holistic health",
    group: "Wellness",
    render: "/editorial/treatments/holistic.webp",
    alt: "A seated group stretching with a yoga instructor",
    summary:
      "Ayurveda, yoga and nutrition programmes for recovery and balance, in calm retreat settings.",
    intro:
      "For recovery, stress or simply rest, India's traditions of Ayurveda and yoga are a reason to travel in their own right. We work with centres that keep medical oversight in place.",
    areas: [
      { name: "Ayurveda", text: "Programmes led by qualified Ayurvedic physicians, including Panchakarma, at centres in Kerala and elsewhere." },
      { name: "Yoga & meditation", text: "Daily practice suited to your fitness and health, from gentle to advanced." },
      { name: "Nutrition", text: "Meal plans for recovery, weight management or long-term conditions." },
      { name: "Recovery retreats", text: "Quiet stays after surgery or treatment, with nursing support available." },
    ],
    arrange: [
      "Centres chosen for qualified staff and medical cover",
      "Programme length planned around your health",
      "Transfers between hospital and retreat",
      "Advice on continuing at home",
    ],
    notes: [
      { title: "Tell us your medicines", text: "Some herbal treatments interact with prescribed drugs. The physician reviews your list before you start." },
    ],
  },
];

export const FAQ: [string, string][] = [
  ["How quickly will I get a treatment plan?", "Usually within 48 hours of receiving your reports. A doctor on our team reviews them and sends hospital options with an itemised estimate."],
  ["Can family members travel with me?", "Yes. Up to two attenders can travel on India's e-Medical Attendant visa. We arrange their visa letters, flights and a stay close to the hospital."],
  ["How do I get a medical visa for India?", "Most nationalities can apply online for the e-Medical visa. Your hospital issues the invitation letter, and we help you complete the application."],
  ["What do NABH and JCI accreditation mean?", "NABH is India's national hospital accreditation. JCI is an international accreditation. Both assess patient safety, infection control and quality of care."],
  ["Will I speak with the doctor before I travel?", "Yes. You can have a video consultation with the treating specialist before you confirm the plan."],
  ["What happens after I go home?", "You leave with your complete medical records and a follow-up schedule, and your specialist continues care through teleconsults."],
  ["What does the estimate include?", "The estimate is itemised: the procedure, hospital stay, tests, medicines and follow-up are listed separately, along with an estimate for accommodation and local travel. If the plan changes, you see the new figure before anything goes ahead."],
  ["How do I pay the hospital?", "Hospital charges are paid to the hospital, usually with a deposit on admission. Your coordinator explains the hospital's accepted payment methods before you travel."],
  ["Will someone speak my language?", "Many hospitals have international patient desks, and we arrange an interpreter when you need one."],
  ["What should I bring?", "Your passport and visa, recent reports and scans, a list of current medicines, and comfortable clothes for the stay. Your coordinator sends a checklist before you fly."],
];
