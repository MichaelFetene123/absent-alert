import crypto from "node:crypto";

/**
 * Validates incoming SMSHub webhook signatures (HMAC-SHA256).
 * Header format: "t={timestamp},v1={hash}"
 * Tolerance: default 300 seconds (5 minutes)
 */
export function verifySmsHubWebhook(
  rawBody: string,
  signatureHeader: string | null,
  secret: string = process.env.SMSHUB_WEBHOOK_SECRET || "default_webhook_secret",
  tolerance: number = 300
): boolean {
  if (!signatureHeader) return false;

  const m = /t=(\d+),v1=([a-f0-9]{64})/.exec(signatureHeader);
  if (!m) return false;

  const timestamp = Number(m[1]);
  if (Math.abs(Date.now() / 1000 - timestamp) > tolerance) {
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(m[2]));
  } catch {
    return false;
  }
}
