import "server-only";

import twilio from "twilio";

type OtpVerificationResult =
  | { ok: true }
  | { ok: false; error: "otp_unavailable" | "invalid_code" };

function getDevOtpCode() {
  if (process.env.APP_ENV === "production") return null;
  return process.env.PETCURA_OWNER_OTP_DEV_CODE?.trim() || null;
}

function getVerifyConfig() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

  if (!accountSid || !authToken || !serviceSid) {
    return null;
  }

  return { accountSid, authToken, serviceSid };
}

export async function requestOwnerOtpDelivery(phone: string) {
  if (getDevOtpCode()) {
    return { ok: true as const };
  }

  const config = getVerifyConfig();
  if (!config) {
    return { ok: false as const, error: "otp_unavailable" as const };
  }

  const client = twilio(config.accountSid, config.authToken);

  try {
    await client.verify.v2
      .services(config.serviceSid)
      .verifications.create({ to: phone, channel: "whatsapp" });
    return { ok: true as const };
  } catch {
    try {
      await client.verify.v2
        .services(config.serviceSid)
        .verifications.create({ to: phone, channel: "sms" });
      return { ok: true as const };
    } catch {
      return { ok: false as const, error: "otp_unavailable" as const };
    }
  }
}

export async function verifyOwnerOtpCode(
  phone: string,
  code: string
): Promise<OtpVerificationResult> {
  const devCode = getDevOtpCode();
  if (devCode) {
    return code === devCode
      ? { ok: true }
      : { ok: false, error: "invalid_code" };
  }

  const config = getVerifyConfig();
  if (!config) {
    return { ok: false, error: "otp_unavailable" };
  }

  const client = twilio(config.accountSid, config.authToken);

  try {
    const result = await client.verify.v2
      .services(config.serviceSid)
      .verificationChecks.create({ to: phone, code });

    return result.status === "approved"
      ? { ok: true }
      : { ok: false, error: "invalid_code" };
  } catch {
    return { ok: false, error: "invalid_code" };
  }
}
