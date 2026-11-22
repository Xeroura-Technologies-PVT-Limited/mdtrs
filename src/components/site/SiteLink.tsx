"use client";

import NextLink, { useLinkStatus } from "next/link";
import type { ComponentProps } from "react";

export const navigationEvent = "mt:navigate";
export type LinkDestination = {
  href: string;
  scroll: boolean;
  replace?: boolean;
  prefetch: boolean;
};

function PendingMarker() {
  const { pending } = useLinkStatus();
  return pending ? <span hidden data-route-pending="" /> : null;
}

type SiteLinkProps = Omit<ComponentProps<typeof NextLink>, "href" | "onNavigate"> & { href: string; journeyRole?: "patient" | "attender" };

/** Keep Next's prefetch, history, scrolling and modified-click behaviour. */
export function SiteLink({ href, journeyRole, children, ...props }: SiteLinkProps) {
  return (
    <NextLink {...props} href={href} onNavigate={event => {
      if (journeyRole) document.documentElement.dataset.persona = journeyRole;
      const request = new CustomEvent<LinkDestination>(navigationEvent, {
        cancelable: true,
        detail: {
          href, scroll: props.scroll !== false, replace: props.replace, prefetch: props.prefetch !== false,
        },
      });
      if (!window.dispatchEvent(request)) event.preventDefault();
    }}>
      {children}
      <PendingMarker />
    </NextLink>
  );
}
