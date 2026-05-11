import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createDebouncedRefresh,
  eqFilter,
  makeRealtimeChannelName
} from "./realtime-refresh";

describe("realtime refresh helpers", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("builds Supabase Postgres Changes eq filters", () => {
    expect(eqFilter("request_id", "9e1c")).toBe("request_id=eq.9e1c");
  });

  it("creates stable channel names safe for Supabase realtime", () => {
    expect(makeRealtimeChannelName("request detail", "abc:123/456")).toBe(
      "petcura:request-detail:abc-123-456"
    );
  });

  it("debounces refresh callbacks", () => {
    vi.useFakeTimers();
    const refresh = vi.fn();
    const scheduler = createDebouncedRefresh(refresh, 600);

    scheduler.schedule();
    scheduler.schedule();
    scheduler.schedule();

    vi.advanceTimersByTime(599);
    expect(refresh).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
