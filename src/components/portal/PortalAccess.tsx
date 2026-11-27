"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { portalLogins, type PortalRole } from "@/lib/portal-roles";
import { roleSiteNavigation } from "@/lib/portal-site-links";
import { SiteLink } from "@/components/site/SiteLink";
import { loginDestination, workspaceLinks, workspacePath, type WorkspacePage } from "@/lib/portal-routes";
import { AccountForm } from "./AccountForm";
import { DoctorWorkspace } from "./DoctorWorkspace";
import { PatientWorkspace } from "./PatientWorkspace";
import { usePortalSession } from "./PortalSession";
import { ProfileNameForm } from "./ProfileNameForm";
import styles from "./access.module.css";

export function PortalFromQuery() {
  const requestedRole = useSearchParams().get("role");
  const selectedRole = portalLogins.find(login => login.role === requestedRole)?.role ?? null;
  return <PortalAccess selectedRole={selectedRole} />;
}

function PortalRedirect({ role, loginFor }: { role: PortalRole; loginFor?: string }) {
  const router = useRouter();
  useEffect(() => {
    const destination = loginFor
      ? `/login/${role}?next=${encodeURIComponent(loginFor)}`
      : loginDestination(role, new URLSearchParams(window.location.search).get("next"));
    router.replace(destination);
  }, [router, role, loginFor]);
  return <p role="status">{loginFor ? "Opening your login page…" : "Opening your workspace…"}</p>;
}

export function PortalAccess({ selectedRole, page }: { selectedRole: PortalRole | null; page?: WorkspacePage }) {
  const session = usePortalSession();
  const { client, user, role } = session;
  let content;
  if (user === undefined) {
    content = <p role="status">Opening the care portal…</p>;
  } else if (!user || !client) {
    content = page ? <PortalRedirect role={page.role} loginFor={workspacePath(page)} />
      : <AccountForm client={client} role={selectedRole} linkError={session.linkError} />;
  } else if (session.choosePassword) {
    content = <ChoosePassword client={client} onSaved={session.passwordSaved} />;
  } else if (!role) {
    content = session.roleLoading ? <p role="status">Loading your account…</p>
      : <section className={styles.card}>
          <h1>Care portal</h1>
          <p role="alert">We couldn’t load your portal access. Try again or sign out.</p>
          <button type="button" className="btn btn-ghost" onClick={session.refreshRole}>Try again</button>
          <SignOutButton />
        </section>;
  } else if (selectedRole && selectedRole !== role) {
    content = <section className={styles.card} aria-labelledby="account-portal-heading">
      <h1 id="account-portal-heading">Choose your portal</h1>
      <p role="status">You’re signed in as <strong>{session.name || user.email}</strong> with a {role} account.</p>
      <Link className="btn btn-solid" href={`/portal/${role}`}>Continue to {role} portal</Link>
      <SignOutButton />
    </section>;
  } else if (!page) {
    content = <PortalRedirect role={role} />;
  } else {
    const title = role === "doctor" ? "Doctor portal" : "Patient portal";
    const active = page.section === "patient" ? "/portal/doctor/patients" : workspacePath(page);
    content = <>
      <header className={styles.accountHeader}>
        <div>
          <h1>{title}</h1>
          <p>Signed in as <strong>{session.name || user.email}</strong>
            {!session.name && page.section !== "account" && <> · <Link href={`/portal/${role}/account`}>Add your name</Link></>}
          </p>
        </div>
        <SignOutButton />
      </header>
      <nav aria-label={title + " navigation"} className={styles.workspaceNav}>
        {workspaceLinks(role).map(item => <Link key={item.href} href={item.href}
          aria-current={active === item.href ? page.section === "patient" ? "location" : "page" : undefined}>
          {item.label}
        </Link>)}
      </nav>
      {page.section === "account" ? <>
        <p className={styles.accountEmail}>Account email <strong>{user.email}</strong></p>
        <ProfileNameForm client={client} currentName={session.name} />
      </> : page.role === "patient"
        ? <PatientWorkspace key={user.id + page.section} client={client} userId={user.id} section={page.section}
            initialName={session.name} onNameSaved={session.rememberIntakeName} />
        : <DoctorWorkspace key={user.id + workspacePath(page)} client={client} section={page.section}
            patientId={page.section === "patient" ? page.patientId : undefined} />}
      {page.section === "overview" && (
        <nav className={styles.siteGuides} aria-labelledby="site-guides-heading">
          <h2 id="site-guides-heading">{role === "doctor" ? "Clinical team and care guides" : "Plan your care and travel"}</h2>
          <ul>{roleSiteNavigation(role).map(item => (
            <li key={item.href}>
              <SiteLink href={item.href}>
                <strong>{item.label}</strong><span aria-hidden="true">→</span>
                <small>{item.description}</small>
              </SiteLink>
            </li>
          ))}</ul>
        </nav>
      )}
    </>;
  }
  return <div className={styles.page}><div className={styles.wrap}>{content}</div></div>;
}

function SignOutButton() {
  const { signOut, signingOut, signOutError } = usePortalSession();
  return <div>
    <button type="button" className="btn btn-ghost" disabled={signingOut} onClick={signOut}>
      {signingOut ? "Signing out…" : "Sign out"}
    </button>
    {signOutError && <p role="alert" className={styles.error}>Sign-out failed. Check your connection and try again.</p>}
  </div>;
}

function ChoosePassword({ client, onSaved }: { client: SupabaseClient; onSaved: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const password = String(new FormData(event.currentTarget).get("password") ?? "");
    setError("");
    setBusy(true);
    try {
      const { error } = await client.auth.updateUser({ password });
      if (error) throw error;
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Your password could not be saved. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className={styles.card} aria-labelledby="set-password-heading">
      <h1 id="set-password-heading">Choose a password</h1>
      <form onSubmit={save} className={styles.form}>
        <fieldset disabled={busy}>
          <div className="field">
            <label htmlFor="portal-new-password">New password</label>
            <input id="portal-new-password" name="password" type="password" minLength={8} autoComplete="new-password" required />
            <small>Use at least 8 characters.</small>
          </div>
          <button className="btn btn-solid" type="submit">{busy ? "Saving…" : "Save password"}</button>
        </fieldset>
        {error && <p role="alert" className={styles.error}>{error}</p>}
      </form>
      <SignOutButton />
    </section>
  );
}
