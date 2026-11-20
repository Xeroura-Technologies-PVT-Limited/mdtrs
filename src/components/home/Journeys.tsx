"use client";

import { useEffect, useState } from "react";

const support = {
  patient: {
    note: "Your treatment, planned with a doctor, from the first report to your last follow-up.",
    services: [
      ["Plan", "Treatment planning", "A doctor reviews your reports and recommends the hospital, specialist and dates that suit you."],
      ["Decide", "Second opinions", "Hear from a senior specialist before you commit, by video, at no pressure."],
      ["Travel", "Medical visa assistance", "The hospital invitation letter and step-by-step help with India's e-Medical visa."],
      ["Heal", "Post-op recovery", "Physiotherapy, follow-up visits, and teleconsults with your surgeon after you return home."],
    ],
  },
  attender: {
    note: "For family and friends who travel with a patient: everything around the hospital, taken care of.",
    services: [
      ["Arrive", "Travel logistics", "Flights, airport pickup and the attender visa, arranged together with the patient's."],
      ["Stay", "Accommodation", "Comfortable rooms close to the hospital, sized to the length of treatment."],
      ["Settle", "Local concierge", "A local SIM, currency, meals, transport and an interpreter whenever you need one."],
      ["Rest", "Hospitality care", "Daily updates from the care team, a quiet place to rest, and someone to call any time."],
    ],
  },
};

export function Journeys() {
  const [role, setRole] = useState<keyof typeof support>("patient");
  useEffect(() => {
    if (document.documentElement.dataset.persona === "attender") setRole("attender");
  }, []);

  function selectRole(next: keyof typeof support) {
    document.documentElement.dataset.persona = next;
    setRole(next);
  }

  return (
    <section id="journeys" className="atlas-journeys" aria-labelledby="support-title">
      <div className="wrap support-grid">
        <div className="support-pane">
          <p className="eyebrow">Two journeys, one team</p>
          <div className="support-toggle" role="group" aria-label="Choose a journey">
            {(["patient", "attender"] as const).map((option) => (
              <button key={option} type="button" aria-pressed={role === option} aria-controls="support-panel" onClick={() => selectRole(option)}>
                The {option}
              </button>
            ))}
          </div>
          <h2 id="support-title" aria-live="polite">For the <em>{role}</em></h2>
          <p className="lead">{support[role].note}</p>
          <button type="button" className="btn btn-solid" data-open="enquire">Plan Your Medical Journey <span aria-hidden="true">↗</span></button>
        </div>
        <ul id="support-panel" className="support-steps" key={role}>
          {support[role].services.map(([label, title, copy]) => (
            <li key={title}><span className="atlas-meta">{label}</span><div><h3>{title}</h3><p>{copy}</p></div></li>
          ))}
        </ul>
      </div>
    </section>
  );
}
