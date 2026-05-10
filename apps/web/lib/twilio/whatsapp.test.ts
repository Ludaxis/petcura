import { describe, expect, it } from "vitest";
import {
  formDataToRecord,
  getTwilioWebhookUrl,
  parseTwilioWhatsAppPayload,
  stripTwilioWhatsAppPrefix
} from "./whatsapp";

describe("Twilio WhatsApp helpers", () => {
  it("normalizes WhatsApp addresses", () => {
    expect(stripTwilioWhatsAppPrefix("whatsapp:+37258046666")).toBe(
      "+37258046666"
    );
    expect(stripTwilioWhatsAppPrefix("+37258046666")).toBe("+37258046666");
  });

  it("parses inbound WhatsApp form payloads", () => {
    const params = new URLSearchParams({
      From: "whatsapp:+37258046666",
      To: "whatsapp:+37255550123",
      Body: "My cat is not eating",
      MessageSid: "SM123",
      ProfileName: "Reza"
    });

    expect(parseTwilioWhatsAppPayload(params, "et")).toEqual({
      from: "+37258046666",
      to: "+37255550123",
      body: "My cat is not eating",
      messageSid: "SM123",
      profileName: "Reza",
      preferredLanguage: "et"
    });
  });

  it("keeps all Twilio params for signature validation", () => {
    const params = new URLSearchParams({
      From: "whatsapp:+37258046666",
      FutureParam: "still-signed"
    });

    expect(formDataToRecord(params)).toEqual({
      From: "whatsapp:+37258046666",
      FutureParam: "still-signed"
    });
  });

  it("reconstructs the forwarded public webhook URL", () => {
    const request = new Request(
      "http://127.0.0.1:3000/api/webhooks/twilio/whatsapp?clinic=alex",
      {
        headers: {
          host: "127.0.0.1:3000",
          "x-forwarded-host": "app.petcura.app",
          "x-forwarded-proto": "https"
        }
      }
    );

    expect(getTwilioWebhookUrl(request)).toBe(
      "https://app.petcura.app/api/webhooks/twilio/whatsapp?clinic=alex"
    );
  });
});
