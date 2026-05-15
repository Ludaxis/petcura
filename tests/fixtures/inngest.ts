export const INNGEST_TEST_HEADERS = {
  "x-inngest-test-mode": "1",
  "x-petcura-qa-fixture": "pilot-gates"
} as const;

export function inngestTestEvent<TPayload extends Record<string, unknown>>(
  name: string,
  payload: TPayload
) {
  return {
    name,
    data: payload,
    user: {
      external_id: "qa-fixture"
    },
    ts: new Date("2026-05-15T00:00:00.000Z").getTime()
  };
}
