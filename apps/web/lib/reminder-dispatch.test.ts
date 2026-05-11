import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Database } from "@petcura/shared";

vi.mock("server-only", () => ({}));

type ReminderRow = Database["public"]["Tables"]["reminders"]["Row"] & {
  clinics: { name: string; locale: string };
  pets: { name: string };
  requests: {
    id: string;
    owners: { phone: string; preferred_language: string };
  };
};

function makeDueReminder(): ReminderRow {
  return {
    id: "reminder-1",
    clinic_id: "clinic-1",
    request_id: "request-1",
    pet_id: "pet-1",
    type: "vaccination",
    title: "Vaccination due",
    body: "Please book a visit this week.",
    due_at: "2026-05-11T09:00:00.000Z",
    channel: "whatsapp",
    status: "scheduled",
    sent_at: null,
    acknowledged_at: null,
    completed_at: null,
    created_by: null,
    created_at: "2026-05-11T08:00:00.000Z",
    send_attempts: 0,
    last_send_attempt_at: null,
    last_send_error: null,
    last_delivery_message_id: null,
    clinics: { name: "Alex Vet", locale: "en" },
    pets: { name: "Lumi" },
    requests: {
      id: "request-1",
      owners: { phone: "+37258046666", preferred_language: "en" }
    }
  };
}

function makeFakeSupabase(reminder: ReminderRow) {
  const inserts: Record<string, unknown[]> = {
    messages: [],
    message_delivery_events: [],
    request_events: []
  };

  return {
    inserts,
    from(table: string) {
      if (table === "reminders") {
        return {
          select() {
            return {
              eq() {
                return this;
              },
              lte() {
                return this;
              },
              order() {
                return this;
              },
              async limit() {
                return {
                  data: reminder.status === "scheduled" ? [reminder] : [],
                  error: null
                };
              }
            };
          },
          update(patch: Partial<ReminderRow>) {
            Object.assign(reminder, patch);
            return {
              eq() {
                return this;
              },
              or() {
                return this;
              },
              select() {
                return this;
              },
              async maybeSingle() {
                return {
                  data: {
                    id: reminder.id,
                    send_attempts: reminder.send_attempts
                  },
                  error: null
                };
              },
              then(resolve: (value: { error: null }) => void) {
                resolve({ error: null });
              }
            };
          }
        };
      }

      return {
        insert(payload: unknown) {
          inserts[table]?.push(payload);
          return {
            select() {
              return this;
            },
            async single() {
              return { data: { id: "message-1" }, error: null };
            },
            then(resolve: (value: { error: null }) => void) {
              resolve({ error: null });
            }
          };
        }
      };
    }
  };
}

describe("dispatchDueReminders", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("sends a due reminder once and records the lifecycle rows", async () => {
    const { dispatchDueReminders } = await import("./reminder-dispatch");
    const reminder = makeDueReminder();
    const fakeSupabase = makeFakeSupabase(reminder);
    const sendWhatsApp = vi.fn(async () => ({
      sid: "SMreminder",
      rawStatus: "queued",
      status: "queued" as const
    }));

    const firstPass = await dispatchDueReminders({
      supabase: fakeSupabase as never,
      sendWhatsApp,
      now: new Date("2026-05-11T12:00:00.000Z")
    });

    expect(firstPass).toMatchObject({
      scanned: 1,
      claimed: 1,
      sent: 1,
      failed: 0
    });
    expect(sendWhatsApp).toHaveBeenCalledOnce();
    expect(reminder.status).toBe("sent");
    expect(reminder.last_delivery_message_id).toBe("message-1");
    expect(fakeSupabase.inserts.messages).toHaveLength(1);
    expect(fakeSupabase.inserts.message_delivery_events).toHaveLength(1);
    expect(fakeSupabase.inserts.request_events).toHaveLength(1);

    const secondPass = await dispatchDueReminders({
      supabase: fakeSupabase as never,
      sendWhatsApp,
      now: new Date("2026-05-11T12:05:00.000Z")
    });

    expect(secondPass.scanned).toBe(0);
    expect(sendWhatsApp).toHaveBeenCalledOnce();
  });
});
