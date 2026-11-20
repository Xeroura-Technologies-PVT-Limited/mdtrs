"use client";

import { useEffect, useRef, useState } from "react";
import { EnquiryForm } from "./EnquiryForm";

type Enquiry = { visit: number; role: "patient" | "attender"; care?: string };

export function EnquiryModal() {
  const dialog = useRef<HTMLDialogElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const visit = useRef(0);
  const [enquiry, setEnquiry] = useState<Enquiry | null>(null);

  useEffect(() => {
    function open(opener: HTMLElement | null, care?: string) {
      returnTo.current = opener?.closest("#mobile-menu")
        ? document.querySelector(".menu-btn")
        : opener;
      window.dispatchEvent(new Event("mt:close-menu"));
      setEnquiry({ visit: ++visit.current, role: document.documentElement.dataset.persona === "attender" ? "attender" : "patient", care });
    }
    function onClick(event: MouseEvent) {
      const opener = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-open="enquire"]') : null;
      if (opener) { event.preventDefault(); open(opener, opener.dataset.care); }
    }
    const onEnquire = () => open(document.activeElement as HTMLElement | null);
    const onNavigate = () => {
      returnTo.current = null;
      if (dialog.current?.open) dialog.current.close();
    };
    document.addEventListener("click", onClick);
    window.addEventListener("mt:enquire", onEnquire);
    window.addEventListener("mt:locationchange", onNavigate);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("mt:enquire", onEnquire);
      window.removeEventListener("mt:locationchange", onNavigate);
    };
  }, []);

  useEffect(() => {
    if (enquiry && !dialog.current?.open) dialog.current?.showModal();
  }, [enquiry]);

  const close = () => dialog.current?.close();
  function afterClose(event: React.SyntheticEvent<HTMLDialogElement>) {
    const panel = event.currentTarget;
    if (panel.open) return;
    returnTo.current?.focus({ preventScroll: true });
    // Native close releases focus immediately. Keep the sheet painted through
    // its CSS exit, then discard its fields unless a new enquiry has opened.
    const closedVisit = visit.current;
    const animations = panel.getAnimations?.() ?? [];
    void Promise.allSettled(animations.map(animation => animation.finished)).then(() => {
      if (!panel.open && visit.current === closedVisit) setEnquiry(null);
    });
  }
  return (
    <dialog className="modal" ref={dialog} aria-labelledby="enqTitle" onClose={afterClose}
      onClick={event => { if (event.target === event.currentTarget) close(); }}>
      {enquiry && <div className="sheet" key={enquiry.visit}>
        <button className="x" type="button" onClick={close}>Close</button>
        <p className="eyebrow gap">Treatment quote</p>
        <h3 id="enqTitle">Tell us what you need</h3>
        <EnquiryForm idPrefix="m" defaultRole={enquiry.role} defaultCare={enquiry.care} onDone={close} />
      </div>}
    </dialog>
  );
}
