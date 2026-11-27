"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { displayDate, usePortalRead } from "./workspace-data";
import styles from "./workspace.module.css";

const BUCKET = "patient-reports";
const PAGE_SIZE = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const CONTENT_TYPES: Record<string, string> = { pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png" };

type Pending = { file: File; leaf: string; contentType: string };
type Report = { id: string; name: string; created_at: string };
type Props = { client: SupabaseClient; patientId: string; allowUpload?: boolean };

function prepareFile(file: File): Pending {
  const dot = file.name.lastIndexOf(".");
  const extension = dot > -1 ? file.name.slice(dot + 1).toLowerCase() : "";
  const contentType = CONTENT_TYPES[extension];
  if (!Object.hasOwn(CONTENT_TYPES, extension) || (file.type && file.type !== contentType)) {
    throw new Error(`Choose a PDF, JPG or PNG file for “${file.name}”.`);
  }
  if (file.size === 0 || file.size > MAX_FILE_SIZE) {
    throw new Error(`“${file.name}” must be a nonempty file of 10 MB or less.`);
  }
  const stem = file.name.slice(0, dot).normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^[-_]+|[-_]+$/g, "") || "report";
  const filename = stem.slice(0, 149 - extension.length) + "." + extension;
  return { file, leaf: crypto.randomUUID() + "--" + filename, contentType };
}

function originalName(leaf: string) {
  const divider = leaf.indexOf("--");
  return divider < 0 ? leaf : leaf.slice(divider + 2);
}

export function ReportPanel({ client, patientId, allowUpload = false }: Props) {
  const [page, setPage] = useState(0);
  const [pending, setPending] = useState<Pending[]>([]);
  const [uploading, setUploading] = useState(false);
  const [download, setDownload] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const mounted = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const readReports = useCallback(async () => {
    const { data, error } = await client.storage.from(BUCKET).list(patientId, {
      offset: page * PAGE_SIZE, limit: PAGE_SIZE + 1, sortBy: { column: "created_at", order: "desc" },
    });
    const files = data?.flatMap(({ id, name, created_at }) => id && created_at ? [{ id, name, created_at }] : []);
    return { data: files ?? null, error };
  }, [client, patientId, page]);
  const { state, refresh } = usePortalRead<Report[]>(readReports);

  function choose(event: ChangeEvent<HTMLInputElement>) {
    setError("");
    setNotice("");
    try {
      setPending(Array.from(event.currentTarget.files ?? []).map(prepareFile));
    } catch (err) {
      setPending([]);
      event.currentTarget.value = "";
      setError(err instanceof Error ? err.message : "The selected files could not be attached.");
    }
  }

  async function upload() {
    if (uploading || !pending.length) return;
    setUploading(true);
    setError("");
    setNotice("");
    const bucket = client.storage.from(BUCKET);
    const failed: Pending[] = [];
    for (const item of pending) {
      if (!mounted.current) return;
      try {
        const body = item.file.type ? item.file : item.file.slice(0, item.file.size, item.contentType);
        const { error } = await bucket.upload(patientId + "/" + item.leaf, body, {
          upsert: false, cacheControl: "0", contentType: item.contentType,
        });
        if (error) {
          // A lost response can leave a completed upload. Keep the same object key on retry.
          const { data } = await bucket.list(patientId, { search: item.leaf, limit: 1 });
          if (!data?.some(object => object.name === item.leaf)) failed.push(item);
        }
      } catch {
        failed.push(item);
      }
    }
    if (!mounted.current) return;
    const completed = pending.length - failed.length;
    if (completed) setNotice(completed === 1 ? "1 report attached." : `${completed} reports attached.`);
    if (failed.length) setError("Could not attach " + failed.map(item => "“" + item.file.name + "”").join(", ") + ". Try attaching these files again.");
    setPending(failed);
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
    setPage(0);
    refresh();
  }

  async function downloadReport(report: Report) {
    if (download) return;
    setDownload(report.id);
    setError("");
    try {
      const { data, error } = await client.storage.from(BUCKET).download(patientId + "/" + report.name);
      if (error || !data) throw new Error();
      if (!mounted.current) return;
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = originalName(report.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      if (mounted.current) setError("This report could not be downloaded. Refresh the list and try again.");
    } finally {
      if (mounted.current) setDownload("");
    }
  }

  const reports = state.status === "ready" ? state.data ?? [] : [];
  return (
    <section className={styles.panel} aria-labelledby="reports-heading">
      <header className={styles.sectionHeader}>
        <h2 id="reports-heading">Medical reports</h2>
        {allowUpload && <p>Attach test results, scans or referral letters for your assigned doctor.</p>}
      </header>
      {allowUpload && <div className={styles.upload}>
        <div className="field">
          <label htmlFor="report-files">Choose reports</label>
          <input ref={fileInput} id="report-files" type="file" accept=".pdf,.jpg,.jpeg,.png" multiple disabled={uploading}
            aria-describedby="report-formats" onChange={choose} />
          <p id="report-formats" className={styles.meta}>PDF, JPG or PNG · Up to 10 MB per file</p>
        </div>
        <button type="button" className="btn btn-solid" onClick={upload} disabled={uploading || !pending.length}>
          {uploading ? "Attaching…" : pending.length > 1 ? `Attach ${pending.length} reports` : "Attach report"}
        </button>
      </div>}
      {notice && <p role="status">{notice}</p>}
      {error && <p className={styles.error} role="alert">{error}</p>}
      {state.status === "loading" && <p role="status">Loading reports…</p>}
      {state.status === "error" && <p role="alert">The report list could not be loaded.</p>}
      {state.status === "ready" && (reports.length
        ? <ul className={styles.list}>{reports.slice(0, PAGE_SIZE).map(report => (
            <li key={report.id}>
              <div><strong>{originalName(report.name)}</strong><span className={styles.meta}>Attached {displayDate(report.created_at)}</span></div>
              <button type="button" className={styles.textButton} onClick={() => downloadReport(report)}
                aria-label={"Download " + originalName(report.name)} disabled={Boolean(download)}>
                {download === report.id ? "Downloading…" : "Download"}
              </button>
            </li>
          ))}</ul>
        : <p className={styles.empty}>{page ? "No more reports." : "No reports attached yet."}</p>)}
      <div className={styles.actions}>
        {page > 0 && <button type="button" className={styles.textButton} onClick={() => setPage(page - 1)}>Previous reports</button>}
        {reports.length > PAGE_SIZE && <button type="button" className={styles.textButton} onClick={() => setPage(page + 1)}>Next reports</button>}
        {state.status !== "loading" && <button type="button" className={styles.textButton} onClick={refresh}>Refresh reports</button>}
      </div>
    </section>
  );
}
