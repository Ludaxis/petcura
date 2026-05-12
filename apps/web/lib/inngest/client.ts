import "server-only";

import { Inngest } from "inngest";
import type { PetCuraInngestEventUnion } from "../../../../jobs/inngest/events";

export const inngest = new Inngest({
  id: "petcura",
  name: "PetCura"
});

export function shouldUseInngestAiJobs() {
  return (
    process.env.PETCURA_AI_JOBS_MODE === "inngest" ||
    Boolean(process.env.INNGEST_EVENT_KEY)
  );
}

export async function sendPetCuraInngestEvent(
  event: PetCuraInngestEventUnion
) {
  return inngest.send(event);
}
