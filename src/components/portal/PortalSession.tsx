"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getAccountName } from "@/lib/portal-identity";
import { portalLogins, type PortalRole } from "@/lib/portal-roles";
import { usePortalRead } from "./workspace-data";

type Session = {
  client: SupabaseClient | null;
  user: User | null | undefined;
  role: PortalRole | null;
  roleLoading: boolean;
  refreshRole: () => void;
  name: string;
  rememberIntakeName: (name: string) => void;
  choosePassword: boolean;
  passwordSaved: () => void;
  linkError: boolean;
  signingOut: boolean;
  signOutError: boolean;
  signOut: () => Promise<boolean>;
};

const SessionContext = createContext<Session | null>(null);

export function usePortalSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error("PortalSessionProvider is missing");
  return session;
}

export function PortalSessionProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<SupabaseClient | null>(null);
  const [user, setUser] = useState<User | null>();
  const [passwordUser, setPasswordUser] = useState("");
  const [linkError, setLinkError] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState(false);
  const [savedIntakeName, setSavedIntakeName] = useState<{ id: string; name: string } | null>(null);
  const userId = user?.id;
  const accountName = getAccountName(user);

  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    let invite = fragment.get("type") === "invite" && fragment.has("access_token");
    let active = true;
    let unsubscribe: (() => void) | undefined;
    async function initialize() {
      const { getPortalClient } = await import("@/lib/portal-client");
      if (!active) return;
      const supabase = getPortalClient();
      setClient(supabase);
      if (!supabase) { setUser(null); return; }
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (!active) return;
        const current = session?.user ?? null;
        if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && invite)) {
          invite = false;
          setPasswordUser(current?.id ?? "");
        }
        if (!current) { setPasswordUser(""); setSavedIntakeName(null); }
        if (event === "SIGNED_IN" || event === "SIGNED_OUT") setSignOutError(false);
        setUser(current);
      });
      unsubscribe = () => subscription.unsubscribe();
      const { error } = await supabase.auth.initialize();
      if (active && error) { invite = false; setLinkError(true); }
    }
    void initialize().catch(() => { if (active) { setClient(null); setUser(null); } });
    return () => { active = false; unsubscribe?.(); };
  }, []);

  const readProfile = useCallback(async (signal: AbortSignal) => {
    if (!client || !userId) return { data: null, error: null };
    return client.from("profiles").select("role").eq("id", userId).abortSignal(signal).single<{ role: string }>();
  }, [client, userId]);
  const profile = usePortalRead(readProfile);
  const storedRole = profile.state.status === "ready" ? profile.state.data?.role : null;
  const role = portalLogins.find(login => login.role === storedRole)?.role ?? null;

  // Older patients may have provided their name only on the original intake form.
  const readLegacyName = useCallback(async (signal: AbortSignal) => {
    if (!client || !userId || role !== "patient" || accountName) return { data: null, error: null };
    return client.from("patient_intakes").select("full_name").eq("patient_id", userId)
      .abortSignal(signal).maybeSingle<{ full_name: string }>();
  }, [client, userId, role, accountName]);
  const legacy = usePortalRead(readLegacyName);
  const intakeName = savedIntakeName && savedIntakeName.id === userId ? savedIntakeName.name
    : legacy.state.status === "ready" ? legacy.state.data?.full_name : "";

  async function signOut() {
    if (!client || signingOut) return false;
    setSigningOut(true);
    setSignOutError(false);
    try {
      const { error } = await client.auth.signOut({ scope: "local" });
      if (error) throw error;
      return true;
    } catch {
      setSignOutError(true);
      return false;
    } finally {
      setSigningOut(false);
    }
  }

  return <SessionContext.Provider value={{
    client, user, role, roleLoading: profile.state.status === "loading", refreshRole: profile.refresh,
    name: accountName || intakeName || "",
    rememberIntakeName: name => { if (userId) setSavedIntakeName({ id: userId, name }); },
    choosePassword: !!userId && passwordUser === userId, passwordSaved: () => setPasswordUser(""),
    linkError, signingOut, signOutError, signOut,
  }}>{children}</SessionContext.Provider>;
}
