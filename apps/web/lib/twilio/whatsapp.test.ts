import { describe, expect, it } from "vitest";
import {
  formatTwilioWhatsAppAddress,
  formDataToRecord,
  getTwilioDeliveryEventId,
  getTwilioWebhookUrl,
  mapTwilioDeliveryStatus,
  parseTwilioMessageStatusPayload,
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

  it("formats WhatsApp API addresses", () => {
    expect(formatTwilioWhatsAppAddress("+37258046666")).toBe(
      "whatsapp:+37258046666"
    );
    expect(formatTwilioWhatsAppAddress("whatsapp:+37258046666")).toBe(
      "whatsapp:+37258046666"
    );
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
      media: [],
      preferredLanguage: "et"
    });
  });

  it("parses WhatsApp media metadata", () => {
    const params = new URLSearchParams({
      From: "whatsapp:+37258046666",
      To: "whatsapp:+37255550123",
      Body: "",
      MessageSid: "SM456",
      NumMedia: "2",
      MediaUrl0:
        "https://api.twilio.com/2010-04-01/Accounts/ac/Messages/SM/Media/ME0",
      MediaContentType0: "image/jpeg",
      MediaUrl1:
        "https://api.twilio.com/2010-04-01/Accounts/ac/Messages/SM/Media/ME1",
      MediaContentType1: "video/mp4"
    });

    expect(parseTwilioWhatsAppPayload(params, "en").media).toEqual([
      {
        index: 0,
        url:
          "https://api.twilio.com/2010-04-01/Accounts/ac/Messages/SM/Media/ME0",
        contentType: "image/jpeg"
      },
      {
        index: 1,
        url:
          "https://api.twilio.com/2010-04-01/Accounts/ac/Messages/SM/Media/ME1",
        contentType: "video/mp4"
      }
    ]);
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

  it("maps Twilio delivery statuses to PetCura statuses", () => {
    expect(mapTwilioDeliveryStatus("queued")).toBe("queued");
    expect(mapTwilioDeliveryStatus("accepted")).toBe("queued");
    expect(mapTwilioDeliveryStatus("sending")).toBe("sent");
    expect(mapTwilioDeliveryStatus("sent")).toBe("sent");
    expect(mapTwilioDeliveryStatus("delivered")).toBe("delivered");
    expect(mapTwilioDeliveryStatus("read")).toBe("read");
    expect(mapTwilioDeliveryStatus("undelivered")).toBe("failed");
    expect(mapTwilioDeliveryStatus("failed")).toBe("failed");
  });

  it("parses status callback payloads", () => {
    const params = new URLSearchParams({
      MessageSid: "SM789",
      MessageStatus: "delivered",
      EventType: "DELIVERED"
    });

    expect(parseTwilioMessageStatusPayload(params)).toEqual({
      messageSid: "SM789",
      rawStatus: "delivered",
      status: "delivered",
      eventId: "SM789:delivered:DELIVERED",
      eventType: "DELIVERED",
      errorCode: undefined,
      channelStatusMessage: undefined
    });
  });

  it("builds stable delivery event ids", () => {
    expect(getTwilioDeliveryEventId("SM789", "failed", undefined, "30003")).toBe(
      "SM789:failed:30003"
    );
  });
});
