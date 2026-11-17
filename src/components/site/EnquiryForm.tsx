"use client";

import { useEffect, useRef, useState } from "react";
import { SITE } from "@/lib/site";

const CARE = ["Not sure yet", "Medical", "Surgical", "Dental", "Rehabilitation", "Longevity", "Holistic health", "Second opinion"];

type Status = "idle" | "sending" | "sent" | "error";

export function EnquiryForm({
  idPrefix = "f",
  autoFocus = false,
  defaultRole = "patient",
  defaultCare,
  onDone,
}: {
  idPrefix?: string;
  autoFocus?: boolean;
  defaultRole?: "patient" | "attender";
  defaultCare?: string;
  onDone?: () => void;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const id = (k: string) => `${idPrefix}-${k}`;

  useEffect(() => {
    if (autoFocus) setTimeout(() => nameRef.current?.focus(), 60);
  }, [autoFocus]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const miss: string[] = [];
    if (!String(data.get("name") || "").trim()) miss.push("your name");
    if (!String(data.get("country") || "").trim()) miss.push("your country");
    if (!String(data.get("phone") || "").trim()) miss.push("a phone number");
    if (miss.length) return setError(`Please add ${miss.join(", ")} so we can reach you.`);
    if (!data.get("consent")) return setError("Please tick the consent box so we can contact you.");
    setError(null);
    setStatus("sending");
    try {
      const res = await fetch("/api/enquiry", { method: "POST", body: data });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Something went wrong.");
      setStatus("sent");
      form.reset();
    } catch (err) {
      setStatus("error");
      setError(
        `${err instanceof Error ? err.message : "We couldn't send your enquiry."} You can also reach us on WhatsApp or by phone at ${SITE.phone}.`,
      );
    }
  }

  if (status === "sent") {
    return (
      <div className="ok" role="status">
        <div className="tick">
          <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
            <path d="M6 13l5 5 9-10" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
        <h3>Thank you</h3>
        <p className="muted">
          Your enquiry has reached our team. A coordinator will reply by phone or WhatsApp, usually within one working day.
        </p>
        {onDone && (
          <button className="btn btn-ghost" type="button" onClick={onDone}>
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <form className="form" noValidate onSubmit={onSubmit}>
      <fieldset className="field">
        <legend>I am</legend>
        <div className="seg">
          <label>
            <input type="radio" name="role" id={id("patient")} value="patient" defaultChecked={defaultRole === "patient"} /> The patient
          </label>
          <label>
            <input type="radio" name="role" id={id("attender")} value="attender" defaultChecked={defaultRole === "attender"} /> An attender
          </label>
        </div>
      </fieldset>
      <div className="two">
        <div className="field">
          <label htmlFor={id("name")}>Full name</label>
          <input ref={nameRef} id={id("name")} name="name" autoComplete="name" />
        </div>
        <div className="field">
          <label htmlFor={id("country")}>Country</label>
          <input id={id("country")} name="country" autoComplete="country-name" placeholder="e.g. Kenya" />
        </div>
      </div>
      <div className="two">
        <div className="field">
          <label htmlFor={id("phone")}>Phone or WhatsApp</label>
          <input id={id("phone")} name="phone" type="tel" autoComplete="tel" placeholder="+254 …" />
        </div>
        <div className="field">
          <label htmlFor={id("care")}>Care needed</label>
          <select id={id("care")} name="care" defaultValue={defaultCare && CARE.includes(defaultCare) ? defaultCare : CARE[0]}>
            {CARE.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="field">
        <label htmlFor={id("email")}>Email (optional)</label>
        <input id={id("email")} name="email" type="email" autoComplete="email" />
      </div>
      <div className="field">
        <label htmlFor={id("msg")}>About the condition</label>
        <textarea id={id("msg")} name="message" rows={3} placeholder="Diagnosis, current treatment, when you hope to travel" />
      </div>
      <div className="field">
        <label htmlFor={id("files")}>Medical reports (optional, up to 10 MB)</label>
        <input id={id("files")} name="files" type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.heic,.doc,.docx" />
      </div>
      <label className="consent">
        <input type="checkbox" name="consent" value="yes" /> I agree that Medtours may contact me about this enquiry and keep my details securely, as described in the privacy notice.
      </label>
      {error && (
        <p className="err" role="alert">
          {error}
        </p>
      )}
      <button className="btn btn-solid" type="submit" style={{ justifyContent: "center" }} disabled={status === "sending"}>
        <span className="dot" />
        {status === "sending" ? "Sending…" : "Get a Treatment Quote"}
      </button>
    </form>
  );
}
