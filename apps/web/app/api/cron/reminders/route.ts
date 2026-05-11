import { dispatchDueReminders } from "@/lib/reminder-dispatch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unauthorized() {
  return new Response("Unauthorized", { status: 401 });
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return unauthorized();
  }

  const result = await dispatchDueReminders();

  return Response.json({
    ok: true,
    ...result
  });
}
