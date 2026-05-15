"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent, ReactNode } from "react";
import type { SupportedLocale } from "@petcura/shared";
import type { MarketingLeadSource } from "@petcura/validation";
import {
  trackMarketingEvent,
  type MarketingEventName
} from "../_lib/marketing-analytics";

type TrackedMarketingLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  children: ReactNode;
  eventName: MarketingEventName;
  href: string;
  locale: SupportedLocale;
  route: "/" | "/demo" | "/sandbox" | "/trust" | "/owners";
  source: MarketingLeadSource;
};

export function TrackedMarketingLink({
  children,
  eventName,
  href,
  locale,
  onClick,
  route,
  source,
  ...props
}: TrackedMarketingLinkProps) {
  return (
    <Link
      href={href}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        trackMarketingEvent(eventName, { locale, route, source });
        onClick?.(event);
      }}
      {...props}
    >
      {children}
    </Link>
  );
}
