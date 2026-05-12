import { describe, expect, it } from "vitest";
import { resolveReplyDraftSourceLocale } from "./draft-locale";

describe("resolveReplyDraftSourceLocale", () => {
  it("uses the newest owner message locale first", () => {
    expect(
      resolveReplyDraftSourceLocale({
        request: {
          owners: { preferred_language: "en" },
          clinics: { locale: "en" }
        },
        messages: [
          { sender_type: "owner", source_locale: "et" },
          { sender_type: "staff", source_locale: "ru" },
          { sender_type: "owner", source_locale: "ru" }
        ]
      })
    ).toBe("ru");
  });

  it("falls back to the newest message locale when owner messages have no locale", () => {
    expect(
      resolveReplyDraftSourceLocale({
        request: {
          owners: { preferred_language: "en" },
          clinics: { locale: "en" }
        },
        messages: [
          { sender_type: "owner", source_locale: null },
          { sender_type: "staff", source_locale: "et" }
        ]
      })
    ).toBe("et");
  });

  it("falls back to owner preference, then clinic locale, then the default locale", () => {
    expect(
      resolveReplyDraftSourceLocale({
        request: {
          owners: { preferred_language: "ru" },
          clinics: { locale: "et" }
        },
        messages: []
      })
    ).toBe("ru");

    expect(
      resolveReplyDraftSourceLocale({
        request: {
          owners: null,
          clinics: { locale: "et" }
        },
        messages: []
      })
    ).toBe("et");

    expect(
      resolveReplyDraftSourceLocale({
        request: {
          owners: null,
          clinics: null
        },
        messages: []
      })
    ).toBe("en");
  });
});
