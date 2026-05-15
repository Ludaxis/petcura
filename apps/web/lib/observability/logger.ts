type LogLevel = "info" | "warn" | "error";

type LogValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | LogValue[]
  | { [key: string]: LogValue };

type LogContext = Record<string, LogValue>;

const SECRET_KEY_PATTERN =
  /(authorization|cookie|password|secret|token|api[_-]?key|service[_-]?role)/i;

function redact(value: LogValue, key = ""): LogValue {
  if (SECRET_KEY_PATTERN.test(key)) {
    return "[redacted]";
  }

  if (Array.isArray(value)) {
    return value.map((item) => redact(item));
  }

  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, childValue]) => [
        childKey,
        redact(childValue, childKey)
      ])
    );
  }

  return value;
}

export function logEvent(
  level: LogLevel,
  event: string,
  context: LogContext = {}
) {
  const payload = {
    ts: new Date().toISOString(),
    level,
    event,
    service: "petcura-web",
    ...(redact(context) as LogContext)
  };

  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.info(line);
  }
}

export const logger = {
  info: (event: string, context?: LogContext) => logEvent("info", event, context),
  warn: (event: string, context?: LogContext) => logEvent("warn", event, context),
  error: (event: string, context?: LogContext) => logEvent("error", event, context)
};
