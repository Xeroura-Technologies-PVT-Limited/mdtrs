"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getLenis } from "@/lib/scroll";
import { EnquiryForm } from "./EnquiryForm";

/** The quote form as a dialog. Any element with [data-open] opens it,
 *  as does a `mt:enquire` window event (used by the slide-to-quote control). */
export function EnquiryModal() {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<"patient" | "attender">("patient");
  const [care, setCare] = useState<string | undefined>();
  const [key, setKey] = useState(0);
  const lastFocus = useRef<HTMLElement | null>(null);

  const show = useCallback((careName?: string) => {
    lastFocus.current = document.activeElement as HTMLElement | null;
    setRole(document.documentElement.dataset.persona === "attender" ? "attender" : "patient");
    setCare(careName);
    setKey((k) => k + 1);
    window.dispatchEvent(new Event("mt:close-menu"));
    setOpen(true);
  }, []);

  const hide = useCallback(() => {
    setOpen(false);
    lastFocus.current?.focus?.();
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>("[data-open]");
      if (t) {
        e.preventDefault();
        show(t.dataset.care);
      }
    };
    const onEvent = () => show();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("click", onClick);
    window.addEventListener("mt:enquire", onEvent);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("mt:enquire", onEvent);
      window.removeEventListener("keydown", onKey);
    };
  }, [show]);

  useEffect(() => {
    const lenis = getLenis();
    if (open) lenis?.stop();
    else lenis?.start();
  }, [open]);

  return (
    <div
      className="modal"
      hidden={!open}
      role="dialog"
      aria-modal="true"
      aria-labelledby="enqTitle"
      onClick={(e) => {
        if (e.target === e.currentTarget) hide();
      }}
    >
      {open && (
        <div className="sheet" data-lenis-prevent="">
          <button className="x" type="button" onClick={hide}>
            Close
          </button>
          <div>
            <p className="eyebrow" style={{ marginBottom: 12 }}>
              Treatment quote
            </p>
            <h3 id="enqTitle">Tell us what you need</h3>
          </div>
          <EnquiryForm key={key} idPrefix="m" autoFocus defaultRole={role} defaultCare={care} onDone={hide} />
        </div>
      )}
    </div>
  );
}
