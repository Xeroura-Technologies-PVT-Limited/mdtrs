"use client";

import { SiteLink as Link } from "@/components/site/SiteLink";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { portalLogins } from "@/lib/portal-roles";
import { workspaceLinks } from "@/lib/portal-routes";
import { roleSiteNavigation } from "@/lib/portal-site-links";
import { usePortalSession } from "@/components/portal/PortalSession";
import { GUIDE_LINKS, NAV, SITE } from "@/lib/site";
import { LogoLockup } from "./Logo";

const stops = NAV.filter((link) => link.href.includes("#"));
const home = { href: "/", label: "Home", kicker: "" };
const sitePages = [home, ...NAV.filter(link => !link.href.includes("#")), ...GUIDE_LINKS];
const guestGroups = [{ title: "On this journey", links: stops }, { title: "Explore our guides", links: GUIDE_LINKS }];
type MenuLink = { href: string; label: string; kicker?: string };

export function Header() {
  const pathname = usePathname();
  const account = usePortalSession();
  const accountLabel = account.name || account.user?.email || "My account";
  const role = account.user && account.role;
  const portal = role ? { href: `/portal/${role}`, label: role === "doctor" ? "Doctor portal" : "Patient portal" } : null;
  const roleLinks = role ? roleSiteNavigation(role) : [];
  const otherPages = role ? sitePages.filter(page => !roleLinks.some(link => link.href === page.href)) : GUIDE_LINKS;
  const groups = role ? [
    { title: role === "doctor" ? "Doctor resources" : "Patient resources", links: roleLinks.slice(3) },
    { title: "Explore Medtours", links: otherPages },
  ] : guestGroups;
  const mobileLinks: MenuLink[] = portal ? [portal, ...roleLinks] : [home, ...NAV];
  const [open, setOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [stop, setStop] = useState("");
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const dropdown = useRef<HTMLDetailsElement>(null);
  const login = useRef<HTMLDivElement>(null);
  const loginTrigger = useRef<HTMLButtonElement>(null);

  function closeMenu() {
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  }

  function closeLogin() {
    setLoginOpen(false);
    loginTrigger.current?.focus({ preventScroll: true });
  }

  useEffect(() => {
    if (pathname !== "/") return;
    let frame = 0;
    const update = () => {
      const y = (document.querySelector("header")?.offsetHeight ?? 78) + 36;
      const section = stops.find(({href}) => {
        const el = document.getElementById(href.slice(2));
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return rect.top <= y && rect.bottom > y;
      });
      setStop(section?.href ?? "");
      frame = 0;
    };
    const queue = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    window.addEventListener("mt:locationchange", queue);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
      window.removeEventListener("mt:locationchange", queue);
    };
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const drawer = menu.current;
    const background = document.querySelectorAll<HTMLElement>("main, footer, .skip-link");
    background.forEach(el => { el.inert = true; });
    const initialLink = drawer?.querySelector<HTMLAnchorElement>("nav a[aria-current]")
      ?? drawer?.querySelector<HTMLAnchorElement>("nav a");
    initialLink?.focus({ preventScroll: true });
    const closeForDialog = () => setOpen(false);
    const breakpoint = matchMedia("(min-width:1081px)");
    const onResize = () => { if (breakpoint.matches) setOpen(false); };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); closeMenu(); }
      if (event.key !== "Tab" || !drawer) return;
      const last = drawer.querySelectorAll<HTMLElement>("a[href],button");
      if (event.shiftKey && document.activeElement === trigger.current) {
        event.preventDefault(); last[last.length - 1]?.focus();
      } else if (!event.shiftKey && document.activeElement === last[last.length - 1]) {
        event.preventDefault(); trigger.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    window.addEventListener("mt:close-menu", closeForDialog);
    breakpoint.addEventListener("change", onResize);
    return () => {
      background.forEach(el => { el.inert = false; });
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("mt:close-menu", closeForDialog);
      breakpoint.removeEventListener("change", onResize);
    };
  }, [open]);

  useEffect(() => {
    const closeOutside = (event: Event) => {
      if (dropdown.current && !dropdown.current.contains(event.target as Node)) dropdown.current.open = false;
      if (!login.current?.contains(event.target as Node)) setLoginOpen(false);
    };
    const closeOnNavigation = () => {
      if (login.current?.contains(document.activeElement)) closeLogin();
      else setLoginOpen(false);
      if (menu.current?.contains(document.activeElement)) closeMenu();
      else setOpen(false);
      const details = dropdown.current;
      if (details?.open) {
        if (details.contains(document.activeElement)) details.querySelector("summary")?.focus({ preventScroll: true });
        details.open = false;
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("focusin", closeOutside);
    window.addEventListener("mt:locationchange", closeOnNavigation);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("focusin", closeOutside);
      window.removeEventListener("mt:locationchange", closeOnNavigation);
    };
  }, []);

  const current = (href: string) => {
    if (href.includes("#")) return pathname === "/" && stop === href ? "location" : undefined;
    if (href === "/treatments" && pathname.startsWith("/treatments/")) return "location";
    if (href === portal?.href && pathname.startsWith(href + "/")) return "location";
    return pathname === href && (href !== "/" || role || !stop) ? "page" : undefined;
  };
  const plainLink = ({ href, label }: MenuLink) => (
    <Link className="nav-item" href={href} key={href} aria-current={current(href)}>{label}</Link>
  );

  return (
    <header className="hdr" id="hdr">
      <div className="wrap">
        <Link className="logo" href="/" onClick={() => setOpen(false)}>
          <LogoLockup /><span className="sr-only"> home</span>
        </Link>
        <nav className="desk-nav" aria-label="Main navigation">
          {(portal ? [portal, ...roleLinks.slice(0, 3)] : [home, NAV[0]]).map(plainLink)}
          <details className="nav-drop" ref={dropdown} onKeyDown={(event) => {
            if (event.key === "Escape" && dropdown.current?.open) {
              dropdown.current.open = false;
              dropdown.current.querySelector("summary")?.focus();
            }
          }}>
            <summary className={groups.some(group => group.links.some(link => current(link.href))) ? "current" : ""}>
              {role ? "More pages" : "Your journey"}
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 6 4.5 4 4.5-4" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
            </summary>
            <div className="drop-links">
              {groups.map(group =>
                <div className="menu-group" key={group.title}><p className="mono">{group.title}</p>
                  {group.links.map(({href,label}) => <Link key={href} href={href} aria-current={current(href)} onClick={() => {
                    if (dropdown.current) { dropdown.current.open = false; dropdown.current.querySelector("summary")?.focus(); }
                  }}>{label}<span aria-hidden="true">↗</span></Link>)}
                </div>)}
            </div>
          </details>
          {!role && NAV.filter(link => !link.href.includes("#") && link.href !== NAV[0].href).map(plainLink)}
        </nav>
        <div className="hdr-actions">
          <div className="hdr-login" ref={login} onKeyDown={event => {
            if (loginOpen && event.key === "Escape") {
              event.preventDefault();
              closeLogin();
            }
          }}>
            <button type="button" className="btn login-toggle" ref={loginTrigger}
              aria-controls="header-login-choices" aria-expanded={loginOpen}
              aria-label={account.user ? `Account menu for ${accountLabel}` : undefined}
              onClick={() => { setOpen(false); setLoginOpen(value => !value); }}>
              {account.user ? <span className="account-label">{accountLabel}</span> : "Login"}
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3.5 6 4.5 4 4.5-4" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
            </button>
            <nav id="header-login-choices" className={`drop-links login-choices${account.user ? " account-choices" : ""}`}
              aria-label={account.user ? "Your account" : "Choose login"} hidden={!loginOpen}>
              {account.user ? <>
                <div className="account-summary">
                  <strong>{accountLabel}</strong>
                  {account.role && <span>{account.role === "doctor" ? "Doctor" : "Patient"}</span>}
                </div>
                {(account.role ? workspaceLinks(account.role) : [{ href: "/portal", label: "Open portal" }]).map(({ href, label }) =>
                  <Link key={href} href={href} onClick={closeLogin}>{label}</Link>)}
                <button type="button" disabled={account.signingOut} onClick={async () => {
                  if (await account.signOut()) closeLogin();
                }}>{account.signingOut ? "Signing out…" : "Sign out"}</button>
                {account.signOutError && <p role="alert">Couldn’t sign out. Try again.</p>}
              </> : portalLogins.map(({ href, label }) => (
                <Link key={href} href={href} onClick={closeLogin}>{label}</Link>
              ))}
            </nav>
          </div>
          {role === "doctor"
            ? <Link className="btn hdr-cta" href="/contact">Contact care team <span aria-hidden="true">↗</span></Link>
            : <button className="btn hdr-cta" type="button" data-open="enquire">Get a Treatment Quote <span aria-hidden="true">↗</span></button>}
          <button className="menu-btn" type="button" aria-label={open ? "Close" : "Menu"} aria-expanded={open} aria-controls="mobile-menu" ref={trigger}
            onClick={() => open ? closeMenu() : setOpen(true)}>
            <span>{open ? "Close" : "Menu"}</span><span className="burger" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className={`menu-scrim${open ? " is-open" : ""}`} aria-hidden="true" onClick={closeMenu} />
      <div id="mobile-menu" ref={menu} className={`mobile-menu${open ? " is-open" : ""}`} inert={!open} aria-hidden={!open}>
        <div className="wrap">
          <nav aria-label="Mobile navigation">
            {mobileLinks.map(({href,label,kicker}) => <Link href={href} key={href} aria-current={current(href)} prefetch={open ? null : false} onClick={closeMenu}>{label}{kicker && <span>{kicker}</span>}</Link>)}
            <div className="mobile-guides"><p className="mono">{role ? "Explore Medtours" : "Explore our guides"}</p>
              {otherPages.map(({href,label}) => <Link href={href} key={href} aria-current={current(href)} prefetch={open ? null : false} onClick={closeMenu}>{label}<span aria-hidden="true">↗</span></Link>)}
            </div>
          </nav>
          <div className="menu-contact">
            {role === "doctor"
              ? <Link className="btn" href="/contact" prefetch={open ? null : false} onClick={closeMenu}>Contact care team</Link>
              : <button className="btn" data-open="enquire" type="button">Get a Treatment Quote</button>}
            <a href={SITE.phoneHref}>{SITE.phone}</a>
            <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
          </div>
        </div>
      </div>
    </header>
  );
}
