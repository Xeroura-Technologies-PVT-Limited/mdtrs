"use client";

import Link from "next/link";
import { useCallback, useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { workspacePath } from "@/lib/portal-routes";
import { ReportPanel } from "./ReportPanel";
import { displayDate, useIntake, usePortalRead, type Intake } from "./workspace-data";
import styles from "./workspace.module.css";
import patientStyles from "./patient.module.css";

type PatientWorkspaceProps = {
  client: SupabaseClient;
  userId: string;
  section: "overview" | "intake" | "reports";
  initialName?: string;
  onNameSaved?: (name: string) => void;
};

const intakePath = workspacePath({ role: "patient", section: "intake" });
const reportsPath = workspacePath({ role: "patient", section: "reports" });

export function PatientWorkspace({ client, userId, section, initialName, onNameSaved }: PatientWorkspaceProps) {
  const { state, refresh } = useIntake(client, userId);

  if (state.status === "loading") return <p role="status">Loading your intake…</p>;
  if (state.status === "error") return (
    <div className={styles.panel}>
      <p role="alert">Your intake could not be loaded. Check your connection and try again.</p>
      <button type="button" className="btn btn-ghost" onClick={refresh}>Try again</button>
    </div>
  );
  const intake = state.data;
  if (section === "intake") {
    return <IntakeForm client={client} userId={userId} intake={intake} initialName={initialName} onNameSaved={onNameSaved} />;
  }
  if (section === "reports") {
    if (intake) return <ReportPanel client={client} patientId={userId} allowUpload />;
    return (
      <section className={styles.panel} aria-labelledby="reports-heading">
        <header className={styles.sectionHeader}>
          <h2 id="reports-heading">Medical reports</h2>
          <p>Save your intake details before attaching reports for your assigned doctor.</p>
        </header>
        <div className={styles.actions}><Link className="btn btn-solid" href={intakePath}>Complete your intake</Link></div>
      </section>
    );
  }
  return (
    <div className={styles.columns}>
      <section className={styles.panel} aria-labelledby="intake-summary-heading">
        <header className={styles.sectionHeader}>
          <h2 id="intake-summary-heading">Your intake</h2>
          {intake ? <p>Last saved {displayDate(intake.updated_at)}</p>
            : <p>Tell your doctor what care you are seeking and how to reach you.</p>}
        </header>
        {intake && <dl className={styles.details}><div><dt>Care requested</dt><dd className={patientStyles.careSummary}>{intake.care_details}</dd></div></dl>}
        <div className={styles.actions}>
          <Link className="btn btn-solid" href={intakePath}>{intake ? "Edit intake" : "Complete your intake"}</Link>
        </div>
      </section>
      <section className={styles.panel} aria-labelledby="report-summary-heading">
        <header className={styles.sectionHeader}><h2 id="report-summary-heading">Medical reports</h2></header>
        {intake ? <LatestReport client={client} patientId={userId} />
          : <p>Once you have saved your intake, you can share test results, scans and referral letters here.</p>}
        <div className={styles.actions}><Link className="btn btn-ghost" href={reportsPath}>View reports</Link></div>
      </section>
    </div>
  );
}

function LatestReport({ client, patientId }: { client: SupabaseClient; patientId: string }) {
  const read = useCallback(async () => {
    const { data, error } = await client.storage.from("patient-reports").list(patientId, {
      limit: 1, sortBy: { column: "created_at", order: "desc" },
    });
    return { data: data?.[0]?.created_at ?? null, error };
  }, [client, patientId]);
  const { state } = usePortalRead(read);
  if (state.status === "loading") return <p role="status">Loading the latest report…</p>;
  if (state.status === "error") return <p role="alert">Open your reports to retry loading the list.</p>;
  return <p>{state.data ? "Most recent report attached " + displayDate(state.data) : "No reports attached yet."}</p>;
}

type IntakeFormProps = Pick<PatientWorkspaceProps, "client" | "userId" | "onNameSaved" | "initialName"> & { intake: Intake | null };

function IntakeForm({ client, userId, intake, initialName, onNameSaved }: IntakeFormProps) {
  const [lastSaved, setLastSaved] = useState(intake?.updated_at);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const now = new Date();
  const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const values = new FormData(event.currentTarget);
    const get = (key: string) => String(values.get(key) ?? "").trim();
    setMessage("");
    setError("");
    if (!get("full_name") || !get("care_details")) {
      setError("Enter your name and the care you are seeking.");
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await client.from("patient_intakes").upsert({
        patient_id: userId,
        full_name: get("full_name"),
        date_of_birth: get("date_of_birth") || null,
        country: get("country") || null,
        phone: get("phone") || null,
        care_details: get("care_details"),
      }, { onConflict: "patient_id" }).select("updated_at,full_name").single<Pick<Intake, "updated_at" | "full_name">>();
      if (error || !data) throw new Error();
      setLastSaved(data.updated_at);
      setMessage("Your details have been saved.");
      onNameSaved?.(data.full_name);
    } catch {
      setError("Your details could not be saved. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={`${styles.panel} ${patientStyles.intakeForm}`} aria-labelledby="intake-heading">
      <header className={styles.sectionHeader}>
        <h2 id="intake-heading">Your intake</h2>
        <p>Tell your assigned doctor what brings you to Medtours.</p>
      </header>
      <form className="form" onSubmit={save} onChange={() => { setMessage(""); setError(""); }}>
        <fieldset className={styles.inputs} disabled={saving}>
          <div className="field">
            <label htmlFor="intake-name">Full name (required)</label>
            <input id="intake-name" name="full_name" autoComplete="name" maxLength={200} defaultValue={intake?.full_name ?? initialName ?? ""} required />
          </div>
          <div className={styles.pair}>
            <div className="field">
              <label htmlFor="intake-dob">Date of birth (optional)</label>
              <input id="intake-dob" name="date_of_birth" type="date" autoComplete="bday" max={today} defaultValue={intake?.date_of_birth ?? ""} />
            </div>
            <div className="field">
              <label htmlFor="intake-country">Country of residence (optional)</label>
              <input id="intake-country" name="country" autoComplete="country-name" maxLength={120} defaultValue={intake?.country ?? ""} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="intake-phone">Phone number (optional)</label>
            <input id="intake-phone" name="phone" type="tel" autoComplete="tel" maxLength={80} defaultValue={intake?.phone ?? ""} />
          </div>
          <div className="field">
            <label htmlFor="intake-care">What care are you seeking? (required)</label>
            <textarea id="intake-care" name="care_details" rows={6} maxLength={8000} defaultValue={intake?.care_details}
              placeholder="Include any symptoms, diagnoses, current treatment or questions for your doctor." required />
          </div>
        </fieldset>
        <div className={styles.actions}>
          <button className="btn btn-solid" disabled={saving} type="submit">{saving ? "Saving…" : "Save details"}</button>
          {lastSaved && <>
            <Link className="btn btn-ghost" href={reportsPath}>Go to medical reports</Link>
            <span className={styles.meta}>Last saved {displayDate(lastSaved)}</span>
          </>}
        </div>
        {message && <p role="status">{message}</p>}
        {error && <p className={styles.error} role="alert">{error}</p>}
      </form>
    </section>
  );
}
