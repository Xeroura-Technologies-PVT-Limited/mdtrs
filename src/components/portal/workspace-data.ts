"use client";

import { useCallback, useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

export type Intake = {
  patient_id: string;
  full_name: string;
  date_of_birth: string | null;
  country: string | null;
  phone: string | null;
  care_details: string;
  updated_at: string;
};

type Result<T> = { data: T | null; error: unknown };
type Read<T> = (signal: AbortSignal) => PromiseLike<Result<T>>;
type Loaded<T> = { status: "ready"; data: T | null } | { status: "error" };

export function usePortalRead<T>(read: Read<T>) {
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<{ read: Read<T>; version: number; value: Loaded<T> }>();

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      let value: Loaded<T>;
      try {
        const response = await read(controller.signal);
        value = response.error ? { status: "error" } : { status: "ready", data: response.data };
      } catch {
        value = { status: "error" };
      }
      if (!controller.signal.aborted) setResult({ read, version, value });
    }
    void load();
    return () => controller.abort();
  }, [read, version]);

  const state = result?.read === read && result.version === version ? result.value : { status: "loading" as const };
  const refresh = useCallback(() => setVersion(value => value + 1), []);
  return { state, refresh };
}

export function useIntake(client: SupabaseClient, patientId: string) {
  const read = useCallback((signal: AbortSignal) => client.from("patient_intakes")
    .select("patient_id,full_name,date_of_birth,country,phone,care_details,updated_at")
    .eq("patient_id", patientId).abortSignal(signal).maybeSingle<Intake>(), [client, patientId]);
  return usePortalRead(read);
}

export function displayDate(value: string) {
  // Birth dates are calendar dates and must stay the same in every time zone.
  const date = new Date(value.length === 10 ? value + "T00:00:00" : value);
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
