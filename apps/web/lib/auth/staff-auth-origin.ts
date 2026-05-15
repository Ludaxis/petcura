type StaffAuthOriginInput = {
  appUrl?: string | null | undefined;
  requestOrigin?: string | null | undefined;
};

function parseUrl(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function isLoopbackHost(hostname: string) {
  const normalized = hostname.toLowerCase();

  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized === "[::1]"
  );
}

function normalizeLoopbackOrigin(url: URL) {
  const port = url.port ? `:${url.port}` : "";

  return `${url.protocol}//localhost${port}`;
}

export function resolveStaffMagicLinkOrigin({
  appUrl,
  requestOrigin
}: StaffAuthOriginInput) {
  const requestUrl = parseUrl(requestOrigin);

  if (requestUrl && isLoopbackHost(requestUrl.hostname)) {
    return normalizeLoopbackOrigin(requestUrl);
  }

  const app = parseUrl(appUrl);

  if (app) {
    return app.origin;
  }

  if (requestUrl) {
    return requestUrl.origin;
  }

  return "http://localhost:3000";
}
