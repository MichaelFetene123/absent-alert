"use server";

import "server-only";
import { requireUser } from "@/lib/guards";
import { SmsHub } from "@/lib/sms/smshub";
import { detectCarrier } from "@/lib/services/guardians.service";
import { cacheTag, CACHE_TAGS } from "@/components/cacheTag";

export type SmsTestResult = {
  ok: boolean;
  data?: {
    mode: string;
    message_status: string;
    would_send: boolean;
    msisdn: string;
    network: string;
    final_text: string;
    characters: number;
    character_limit: number;
    encoding: "gsm7" | "unicode";
    credits_needed: number;
    credits_used: number;
    credits_remaining: number;
    signature_applied: boolean;
    phone_in_signature: boolean;
    sms_sent: boolean;
    message: string;
  };
  error?: string;
  isSimulated?: boolean;
};

export type SmsHubBalanceResult = {
  ok: boolean;
  credits: number;
  creditRule: { ethio: number; safaricom: number };
  lowCreditThreshold: number;
  isLow: boolean;
  error?: string;
  isSimulated?: boolean;
};

export async function testSmsHubAction(msisdn: string, text: string): Promise<SmsTestResult> {
  await requireUser();

  const apiKey = process.env.SMSHUB_API_KEY;
  const baseUrl = process.env.SMSHUB_BASE_URL || "https://smshub.et";

  // Check if phone number is valid Ethiopian format (09..., 07..., +251...)
  const cleanPhone = msisdn.replace(/[^0-9+]/g, "");
  const { carrier, creditCost } = detectCarrier(cleanPhone);

  if (carrier === "Unknown") {
    return {
      ok: false,
      error: "Invalid msisdn. Use an Ethiopian mobile number: 09xxxxxxxx (Ethio Telecom) or 07xxxxxxxx (Safaricom), also accepted as +251….",
    };
  }

  // Detect encoding (Amharic Ge'ez characters \u1200 - \u137F trigger Unicode)
  const isUnicode = /[\u1200-\u137F]/.test(text);
  const encoding = isUnicode ? "unicode" : "gsm7";
  const characterLimit = isUnicode ? 70 : 160;

  // Account signature automatically appended by SMSHub
  const accountSignature = "\n\n- AbsentAlert Demo | 0982428697";
  const finalText = text.includes(accountSignature) ? text : `${text}${accountSignature}`;
  const totalCharacters = finalText.length;
  const segments = Math.ceil(totalCharacters / characterLimit) || 1;
  const totalCreditsNeeded = segments * creditCost;

  if (apiKey) {
    try {
      const client = new SmsHub(apiKey, baseUrl);
      const res = await client.test(msisdn, text);
      return {
        ok: true,
        data: res as any,
        isSimulated: false,
      };
    } catch (err: any) {
      // If live API throws error, return actual error
      return {
        ok: false,
        error: err.message || "SMSHub test validation failed",
      };
    }
  }

  // High-fidelity fallback compliant with SMSHub docs when API key is pending configuration
  return {
    ok: true,
    isSimulated: true,
    data: {
      mode: "test",
      message_status: "test_passed",
      would_send: true,
      msisdn,
      network: carrier === "Safaricom" ? "safaricom" : "ethio",
      final_text: finalText,
      characters: totalCharacters,
      character_limit: characterLimit,
      encoding,
      credits_needed: totalCreditsNeeded,
      credits_used: 0,
      credits_remaining: 15,
      signature_applied: true,
      phone_in_signature: true,
      sms_sent: false,
      message: "Validation passed. No SMS was sent and no credits were used.",
    },
  };
}

export async function getSmsHubBalanceAction(): Promise<SmsHubBalanceResult> {
  await requireUser();
  try {
    cacheTag(CACHE_TAGS.SMSHUB, CACHE_TAGS.SETTINGS);
  } catch {}

  const apiKey = process.env.SMSHUB_API_KEY;
  const baseUrl = process.env.SMSHUB_BASE_URL || "https://smshub.et";

  if (apiKey) {
    try {
      const client = new SmsHub(apiKey, baseUrl);
      const res = await client.balance();
      return {
        ok: true,
        credits: res.credits,
        creditRule: res.credit_rule,
        lowCreditThreshold: res.low_credit_threshold,
        isLow: res.credits <= res.low_credit_threshold,
        isSimulated: false,
      };
    } catch (err: any) {
      return {
        ok: false,
        credits: 0,
        creditRule: { ethio: 1, safaricom: 2 },
        lowCreditThreshold: 20,
        isLow: true,
        error: err.message || "Failed to reach SMSHub balance endpoint",
      };
    }
  }

  // Realistic verified snapshot for testing and development
  return {
    ok: true,
    credits: 42,
    creditRule: { ethio: 1, safaricom: 2 },
    lowCreditThreshold: 20,
    isLow: false,
    isSimulated: true,
  };
}
