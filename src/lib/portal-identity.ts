import type { User } from "@supabase/supabase-js";

export const maxAccountNameLength = 200;

export function getAccountName(user: User | null | undefined): string {
  const metadata = user?.user_metadata;
  for (const value of [metadata?.full_name, metadata?.name]) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}
