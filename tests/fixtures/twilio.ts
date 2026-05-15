import crypto from "node:crypto";

export type TwilioFormFixture = Record<string, string>;

export function formEncodeTwilioParams(params: TwilioFormFixture) {
  return new URLSearchParams(params).toString();
}

export function signTwilioWebhook({
  authToken,
  url,
  params
}: {
  authToken: string;
  url: string;
  params: TwilioFormFixture;
}) {
  const data = Object.keys(params)
    .sort()
    .reduce((acc, key) => `${acc}${key}${params[key]}`, url);

  return crypto.createHmac("sha1", authToken).update(data).digest("base64");
}

export function inboundWhatsAppFixture(
  overrides: Partial<TwilioFormFixture> = {}
): TwilioFormFixture {
  return {
    From: "whatsapp:+37255501001",
    To: "whatsapp:+15558969331",
    Body: "My dog has vomited twice this morning.",
    MessageSid: "SM00000000000000000000000000000001",
    ProfileName: "QA Owner",
    NumMedia: "0",
    ...overrides
  };
}
export function deliveryStatusFixture(
  overrides: Partial<TwilioFormFixture> = {}
): TwilioFormFixture {
  return {
    MessageSid: "SM00000000000000000000000000000001",
    MessageStatus: "delivered",
    To: "whatsapp:+37255501001",
    From: "whatsapp:+15558969331",
    ...overrides
  };
}
