export const analyticsCookieName = "petcura-analytics";
export const analyticsConsentEvent = "petcura:analytics-consent";
export const oneYearSeconds = 60 * 60 * 24 * 365;

export type AnalyticsConsentValue = "accepted" | "rejected" | null;

export function getAnalyticsConsent(): AnalyticsConsentValue {
  if (typeof document === "undefined") {
    return null;
  }

  const match = document.cookie.match(
    new RegExp(`(?:^|; )${analyticsCookieName}=(accepted|rejected)`)
  );

  return (match?.[1] as AnalyticsConsentValue) ?? null;
}

export function persistAnalyticsConsent(
  consent: Exclude<AnalyticsConsentValue, null>
) {
  document.cookie = `${analyticsCookieName}=${consent}; Path=/; Max-Age=${oneYearSeconds}; SameSite=Lax`;
  window.dispatchEvent(new Event(analyticsConsentEvent));
}

export function subscribeToAnalyticsConsent(onStoreChange: () => void) {
  window.addEventListener(analyticsConsentEvent, onStoreChange);

  return () => {
    window.removeEventListener(analyticsConsentEvent, onStoreChange);
  };
}

export function getServerAnalyticsConsent(): AnalyticsConsentValue {
  return null;
}
