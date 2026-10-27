"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";
import {
  getSmsHubBalanceAction,
  type SmsHubBalanceResult,
} from "@/actions/smshub.actions";

export function useSmsHubBalanceQuery(initialData?: SmsHubBalanceResult) {
  return useQuery({
    queryKey: queryKeys.smshub.balance(),
    queryFn: () => getSmsHubBalanceAction(),
    initialData,
  });
}
