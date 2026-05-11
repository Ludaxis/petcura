export type RealtimeRefreshTarget = {
  table: string;
  filter?: string;
  event?: "*" | "INSERT" | "UPDATE" | "DELETE";
  schema?: "public";
};

export function eqFilter(column: string, value: string) {
  return `${column}=eq.${value}`;
}

export function makeRealtimeChannelName(scope: string, id: string) {
  const safeScope = scope.replace(/[^a-zA-Z0-9_-]/g, "-");
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, "-");
  return `petcura:${safeScope}:${safeId}`;
}

export function createDebouncedRefresh(
  refresh: () => void,
  debounceMs: number
) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const cancel = () => {
    if (!timeout) return;
    clearTimeout(timeout);
    timeout = null;
  };

  const schedule = () => {
    cancel();
    timeout = setTimeout(() => {
      timeout = null;
      refresh();
    }, debounceMs);
  };

  return { cancel, schedule };
}
