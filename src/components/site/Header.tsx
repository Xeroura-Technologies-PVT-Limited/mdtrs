"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { NAV, SITE } from "@/lib/site";
import { getLenis, scrollToTarget } from "@/lib/scroll";
import { LogoLockup } from "./Logo";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  // Body classes drive the menu, header colours and the header CTA.
  useEffect(() => {
    document.body.classList.toggle("menu-open", open);
    const lenis = getLenis();
    if (lenis) {
      if (open) lenis.stop();
      else lenis.start();
    }
  }, [open]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 30);
      const prologue = document.getElementById("prologue");
      // On the homepage the header CTA waits until the hero story is over.
      document.body.classList.toggle(
        "cta-on",
        prologue ? prologue.getBoundingClientRect().top < window.innerHeight * 0.5 : true,
      );
      if (!document.body.classList.contains("menu-open")) {
        if (y > lastY.current + 2 && y > 600) setHidden(true);
        else if (y < lastY.current - 2) setHidden(false);
      }
      lastY.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClose = () => setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("mt:close-menu", onClose);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mt:close-menu", onClose);
    };
  }, []);

  // Close the menu on route change.
  useEffect(() => setOpen(false), [pathname]);

  const onNav = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      const [path, hash] = href.split("#");
      setOpen(false);
      if (hash && (path || "/") === pathname) {
        e.preventDefault();
        setTimeout(() => scrollToTarget(document.getElementById(hash)), 350);
      } else if (!hash && href === pathname) {
        e.preventDefault();
      } else {
        e.preventDefault();
        setTimeout(() => router.push(href), 250);
      }
    },
    [pathname, router],
  );

  return (
    <>
      <header className={`hdr${scrolled ? " scrolled" : ""}${hidden ? " hide" : ""}`} id="hdr">
        <div className="wrap">
          <Link
            className="logo"
            href="/"
            aria-label="Medtours home"
            onClick={(e) => {
              if (pathname === "/") {
                e.preventDefault();
                const lenis = getLenis();
                if (lenis) lenis.scrollTo(0, { duration: 1.6 });
                else window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
          >
            <LogoLockup />
          </Link>
          <div className="hdr-actions">
            <button className="btn btn-solid hide-sm mag hdr-cta" data-open="enquire" type="button">
              <span className="dot" />
              Get a Treatment Quote
            </button>
            <button
              className="menu-btn"
              type="button"
              aria-expanded={open}
              aria-controls="menu"
              onClick={() => setOpen((o) => !o)}
            >
              <span className="burger" />
              <span>{open ? "Close" : "Menu"}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="menu" id="menu" aria-hidden={!open} inert={!open}>
        <div className="wrap">
          <nav aria-label="Main">
            {NAV.map((l, i) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={(e) => onNav(e, l.href)}
                style={{ transitionDelay: open ? `${0.25 + i * 0.05}s` : "0s" }}
                aria-current={l.href === pathname ? "page" : undefined}
              >
                <small>{l.kicker}</small>
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="menu-side">
            <div>
              <strong>Speak to us</strong>
              <span style={{ userSelect: "all" }}>{SITE.phone}</span>
              <br />
              <span style={{ userSelect: "all", overflowWrap: "anywhere" }}>{SITE.email}</span>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button className="btn btn-solid" data-open="enquire" type="button">
                <span className="dot" />
                Get a Treatment Quote
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
