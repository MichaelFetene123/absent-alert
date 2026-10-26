"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";
import {
  getActivePolicyAction,
  getAllPoliciesAction,
  createDraftPolicyAction,
  updatePolicyAction,
  activatePolicyAction,
  duplicatePolicyAction,
  archivePolicyAction,
  simulatePolicyAction,
} from "@/actions/policy.actions";
import type {
  AbsenceAlertPolicy,
  PolicySimulationInput,
} from "@/lib/types/policy";

export function useActivePolicyQuery(initialData?: AbsenceAlertPolicy) {
  return useQuery({
    queryKey: queryKeys.policies.active(),
    queryFn: async () => {
      const res = await getActivePolicyAction();
      return res.policy;
    },
    initialData,
  });
}

export function usePoliciesQuery(initialData?: AbsenceAlertPolicy[]) {
  return useQuery({
    queryKey: queryKeys.policies.list(),
    queryFn: async () => {
      const res = await getAllPoliciesAction();
      return res.policies;
    },
    initialData,
  });
}

export function useCreateDraftPolicyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AbsenceAlertPolicy>) => createDraftPolicyAction(data),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.policies.all });
      }
    },
  });
}

export function useUpdatePolicyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string; updates: Partial<AbsenceAlertPolicy> }) =>
      updatePolicyAction(input.id, input.updates),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.policies.all });
      }
    },
  });
}

export function useActivatePolicyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => activatePolicyAction(id),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.policies.all });
      }
    },
  });
}

export function useDuplicatePolicyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => duplicatePolicyAction(id),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.policies.all });
      }
    },
  });
}

export function useArchivePolicyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archivePolicyAction(id),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.policies.all });
      }
    },
  });
}

export function useSimulatePolicyMutation() {
  return useMutation({
    mutationFn: (input: { policyId: string; input: PolicySimulationInput }) =>
      simulatePolicyAction(input.policyId, input.input),
  });
}
