import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  enqueueOutboundMessage,
  recordTwilioStatusCallback
} from "./outbox";

vi.mock("server-only", () => ({}));

function thenable<T>(value: T) {
  return {
    then(resolve: (value: T) => void) {
      resolve(value);
    }
  };
}

function makeOutboxSupabase() {
  const rows = {
    outbound_messages: [] as Array<Record<string, unknown>>,
    message_delivery_events: [] as Array<Record<string, unknown>>,
    message_delivery_attempts: [] as Array<Record<string, unknown>>,
    request_events: [] as Array<Record<string, unknown>>
  };

  return {
    rows,
    from(table: keyof typeof rows) {
      return {
        insert(payload: Record<string, unknown>) {
          if (table === "outbound_messages") {
            const row = {
              id: "outbound-1",
              created_at: "2026-05-15T10:00:00.000Z",
              status: "queued",
              ...payload
            };
            rows.outbound_messages.push(row);
            return {
              select() {
                return this;
              },
              async single() {
                return { data: row, error: null };
              }
            };
          }

          rows[table].push(payload);
          return thenable({ error: null });
        },
        upsert(payload: Record<string, unknown>) {
          rows[table].push(payload);
          return {
            select() {
              return thenable({ data: [{ id: `${table}-1` }], error: null });
            },
            then(resolve: (value: { error: null }) => void) {
              resolve({ error: null });
            }
          };
        },
        select() {
          return this;
        },
        eq() {
          return this;
        },
        async single() {
          return { data: null, error: null };
        }
      };
    }
  };
}

function makeStatusSupabase() {
  const attempt = {
    id: "attempt-1",
    clinic_id: "clinic-1",
    outbound_message_id: "outbound-1",
    message_id: "message-1",
    request_id: "request-1",
    channel: "whatsapp",
    provider: "twilio",
    attempt_number: 1,
    status: "sending",
    provider_message_sid: "SM123",
    provider_status: null,
    error_code: null,
    error_message: null,
    payload_json: {},
    created_at: "2026-05-15T10:00:00.000Z",
    sent_at: "2026-05-15T10:00:01.000Z",
    completed_at: null
  };
  const rows = {
    outbound_messages: [
      {
        id: "outbound-1",
        clinic_id: "clinic-1",
        owner_id: "owner-1",
        status: "dispatched"
      }
    ] as Array<Record<string, unknown>>,
    message_delivery_attempts: [attempt] as Array<Record<string, unknown>>,
    message_delivery_events: [] as Array<Record<string, unknown>>,
    request_events: [] as Array<Record<string, unknown>>
  };
  let matchSid: unknown;

  return {
    rows,
    from(table: keyof typeof rows | "owner_channel_identities" | "clinic_channels") {
      return {
        select() {
          return this;
        },
        eq(key: string, value: unknown) {
          if (table === "message_delivery_attempts" && key === "provider_message_sid") {
            matchSid = value;
          }
          return this;
        },
        not() {
          return this;
        },
        is() {
          return this;
        },
        order() {
          return this;
        },
        limit() {
          return this;
        },
        maybeSingle: async function () {
          if (table === "message_delivery_attempts") {
            return {
              data: matchSid === attempt.provider_message_sid ? attempt : null,
              error: null
            };
          }

          return { data: null, error: null };
        },
        update(patch: Record<string, unknown>) {
          return {
            eq() {
              return this;
            },
            then(resolve: (value: { error: null }) => void) {
              if (table === "message_delivery_attempts") {
                Object.assign(attempt, patch);
              } else if (table === "outbound_messages") {
                Object.assign(rows.outbound_messages[0]!, patch);
              }
              resolve({ error: null });
            }
          };
        },
        insert(payload: Record<string, unknown>) {
          if (table === "request_events") {
            rows.request_events.push(payload);
          }
          return thenable({ error: null });
        },
        upsert(payload: Record<string, unknown>) {
          if (table === "message_delivery_events") {
            rows.message_delivery_events.push(payload);
          }
          return {
            select() {
              return thenable({ data: [{ id: "delivery-1" }], error: null });
            }
          };
        }
      } as Record<string, unknown>;
    }
  };
}

describe("outbound message outbox", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("persists an outbound message before dispatching the Inngest event", async () => {
    const fakeSupabase = makeOutboxSupabase();
    const sendEvent = vi.fn(async () => undefined);

    const outbound = await enqueueOutboundMessage({
      supabase: fakeSupabase as never,
      clinicId: "clinic-1",
      requestId: "request-1",
      messageId: "message-1",
      ownerId: "owner-1",
      createdBy: "staff-1",
      source: "staff_reply",
      channel: "whatsapp",
      toPhone: "whatsapp:+37258046666",
      body: "We can help.",
      idempotencyKey: "staff-reply:message-1",
      sendEvent
    });

    expect(outbound.id).toBe("outbound-1");
    expect(fakeSupabase.rows.outbound_messages[0]).toMatchObject({
      message_id: "message-1",
      recipient_phone: "+37258046666",
      status: "queued"
    });
    expect(fakeSupabase.rows.message_delivery_events[0]).toMatchObject({
      message_id: "message-1",
      status: "queued",
      external_event_id: "outbound:outbound-1:queued"
    });
    expect(sendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "outbound.message.queued",
        id: "clinic-1:outbound-1:send"
      })
    );
  });

  it("falls back to inline delivery when Inngest is not configured", async () => {
    const fakeSupabase = makeOutboxSupabase();
    const sendQueued = vi.fn(async () => ({ status: "sent" as const }));

    await enqueueOutboundMessage({
      supabase: fakeSupabase as never,
      clinicId: "clinic-1",
      requestId: "request-1",
      messageId: "message-1",
      ownerId: "owner-1",
      createdBy: "staff-1",
      source: "staff_reply",
      channel: "whatsapp",
      toPhone: "+37258046666",
      body: "We can help.",
      idempotencyKey: "staff-reply:message-1",
      sendQueued
    });

    expect(sendQueued).toHaveBeenCalledWith({
      outboundMessageId: "outbound-1",
      supabase: fakeSupabase
    });
    expect(fakeSupabase.rows.outbound_messages[0]).toMatchObject({
      id: "outbound-1",
      status: "queued"
    });
  });

  it("records Twilio callbacks by delivery attempt SID", async () => {
    const fakeSupabase = makeStatusSupabase();

    const result = await recordTwilioStatusCallback({
      supabase: fakeSupabase as never,
      payload: {
        messageSid: "SM123",
        rawStatus: "delivered",
        status: "delivered",
        eventId: "SM123:delivered",
        eventType: "DELIVERED"
      },
      now: new Date("2026-05-15T10:01:00.000Z")
    });

    expect(result).toMatchObject({
      status: "recorded",
      deliveryStatus: "delivered"
    });
    expect(fakeSupabase.rows.message_delivery_attempts[0]).toMatchObject({
      status: "delivered",
      provider_status: "delivered"
    });
    expect(fakeSupabase.rows.outbound_messages[0]).toMatchObject({
      status: "delivered"
    });
    expect(fakeSupabase.rows.message_delivery_events[0]).toMatchObject({
      message_id: "message-1",
      status: "delivered",
      external_event_id: "SM123:delivered"
    });
  });

  it("does not queue SMS fallback for failed WhatsApp delivery unless enabled", async () => {
    const fakeSupabase = makeStatusSupabase();

    const result = await recordTwilioStatusCallback({
      supabase: fakeSupabase as never,
      payload: {
        messageSid: "SM123",
        rawStatus: "failed",
        status: "failed",
        eventId: "SM123:failed:30003",
        errorCode: "30003"
      },
      sendEvent: false
    });

    expect(result.fallback).toMatchObject({
      queued: false,
      reason: "disabled"
    });
    expect(fakeSupabase.rows.outbound_messages).toHaveLength(1);
  });
});
