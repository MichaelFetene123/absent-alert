"use server";

import "server-only";
import { requireUser } from "@/lib/guards";
import { fetchSmsHubBalanceData } from "@/lib/services/smshub.service";

export type SmsHubBalanceResult = {
  ok: boolean;
  credits: number;
  creditRule: { ethio: number; safaricom: number };
  lowCreditThreshold: number;
  isLow: boolean;
  error?: string;
  isSimulated?: boolean;
};

export async function getSmsHubBalanceAction(): Promise<SmsHubBalanceResult> {
  await requireUser();
  return fetchSmsHubBalanceData();
}
