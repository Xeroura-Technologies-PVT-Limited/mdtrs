"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ReportPanel } from "./ReportPanel";
import { displayDate, useIntake, usePortalRead, type Intake } from "./workspace-data";
import styles from "./workspace.module.css";

const PAGE_SIZE = 15;
const DIRECTORY_PATH = "/portal/doctor/patients";
type PatientSummary = Pick<Intake, "patient_id" | "full_name" | "date_of_birth" | "country">;
type RecentIntake = Pick<Intake, "patient_id" | "full_name" | "updated_at">;

type DoctorWorkspaceProps = {
  client: SupabaseClient;
  section: "overview" | "patients" | "patient";
  patientId?: string;
};

export function DoctorWorkspace({ client, section, patientId }: DoctorWorkspaceProps) {
  const requestedPage = Number(useSearchParams().get("page"));
  const page = Number.isSafeInteger(requestedPage) && requestedPage >= 1 ? requestedPage - 1 : 0;
  if (section === "overview") return <DoctorOverview client={client} />;
  if (section === "patients") return <AssignedPatients client={client} page={page} />;
  return (
    <div className={styles.stack}>
      <div><Link className="btn btn-ghost" href={DIRECTORY_PATH + pageQuery(page)}>Back to assigned patients</Link></div>
      {patientId ? <PatientReview key={patientId} client={client} patientId={patientId} /> : <p role="alert">This patient record is unavailable.</p>}
    </div>
  );
}

function pageQuery(page: number) {
  return page > 0 ? `?page=${page + 1}` : "";
}

function ReviewLink({ patient, page = 0 }: { patient: Pick<Intake, "patient_id" | "full_name">; page?: number }) {
  return <Link className="btn btn-ghost" href={`${DIRECTORY_PATH}/${patient.patient_id}${pageQuery(page)}`}
    aria-label={"Review intake for " + patient.full_name}>Review intake</Link>;
}

function DoctorOverview({ client }: { client: SupabaseClient }) {
  const readRecent = useCallback(async (signal: AbortSignal) => {
    const { data, count, error } = await client.from("patient_intakes")
      .select("patient_id,full_name,updated_at", { count: "exact" })
      .order("updated_at", { ascending: false }).order("patient_id")
      .limit(5).abortSignal(signal).returns<RecentIntake[]>();
    return { data: { recent: data ?? [], count }, error };
  }, [client]);
  const { state, refresh } = usePortalRead(readRecent);
  const summary = state.status === "ready" ? state.data : null;

  return (
    <section className={styles.panel} aria-labelledby="recent-intakes-heading">
      <header className={styles.sectionHeader}>
        <h2 id="recent-intakes-heading">Recently updated intakes</h2>
        {summary?.count != null && summary.count > 0 && (
          <p>{summary.count === 1 ? "1 assigned patient has a saved intake." : `${summary.count} assigned patients have saved intakes.`}</p>
        )}
      </header>
      {state.status === "loading" && <p role="status">Loading recent intakes…</p>}
      {state.status === "error" && <p className={styles.error} role="alert">Recent intakes could not be loaded.</p>}
      {summary && (summary.recent.length
        ? <ul className={styles.list}>{summary.recent.map(patient => (
            <li key={patient.patient_id}>
              <div><strong>{patient.full_name}</strong><span className={styles.meta}>Updated {displayDate(patient.updated_at)}</span></div>
              <ReviewLink patient={patient} />
            </li>
          ))}</ul>
        : <p className={styles.empty}>Intakes will appear here when your assigned patients save their details.</p>)}
      <div className={styles.actions}>
        <Link className="btn btn-solid" href={DIRECTORY_PATH}>View assigned patients</Link>
        {state.status === "error" && <button type="button" className={styles.textButton} onClick={refresh}>Try again</button>}
      </div>
    </section>
  );
}

function AssignedPatients({ client, page }: { client: SupabaseClient; page: number }) {
  const readPatients = useCallback((signal: AbortSignal) => client.from("patient_intakes")
    .select("patient_id,full_name,date_of_birth,country")
    .order("full_name").order("patient_id")
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
    .abortSignal(signal).returns<PatientSummary[]>(), [client, page]);
  const { state, refresh } = usePortalRead(readPatients);
  const patients = state.status === "ready" ? state.data ?? [] : [];

  return (
    <section className={styles.panel} aria-labelledby="patients-heading">
      <header className={styles.sectionHeader}>
        <h2 id="patients-heading">Assigned patients</h2>
        <p>Select a patient to review their intake and medical reports.</p>
      </header>
      {state.status === "loading" && <p role="status">Loading assigned patients…</p>}
      {state.status === "error" && <p className={styles.error} role="alert">Your patient list could not be loaded. Refresh the list to try again.</p>}
      {state.status === "ready" && (patients.length
        ? <ul className={styles.list}>{patients.slice(0, PAGE_SIZE).map(patient => (
          <li key={patient.patient_id}>
            <div>
              <strong>{patient.full_name}</strong>
              <span className={styles.meta}>{[
                patient.date_of_birth && "Born " + displayDate(patient.date_of_birth),
                patient.country,
                "Ref. " + patient.patient_id.slice(0, 8),
              ].filter(Boolean).join(" · ")}</span>
            </div>
            <ReviewLink patient={patient} page={page} />
          </li>
        ))}</ul>
        : <p className={styles.empty}>{page ? "No more patients on this page." : "Your assigned patients will appear here when they save their intake details."}</p>)}
      <div className={styles.actions}>
        {page > 0 && <Link className={styles.textButton} href={DIRECTORY_PATH + pageQuery(page - 1)} scroll={false}>Previous patients</Link>}
        {patients.length > PAGE_SIZE && <Link className={styles.textButton} href={DIRECTORY_PATH + pageQuery(page + 1)} scroll={false}>Next patients</Link>}
        {state.status !== "loading" && <button type="button" className={styles.textButton} onClick={refresh}>Refresh patient list</button>}
      </div>
    </section>
  );
}

function PatientReview({ client, patientId }: { client: SupabaseClient; patientId: string }) {
  const { state, refresh } = useIntake(client, patientId);
  if (state.status === "loading") return <p role="status">Loading patient details…</p>;
  if (state.status === "error") return (
    <div className={styles.panel}>
      <p role="alert">This patient's intake could not be opened. Check your connection or return to your assigned patients.</p>
      <button type="button" className="btn btn-ghost" onClick={refresh}>Try again</button>
    </div>
  );
  if (!state.data) return <p className={styles.panel} role="status">This patient record is unavailable.</p>;
  const intake = state.data;
  return (
    <div className={styles.columns}>
      <section className={styles.panel} aria-labelledby="patient-heading">
        <header className={styles.sectionHeader}>
          <h2 id="patient-heading">{intake.full_name}</h2>
          <p>Intake updated {displayDate(intake.updated_at)}</p>
        </header>
        <dl className={styles.details}>
          <div><dt>Date of birth</dt><dd>{intake.date_of_birth ? displayDate(intake.date_of_birth) : "Not provided"}</dd></div>
          <div><dt>Country of residence</dt><dd>{intake.country || "Not provided"}</dd></div>
          <div><dt>Phone number</dt><dd>{intake.phone || "Not provided"}</dd></div>
          <div><dt>Care requested</dt><dd>{intake.care_details}</dd></div>
        </dl>
      </section>
      <ReportPanel client={client} patientId={patientId} />
    </div>
  );
}
