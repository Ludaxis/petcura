import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const createVerification = vi.fn();

vi.mock("twilio", () => ({
  default: vi.fn(() => ({
    verify: {
      v2: {
        services: vi.fn(() => ({
          verifications: {
            create: createVerification
          },
          verificationChecks: {
            create: vi.fn()
          }
        }))
      }
    }
  }))
}));

describe("owner OTP delivery", () => {
  beforeEach(() => {
    vi.resetModules();
    createVerification.mockReset();
    process.env.TWILIO_ACCOUNT_SID = "ACtest";
    process.env.TWILIO_AUTH_TOKEN = "token";
    process.env.TWILIO_VERIFY_SERVICE_SID = "VAtest";
    delete process.env.PETCURA_OWNER_OTP_DEV_CODE;
    delete process.env.APP_ENV;
  });

  afterEach(() => {
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_VERIFY_SERVICE_SID;
    delete process.env.PETCURA_OWNER_OTP_DEV_CODE;
    delete process.env.APP_ENV;
  });

  it("uses SMS as the primary owner login code channel", async () => {
    createVerification.mockResolvedValueOnce({
      sid: "VEsms",
      status: "pending"
    });

    const { requestOwnerOtpDelivery } = await import("./otp");
    const result = await requestOwnerOtpDelivery("+37258046666");

    expect(result).toEqual({ ok: true });
    expect(createVerification).toHaveBeenCalledOnce();
    expect(createVerification).toHaveBeenCalledWith({
      to: "+37258046666",
      channel: "sms"
    });
  });

  it("falls back to WhatsApp only when SMS is rejected", async () => {
    createVerification
      .mockRejectedValueOnce({ code: 60200, status: 400 })
      .mockResolvedValueOnce({
        sid: "VEwhatsapp",
        status: "pending"
      });

    const { requestOwnerOtpDelivery } = await import("./otp");
    const result = await requestOwnerOtpDelivery("+37258046666");

    expect(result).toEqual({ ok: true });
    expect(createVerification).toHaveBeenCalledTimes(2);
    expect(createVerification).toHaveBeenNthCalledWith(1, {
      to: "+37258046666",
      channel: "sms"
    });
    expect(createVerification).toHaveBeenNthCalledWith(2, {
      to: "+37258046666",
      channel: "whatsapp"
    });
  });
});
