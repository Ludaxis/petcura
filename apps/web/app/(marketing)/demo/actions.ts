"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { marketingLeadSchema } from "@petcura/validation";
import { createClient } from "@/lib/supabase/server";

export type DemoLeadFormState = {
  ok: boolean;
  stored?: boolean;
  blocked?: boolean;
  message?: "validation_error" | "submitted" | "fallback" | "spam_blocked";
  mailtoHref?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function submitDemoLead(
  _previousState: DemoLeadFormState,
  formData: FormData
): Promise<DemoLeadFormState> {
  const parsed = marketingLeadSchema.safeParse({
    source: formData.get("source"),
    locale: formData.get("locale"),
    clinicName: formData.get("clinicName"),
    contactName: formData.get("contactName"),
    workEmail: formData.get("workEmail"),
    country: formData.get("country"),
    pmsSystem: formData.get("pmsSystem"),
    monthlyRequestVolume: formData.get("monthlyRequestVolume"),
    message: formData.get("message"),
    consentGiven: formData.get("consentGiven"),
    website: formData.get("website")
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "validation_error",
      fieldErrors: parsed.error.flatten().fieldErrors
    };
  }

  if (parsed.data.website) {
    return {
      ok: true,
      blocked: true,
      message: "spam_blocked"
    };
  }

  const mailtoHref = buildDemoMailto(parsed.data);

  try {
    const userAgent = (await headers()).get("user-agent");
    const supabase = await createClient();
    const { error } = await supabase.from("marketing_leads").insert({
      source: parsed.data.source,
      locale: parsed.data.locale,
      clinic_name: parsed.data.clinicName,
      contact_name: parsed.data.contactName,
      work_email: parsed.data.workEmail,
      country: parsed.data.country,
      pms_system: parsed.data.pmsSystem ?? null,
      monthly_request_volume: parsed.data.monthlyRequestVolume ?? null,
      message: parsed.data.message ?? null,
      consent_given: parsed.data.consentGiven,
      user_agent_hash: userAgent ? hashUserAgent(userAgent) : null
    });

    if (error) throw error;

    return {
      ok: true,
      stored: true,
      message: "submitted"
    };
  } catch {
    return {
      ok: true,
      stored: false,
      message: "fallback",
      mailtoHref
    };
  }
}

function hashUserAgent(userAgent: string) {
  return createHash("sha256").update(userAgent).digest("hex");
}

function buildDemoMailto(input: {
  clinicName: string;
  contactName: string;
  workEmail: string;
  country: string;
  pmsSystem?: string | undefined;
  monthlyRequestVolume?: string | undefined;
  message?: string | undefined;
}) {
  const body = [
    `Clinic: ${input.clinicName}`,
    `Contact: ${input.contactName}`,
    `Work email: ${input.workEmail}`,
    `Country: ${input.country}`,
    `PMS: ${input.pmsSystem ?? "Not provided"}`,
    `Monthly request volume: ${input.monthlyRequestVolume ?? "Not provided"}`,
    "",
    input.message ? `Message: ${input.message}` : "Message:"
  ].join("\n");

  const params = new URLSearchParams({
    subject: `PetCura pilot request from ${input.clinicName}`,
    body
  });

  return `mailto:hello@petcura.app?${params.toString()}`;
}
