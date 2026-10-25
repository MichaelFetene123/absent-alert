"use server";

import { requireUser } from "@/lib/guards";
import {
  DEFAULT_ACTIVE_POLICY,
  SAMPLE_POLICIES,
  evaluatePolicy,
} from "@/lib/services/policy-engine.service";
import type {
  AbsenceAlertPolicy,
  PolicySimulationInput,
  PolicySimulationResult,
} from "@/lib/types/policy";

// In-memory policy state for runtime management
let policiesStore: AbsenceAlertPolicy[] = [...SAMPLE_POLICIES];

export async function getActivePolicyAction(): Promise<{
  success: boolean;
  policy: AbsenceAlertPolicy;
}> {
  await requireUser();
  const active =
    policiesStore.find((p) => p.status === "ACTIVE") || DEFAULT_ACTIVE_POLICY;
  return { success: true, policy: active };
}

export async function getAllPoliciesAction(): Promise<{
  success: boolean;
  policies: AbsenceAlertPolicy[];
}> {
  await requireUser();
  return { success: true, policies: policiesStore };
}

export async function createDraftPolicyAction(
  data: Partial<AbsenceAlertPolicy>
): Promise<{ success: boolean; policy: AbsenceAlertPolicy; error?: string }> {
  const user = await requireUser();

  const newPolicy: AbsenceAlertPolicy = {
    ...DEFAULT_ACTIVE_POLICY,
    ...data,
    id: `policy-${Date.now()}`,
    status: "DRAFT",
    version: data.version || `v${policiesStore.length + 1}.0.0-draft`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updatedBy: user.name || "Administrator",
    isLiveEnabled: false,
  };

  policiesStore = [newPolicy, ...policiesStore];
  return { success: true, policy: newPolicy };
}

export async function updatePolicyAction(
  id: string,
  updates: Partial<AbsenceAlertPolicy>
): Promise<{ success: boolean; policy?: AbsenceAlertPolicy; error?: string }> {
  const user = await requireUser();

  const idx = policiesStore.findIndex((p) => p.id === id);
  if (idx === -1) {
    return { success: false, error: "Policy not found." };
  }

  // Prevent editing active policy directly if live notifications depend on it; require new version
  const current = policiesStore[idx];
  const updated: AbsenceAlertPolicy = {
    ...current,
    ...updates,
    id: current.id,
    updatedAt: new Date().toISOString(),
    updatedBy: user.name || "Administrator",
  };

  policiesStore[idx] = updated;
  return { success: true, policy: updated };
}

export async function activatePolicyAction(
  id: string
): Promise<{ success: boolean; policy?: AbsenceAlertPolicy; error?: string }> {
  const user = await requireUser();

  const target = policiesStore.find((p) => p.id === id);
  if (!target) {
    return { success: false, error: "Policy not found." };
  }

  // Demote previous active policies to archived
  policiesStore = policiesStore.map((p) => {
    if (p.id === id) {
      return {
        ...p,
        status: "ACTIVE",
        isLiveEnabled: true,
        updatedAt: new Date().toISOString(),
        updatedBy: user.name || "Administrator",
      };
    }
    if (p.status === "ACTIVE") {
      return {
        ...p,
        status: "ARCHIVED",
        isLiveEnabled: false,
        updatedAt: new Date().toISOString(),
      };
    }
    return p;
  });

  const activated = policiesStore.find((p) => p.id === id);
  return { success: true, policy: activated };
}

export async function duplicatePolicyAction(
  id: string
): Promise<{ success: boolean; policy?: AbsenceAlertPolicy; error?: string }> {
  const user = await requireUser();

  const source = policiesStore.find((p) => p.id === id);
  if (!source) {
    return { success: false, error: "Source policy not found." };
  }

  const copy: AbsenceAlertPolicy = {
    ...source,
    id: `policy-${Date.now()}`,
    name: `${source.name} (Copy)`,
    nameAm: `${source.nameAm} (ግልባጭ)`,
    status: "DRAFT",
    version: `${source.version}-copy`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updatedBy: user.name || "Administrator",
    isLiveEnabled: false,
  };

  policiesStore = [copy, ...policiesStore];
  return { success: true, policy: copy };
}

export async function archivePolicyAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  await requireUser();

  const target = policiesStore.find((p) => p.id === id);
  if (!target) {
    return { success: false, error: "Policy not found." };
  }

  if (target.status === "ACTIVE") {
    return {
      success: false,
      error: "Cannot archive the active policy. Please activate another policy first.",
    };
  }

  policiesStore = policiesStore.map((p) =>
    p.id === id ? { ...p, status: "ARCHIVED", isLiveEnabled: false } : p
  );

  return { success: true };
}

export async function simulatePolicyAction(
  policyId: string,
  input: PolicySimulationInput
): Promise<{ success: boolean; result: PolicySimulationResult; error?: string }> {
  await requireUser();

  const policy =
    policiesStore.find((p) => p.id === policyId) || DEFAULT_ACTIVE_POLICY;

  const result = evaluatePolicy(input, policy);
  return { success: true, result };
}
