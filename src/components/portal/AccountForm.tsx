"use client";

import { useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SiteLink } from "@/components/site/SiteLink";
import { maxAccountNameLength } from "@/lib/portal-identity";
import { portalLogins, type PortalRole } from "@/lib/portal-roles";
import styles from "./access.module.css";

type Mode = "signin" | "signup" | "reset";

const actions = { signin: "Sign in", signup: "Create account", reset: "Send reset link" };

type EntryProps = { client: SupabaseClient | null; linkError: boolean };

export function AccountForm({ client, role, linkError }: EntryProps & { role: PortalRole | null }) {
  return (
    <div className={styles.access}>
      <div className={styles.intro} data-role={role}>
        <h1>{role === "doctor" ? "Doctor login" : role === "patient" ? "Patient login" : "Care portal"}</h1>
        {role === "patient" && <p>Share your intake details and medical reports with your assigned doctor.</p>}
        {role === "doctor" && <p>Review intake details and medical reports for your assigned patients.</p>}
      </div>
      {role ? <CredentialsForm key={role} role={role} client={client} linkError={linkError} />
        : <section className={styles.card} aria-labelledby="login-type-heading">
            <h2 id="login-type-heading">Choose your login</h2>
            {linkError && <p role="alert" className={styles.error}>This email link could not be opened. Choose your login to sign in or request a new link.</p>}
            <div className={styles.choices}>
              {portalLogins.map(login => <SiteLink key={login.role} href={login.href} className="btn btn-ghost">{login.label}</SiteLink>)}
            </div>
          </section>}
    </div>
  );
}

function CredentialsForm({ client, role, linkError }: EntryProps & { role: PortalRole }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [dismissedLinkError, setDismissedLinkError] = useState(false);

  function switchTo(next: Mode) {
    setMode(next);
    setError("");
    setNotice("");
    setDismissedLinkError(true);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!client || busy) return;
    const fields = new FormData(event.currentTarget);
    const password = String(fields.get("password") ?? "");
    const credentials = { email: email.trim(), password };
    const redirectTo = new URL("/portal", window.location.origin).href;
    setError("");
    setNotice("");
    setDismissedLinkError(true);
    setBusy(true);
    try {
      if (mode === "reset") {
        const { error } = await client.auth.resetPasswordForEmail(credentials.email, { redirectTo });
        if (error) throw error;
        switchTo("signin");
        setNotice("If your account uses this email, you’ll receive a link to choose a new password.");
      } else if (mode === "signup") {
        const fullName = String(fields.get("fullName") ?? "").trim();
        if (!fullName) throw new Error("Enter your full name to create an account.");
        const { data, error } = await client.auth.signUp({
          ...credentials,
          options: { emailRedirectTo: redirectTo, data: { full_name: fullName } },
        });
        if (error) throw error;
        if (!data.session) {
          switchTo("signin");
          setNotice("Check your email for a confirmation link. If you already have an account, sign in below.");
        }
      } else {
        const { error } = await client.auth.signInWithPassword(credentials);
        if (error) throw error;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn’t reach your account. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.card} aria-labelledby="access-heading">
      <h2 id="access-heading">{mode === "signup" ? "Create a patient account" : mode === "reset" ? "Reset your password" : "Sign in"}</h2>
      {mode === "signup" && <p>Use an email address you can access to confirm your account.</p>}
      {mode === "reset" && <p>Enter your account email to request a password reset link.</p>}
      {!client && <p role="status" className={styles.notice}>The care portal is temporarily unavailable. <SiteLink href="/contact">Contact Medtours</SiteLink> for assistance.</p>}
      {linkError && !dismissedLinkError && <p role="alert" className={styles.error}>This email link could not be opened. Sign in or request a new link.</p>}
      {notice && <p role="status" className={styles.notice}>{notice}</p>}
      <form onSubmit={submit} className={styles.form} aria-busy={busy}>
        <fieldset disabled={busy || !client}>
          {mode === "signup" && (
            <div className="field">
              <label htmlFor="portal-signup-name">Full name</label>
              <input id="portal-signup-name" name="fullName" type="text" autoComplete="name" maxLength={maxAccountNameLength} required />
            </div>
          )}
          <div className="field">
            <label htmlFor="portal-email">Email address</label>
            <input id="portal-email" name="email" type="email" autoComplete="email" value={email}
              onChange={event => setEmail(event.target.value)} required />
          </div>
          {mode !== "reset" && (
            <div className="field">
              <label htmlFor="portal-password">Password</label>
              <input key={mode} id="portal-password" name="password" type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                minLength={mode === "signup" ? 8 : undefined} required />
              {mode === "signup" && <small>Use at least 8 characters.</small>}
            </div>
          )}
          <button type="submit" className="btn btn-solid">{busy ? "Please wait…" : actions[mode]}</button>
        </fieldset>
        {error && <p role="alert" className={styles.error}>{error}</p>}
      </form>
      <div className={styles.links}>
        {mode === "signin" ? <>
          {role === "patient" && <button type="button" disabled={busy} onClick={() => switchTo("signup")}>Create a patient account</button>}
          <button type="button" disabled={busy} onClick={() => switchTo("reset")}>Forgot password?</button>
        </> : <button type="button" disabled={busy} onClick={() => switchTo("signin")}>Back to sign in</button>}
      </div>
      <SiteLink href="/portal" className={styles.changeLogin}>Change login type</SiteLink>
    </section>
  );
}
