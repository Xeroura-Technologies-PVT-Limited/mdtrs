"use client";

import NextLink, { useLinkStatus } from "next/link";
import type { ComponentProps } from "react";

export const navigationEvent = "mt:navigate";

function PendingMarker() {
  const { pending } = useLinkStatus();
  return pending ? <span hidden data-route-pending="" /> : null;
}

type SiteLinkProps = Omit<ComponentProps<typeof NextLink>, "href" | "onNavigate"> & { href: string; journeyRole?: "patient" | "attender" };

/** Keep Next's prefetch, history, scrolling and modified-click behaviour. */
export function SiteLink({ href, journeyRole, children, ...props }: SiteLinkProps) {
  return (
    <NextLink {...props} href={href} onNavigate={() => {
      if (journeyRole) document.documentElement.dataset.persona = journeyRole;
      window.dispatchEvent(new CustomEvent(navigationEvent, { detail: href }));
    }}>
      {children}
      <PendingMarker />
    </NextLink>
  );
}
