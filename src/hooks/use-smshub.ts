"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";
import {
  getSmsHubBalanceAction,
  testSmsHubAction,
  type SmsHubBalanceResult,
  type SmsTestResult,
} from "@/actions/smshub.actions";

export function useSmsHubBalanceQuery(initialData?: SmsHubBalanceResult) {
  return useQuery({
    queryKey: queryKeys.smshub.balance(),
    queryFn: () => getSmsHubBalanceAction(),
    initialData,
  });
}

export function useTestSmsHubMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { msisdn: string; text: string }) =>
      testSmsHubAction(input.msisdn, input.text),
    onSuccess: (res) => {
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: queryKeys.smshub.all });
      }
    },
  });
}
