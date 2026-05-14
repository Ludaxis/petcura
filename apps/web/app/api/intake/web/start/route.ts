import { NextRequest, NextResponse } from "next/server";
import { webIntakeStartSchema } from "@petcura/validation";
import {
  startWebIntake,
  WebIntakeError,
  type WebIntakeRequestMeta
} from "@/lib/intake/ai-assisted";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalid_json", message: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const parsed = webIntakeStartSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        code: "validation_error",
        fieldErrors: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  try {
    const result = await startWebIntake({
      input: parsed.data,
      meta: requestMeta(request)
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof WebIntakeError) {
      return NextResponse.json(
        { ok: false, code: error.code, message: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        code: "intake_start_failed",
        message: "Could not start intake."
      },
      { status: 500 }
    );
  }
}

function requestMeta(request: NextRequest): WebIntakeRequestMeta {
  return {
    origin: request.headers.get("origin"),
    referrer: request.headers.get("referer"),
    ipAddress:
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip"),
    userAgent: request.headers.get("user-agent")
  };
}
