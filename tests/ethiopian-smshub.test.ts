import { describe, it, expect } from "vitest";
import { detectCarrier } from "../src/lib/carrier";
import {
  toEthiopianDate,
  formatEthiopianDate,
  formatDualDate,
} from "../src/lib/ethiopian-calendar";
import { verifySmsHubWebhook } from "../src/lib/webhook-verify";
import { renderSmsTemplate } from "../src/lib/services/templates.service";
import crypto from "node:crypto";

describe("Ethiopian Mobile Carrier & Credit Accounting", () => {
  it("detects Ethio Telecom numbers starting with 09 and assigns 1 credit cost", () => {
    const res1 = detectCarrier("0911223344");
    expect(res1.carrier).toBe("Ethio Telecom");
    expect(res1.creditCost).toBe(1);

    const res2 = detectCarrier("+251911223344");
    expect(res2.carrier).toBe("Ethio Telecom");
    expect(res2.creditCost).toBe(1);
  });

  it("detects Safaricom numbers starting with 07 and assigns 2 credits cost", () => {
    const res1 = detectCarrier("0712345678");
    expect(res1.carrier).toBe("Safaricom");
    expect(res1.creditCost).toBe(2);

    const res2 = detectCarrier("+251712345678");
    expect(res2.carrier).toBe("Safaricom");
    expect(res2.creditCost).toBe(2);
  });

  it("handles formatted numbers with dashes, spaces, and brackets", () => {
    const res = detectCarrier("+251 (09) 11-22-33-44");
    expect(res.carrier).toBe("Ethio Telecom");
    expect(res.creditCost).toBe(1);
  });
});

describe("Ethiopian Calendar Helper (Ge'ez)", () => {
  it("converts Gregorian date to Ethiopian date accurately", () => {
    // 2024-09-11 Gregorian is Meskerem 1, 2017 Ethiopian New Year
    const eth = toEthiopianDate("2024-09-11");
    expect(eth.year).toBe(2017);
    expect(eth.month).toBe(1);
    expect(eth.day).toBe(1);
    expect(eth.monthNameEn).toBe("Meskerem");
    expect(eth.monthNameAm).toBe("መስከረም");
  });

  it("formats Ethiopian date in English and Amharic", () => {
    const ethEn = formatEthiopianDate("2024-09-11", "en");
    expect(ethEn).toBe("Meskerem 1, 2017 E.C.");

    const ethAm = formatEthiopianDate("2024-09-11", "am");
    expect(ethAm).toBe("መስከረም 1, 2017 ዓ.ም");
  });

  it("produces dual date string", () => {
    const dual = formatDualDate("2024-09-11", "en");
    expect(dual).toContain("Sep 11, 2024");
    expect(dual).toContain("Meskerem 1, 2017 E.C.");
  });
});

describe("SMS Template Rendering Engine", () => {
  it("replaces dynamic variables correctly in English", () => {
    const tpl = "Dear Parent, {student_name} was marked absent from {class_name} on {date}.";
    const rendered = renderSmsTemplate(tpl, {
      student_name: "Dawit Haile",
      class_name: "Class 7 B",
      date: "Oct 25",
    });
    expect(rendered).toBe("Dear Parent, Dawit Haile was marked absent from Class 7 B on Oct 25.");
  });

  it("replaces dynamic variables correctly in Amharic", () => {
    const tpl = "ውድ ወላጅ፣ {student_name} በ{date} በ{class_name} ክፍል አልተገኘም።";
    const rendered = renderSmsTemplate(tpl, {
      student_name: "አልማዝ ከበደ",
      class_name: "7ኛ B",
      date: "ጥቅምት 15",
    });
    expect(rendered).toBe("ውድ ወላጅ፣ አልማዝ ከበደ በጥቅምት 15 በ7ኛ B ክፍል አልተገኘም።");
  });
});

describe("SMSHub Webhook HMAC-SHA256 Signature Verification", () => {
  const secret = "test_webhook_secret_key";
  const body = JSON.stringify({ event: "message.sent", message_id: "msg_123" });

  it("verifies valid HMAC-SHA256 signatures within timestamp tolerance", () => {
    const now = Math.floor(Date.now() / 1000);
    const hash = crypto.createHmac("sha256", secret).update(`${now}.${body}`).digest("hex");
    const header = `t=${now},v1=${hash}`;

    const isValid = verifySmsHubWebhook(body, header, secret);
    expect(isValid).toBe(true);
  });

  it("rejects expired or forged signatures", () => {
    const oldTimestamp = Math.floor(Date.now() / 1000) - 600; // 10 minutes ago
    const hash = crypto.createHmac("sha256", secret).update(`${oldTimestamp}.${body}`).digest("hex");
    const header = `t=${oldTimestamp},v1=${hash}`;

    const isValid = verifySmsHubWebhook(body, header, secret);
    expect(isValid).toBe(false);
  });

  it("rejects signatures with incorrect secret", () => {
    const now = Math.floor(Date.now() / 1000);
    const wrongHash = crypto.createHmac("sha256", "wrong_key").update(`${now}.${body}`).digest("hex");
    const header = `t=${now},v1=${wrongHash}`;

    const isValid = verifySmsHubWebhook(body, header, secret);
    expect(isValid).toBe(false);
  });
});
