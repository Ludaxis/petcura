"use client";

import { useEffect } from "react";
import type { SupportedLocale } from "@petcura/shared";
import type { MarketingLeadSource } from "@petcura/validation";
import {
  trackMarketingEvent,
  type MarketingEventName
} from "../_lib/marketing-analytics";

type RouteViewTrackerProps = {
  eventName: Extract<
    MarketingEventName,
    "sandbox_opened" | "trust_center_opened"
  >;
  locale: SupportedLocale;
  route: "/sandbox" | "/trust";
  source: MarketingLeadSource;
};

export function RouteViewTracker({
  eventName,
  locale,
  route,
  source
}: RouteViewTrackerProps) {
  useEffect(() => {
    trackMarketingEvent(eventName, { locale, route, source });
  }, [eventName, locale, route, source]);

  return null;
}
