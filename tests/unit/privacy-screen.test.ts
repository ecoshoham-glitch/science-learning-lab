import { describe, expect, it } from "vitest";
import { isValidIsraeliId, screenTranscript } from "@/lib/lesson/privacy-screen";

describe("transcript privacy screening", () => {
  it("removes e-mail addresses, phone numbers, valid ID numbers and links", () => {
    const input = "דנה כתבה ל-dana.k@school.org.il, הטלפון 052-123-4567, ת.ז. 123456782, ראו https://example.com/x";
    const r = screenTranscript(input);
    expect(r.text).not.toContain("dana.k@school.org.il");
    expect(r.text).not.toContain("052-123-4567");
    expect(r.text).not.toContain("123456782");
    expect(r.text).not.toContain("https://example.com");
    expect(r.counts).toEqual({ email: 1, phone: 1, "israeli-id": 1, url: 1 });
  });

  it("finds +972 and landline formats", () => {
    expect(screenTranscript("חייגו +972 54 765 4321").counts.phone).toBe(1);
    expect(screenTranscript("המשרד: 03-6401234").counts.phone).toBe(1);
  });

  it("keeps ordinary numbers and invalid 9-digit numbers", () => {
    const r = screenTranscript("במשך 30 שנה, בשנות ה-50, הקוד 123456789");
    expect(r.text).toBe("במשך 30 שנה, בשנות ה-50, הקוד 123456789");
    expect(r.findings).toHaveLength(0);
  });

  it("validates the Israeli ID checksum", () => {
    expect(isValidIsraeliId("123456782")).toBe(true);
    expect(isValidIsraeliId("123456789")).toBe(false);
    expect(isValidIsraeliId("12345678")).toBe(false);
  });

  it("does not pretend to find names (they need teacher review)", () => {
    const r = screenTranscript("נועה אמרה שהנגיף חי");
    expect(r.text).toBe("נועה אמרה שהנגיף חי");
  });
});
