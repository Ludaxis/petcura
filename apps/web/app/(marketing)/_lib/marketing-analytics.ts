"use client";

import { track } from "@vercel/analytics";
import type { SupportedLocale } from "@petcura/shared";
import type { MarketingLeadSource } from "@petcura/validation";

export type MarketingEventName =
  | "landing_cta_clicked"
  | "owner_path_clicked"
  | "demo_form_started"
  | "demo_form_submitted"
  | "demo_form_failed"
  | "sandbox_opened"
  | "trust_center_opened";

export type MarketingEventProperties = {
  source?: MarketingLeadSource;
  locale?: SupportedLocale;
  route?: "/" | "/demo" | "/sandbox" | "/trust" | "/owners";
  outcome?: "success" | "fallback" | "validation_error" | "spam_blocked";
};

export function trackMarketingEvent(
  eventName: MarketingEventName,
  properties: MarketingEventProperties = {}
) {
  track(eventName, properties);
}
