"use client";

import { useEffect } from "react";
import { initPremium } from "@/lib/premium/motion";

/** Boots the premium homepage motion engine and tears it down on navigation. */
export function PremiumMotion() {
  useEffect(() => {
    const root = document.getElementById("pm-home");
    if (!root) return;
    return initPremium(root);
  }, []);
  return <div className="pm-progress" aria-hidden="true"><i /></div>;
}
