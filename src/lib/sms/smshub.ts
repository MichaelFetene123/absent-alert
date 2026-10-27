import "server-only";
import crypto from "node:crypto";

export type SendSmsResult = {
  accepted: boolean;
  providerRef?: string;
  httpStatus?: number;
  raw: unknown;
  error?: string;
};

export type SmsHubMessageData = {
  message_id: string;
  msisdn: string;
  network: "ethio" | "safaricom" | string;
  message_status: "sent" | string;
  credits_used: number;
  credits_remaining: number;
  signature_applied: boolean;
  phone_in_signature: boolean;
};

export type SmsHubVerifySendData = {
  verification_id: string;
  msisdn: string;
  network: string;
  verification_status: string;
  expires_at: string;
  expires_in: number;
  code_length: number;
  max_attempts: number;
  message_id?: string;
  credits_used: number;
  credits_remaining: number;
};

export type SmsHubVerifyCheckData = {
  verification_id: string;
  msisdn: string;
  valid: boolean;
  verification_status: "pending" | "approved" | "expired" | "failed" | "replaced" | string;
  attempts_left: number;
  message: string;
};

/**
 * Standard client class for SMSHub (smshub.et) API.
 */
export class SmsHub {
  private key: string;
  private base: string;

  constructor(key?: string, base?: string) {
    this.key = key || process.env.SMSHUB_API_KEY || "";
    this.base = (base || process.env.SMSHUB_BASE_URL || "https://smshub.et").replace(/\/+$/, "");
  }

  /**
   * Send an SMS to an Ethiopian mobile number.
   */
  async send(msisdn: string, text: string, trackLinks: boolean = false): Promise<SmsHubMessageData> {
    return this.call<SmsHubMessageData>("POST", "/api/sms", {
      msisdn,
      text,
      track_links: trackLinks,
    });
  }


  /**
   * Check remaining credits and pricing rules.
   */
  async balance(): Promise<{ credits: number; credit_rule: { ethio: number; safaricom: number }; low_credit_threshold: number }> {
    return this.call("GET", "/api/balance");
  }

  /**
   * Lookup a sent message by message ID.
   */
  async message(id: string): Promise<Record<string, unknown>> {
    return this.call("GET", `/api/messages/${encodeURIComponent(id)}`);
  }

  /**
   * Request a one-time verification code via SMSHub Verify API.
   */
  async verifySend(
    msisdn: string,
    opts: { app_name?: string; code_length?: number; expires_in?: number } = {}
  ): Promise<SmsHubVerifySendData> {
    return this.call<SmsHubVerifySendData>("POST", "/api/verify/send", { msisdn, ...opts });
  }

  /**
   * Validate a one-time verification code entered by user.
   */
  async verifyCheck(verificationId: string, code: string): Promise<SmsHubVerifyCheckData> {
    return this.call<SmsHubVerifyCheckData>("POST", "/api/verify/check", {
      verification_id: verificationId,
      code,
    });
  }

  /**
   * Validate incoming webhook signatures (HMAC-SHA256).
   */
  static webhookValid(rawBody: string, header: string, secret: string, tolerance: number = 300): boolean {
    const m = /t=(\d+),v1=([a-f0-9]{64})/.exec(header || "");
    if (!m || Math.abs(Date.now() / 1000 - Number(m[1])) > tolerance) return false;
    const want = crypto.createHmac("sha256", secret).update(`${m[1]}.${rawBody}`).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(want), Buffer.from(m[2]));
  }

  private async call<T>(method: string, path: string, body?: unknown): Promise<T> {
    if (!this.key) throw new Error("SMSHUB_API_KEY is not configured.");

    const res = await fetch(`${this.base}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.key}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const json = (await res.json().catch(() => ({}))) as any;
    if (!res.ok || json.status !== "success") {
      const err = new Error(`${json.error_type || `http_${res.status}`}: ${json.message || "request failed"}`);
      (err as any).status = res.status;
      (err as any).errorType = json.error_type;
      (err as any).requestId = json.request_id;
      throw err;
    }
    return json.data as T;
  }
}

/**
 * Functional wrapper conforming to AbsentAlert notification service interface.
 *
 * @param to Recipient phone number (Ethio Telecom or Safaricom, e.g. 09xxxxxxxx, 07xxxxxxxx, or +251...)
 * @param message Message text (GSM-7 up to 160 chars or Unicode up to 70 chars, including account signature)
 */
export async function sendSms(to: string, message: string): Promise<SendSmsResult> {
  const baseUrl = (process.env.SMSHUB_BASE_URL || "https://smshub.et").replace(/\/+$/, "");
  const apiKey = process.env.SMSHUB_API_KEY;

  if (!apiKey) {
    return {
      accepted: false,
      raw: null,
      error: "SMSHUB_API_KEY is not configured",
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(`${baseUrl}/api/sms`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        msisdn: to,
        text: message,
      }),
      signal: controller.signal,
    });

    const text = await res.text();
    let raw: any = text;
    try {
      raw = JSON.parse(text);
    } catch {
      // keep raw string if not valid JSON
    }

    const accepted = res.ok && raw?.status === "success";
    const providerRef = raw?.data?.message_id as string | undefined;

    let errorMessage: string | undefined;
    if (!accepted) {
      if (typeof raw === "object" && raw !== null && raw.message) {
        errorMessage = raw.error_type ? `${raw.error_type}: ${raw.message}` : raw.message;
      } else {
        errorMessage = `HTTP ${res.status}`;
      }
    }

    return {
      accepted,
      providerRef,
      httpStatus: res.status,
      raw,
      error: errorMessage,
    };
  } catch (e: any) {
    const isAbort = e?.name === "AbortError";
    return {
      accepted: false,
      raw: null,
      error: isAbort ? "SMSHub request timed out after 10s" : (e instanceof Error ? e.message : "Unknown error"),
    };
  } finally {
    clearTimeout(timer);
  }
}
