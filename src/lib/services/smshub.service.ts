import "server-only";
import { cacheTag, CACHE_TAGS } from "@/components/cacheTag";
import { SmsHub } from "@/lib/sms/smshub";
import type { SmsHubBalanceResult } from "@/actions/smshub.actions";

export async function fetchSmsHubBalanceData(): Promise<SmsHubBalanceResult> {
  "use cache";
  cacheTag(CACHE_TAGS.SMSHUB, CACHE_TAGS.SETTINGS);

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
    credits: 1420,
    creditRule: { ethio: 1, safaricom: 2 },
    lowCreditThreshold: 50,
    isLow: false,
    isSimulated: true,
  };
}
