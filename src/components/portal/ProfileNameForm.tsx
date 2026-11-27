"use client";

import { useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAccountName, maxAccountNameLength } from "@/lib/portal-identity";
import styles from "./access.module.css";

type ProfileNameProps = {
  client: SupabaseClient;
  currentName?: string;
};

export function ProfileNameForm({ client, currentName = "" }: ProfileNameProps) {
  const [draftName, setDraftName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const fullName = String(new FormData(event.currentTarget).get("fullName") ?? "").trim();
    setError("");
    setNotice("");
    if (!fullName) {
      setError("Enter the name you want to use for your account.");
      return;
    }
    setBusy(true);
    try {
      const result = await client.auth.updateUser({ data: { full_name: fullName } });
      if (result.error) throw result.error;
      const savedName = getAccountName(result.data.user);
      if (!savedName) throw new Error("Your name could not be saved. Please try again.");
      setDraftName(null);
      setNotice("Your account name has been saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Your name could not be saved. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.card} aria-labelledby="account-name-heading">
      <h2 id="account-name-heading">{currentName ? "Account name" : "Add your name"}</h2>
      <p>This name appears in your portal when you sign in.</p>
      <form className={styles.form} onSubmit={save} aria-busy={busy}
        onChange={() => { setNotice(""); setError(""); }}>
        <fieldset disabled={busy}>
          <div className="field">
            <label htmlFor="account-name">Full name</label>
            <input id="account-name" name="fullName" type="text" value={draftName ?? currentName}
              onChange={event => setDraftName(event.currentTarget.value)}
              autoComplete="name" maxLength={maxAccountNameLength} required />
          </div>
          <button type="submit" className="btn btn-solid">{busy ? "Saving…" : "Save name"}</button>
        </fieldset>
        {error && <p className={styles.error} role="alert">{error}</p>}
        {notice && <p role="status">{notice}</p>}
      </form>
    </section>
  );
}
