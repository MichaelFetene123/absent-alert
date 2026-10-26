"use server";

import { requireUser } from "@/lib/guards";
import { updateTag, CACHE_TAGS } from "@/components/cacheTag";
import {
  DEFAULT_ACTIVE_POLICY,
  SAMPLE_POLICIES,
  evaluatePolicy,
} from "@/lib/services/policy-engine.service";
import {
  fetchActivePolicyData,
  fetchAllPoliciesData,
  getPoliciesList,
  savePoliciesList,
} from "@/lib/services/policies.service";
import type {
  AbsenceAlertPolicy,
  PolicySimulationInput,
  PolicySimulationResult,
} from "@/lib/types/policy";

export async function getActivePolicyAction(): Promise<{
  success: boolean;
  policy: AbsenceAlertPolicy;
}> {
  await requireUser();
  const policy = await fetchActivePolicyData();
  return { success: true, policy };
}

export async function getAllPoliciesAction(): Promise<{
  success: boolean;
  policies: AbsenceAlertPolicy[];
}> {
  await requireUser();
  const policies = await fetchAllPoliciesData();
  return { success: true, policies };
}

export async function createDraftPolicyAction(
  data: Partial<AbsenceAlertPolicy>
): Promise<{ success: boolean; policy: AbsenceAlertPolicy; error?: string }> {
  const user = await requireUser();
  const list = getPoliciesList();

  const newPolicy: AbsenceAlertPolicy = {
    ...DEFAULT_ACTIVE_POLICY,
    ...data,
    id: `policy-${Date.now()}`,
    status: "DRAFT",
    version: data.version || `v${list.length + 1}.0.0-draft`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updatedBy: user.name || "Administrator",
    isLiveEnabled: false,
  };

  savePoliciesList([newPolicy, ...list]);

  try {
    updateTag(CACHE_TAGS.POLICIES);
    updateTag(CACHE_TAGS.DASHBOARD);
  } catch {}

  return { success: true, policy: newPolicy };
}

export async function updatePolicyAction(
  id: string,
  updates: Partial<AbsenceAlertPolicy>
): Promise<{ success: boolean; policy?: AbsenceAlertPolicy; error?: string }> {
  const user = await requireUser();
  const list = [...getPoliciesList()];

  const idx = list.findIndex((p) => p.id === id);
  if (idx === -1) {
    return { success: false, error: "Policy not found." };
  }

  // Prevent editing active policy directly if live notifications depend on it; require new version
  const current = list[idx]!;
  const updated: AbsenceAlertPolicy = {
    ...current,
    ...updates,
    id: current.id,
    updatedAt: new Date().toISOString(),
    updatedBy: user.name || "Administrator",
  };

  list[idx] = updated;
  savePoliciesList(list);

  try {
    updateTag(CACHE_TAGS.POLICIES);
    updateTag(CACHE_TAGS.POLICY(id));
    updateTag(CACHE_TAGS.DASHBOARD);
  } catch {}

  return { success: true, policy: updated };
}

export async function activatePolicyAction(
  id: string
): Promise<{ success: boolean; policy?: AbsenceAlertPolicy; error?: string }> {
  const user = await requireUser();
  const list = getPoliciesList();

  const target = list.find((p) => p.id === id);
  if (!target) {
    return { success: false, error: "Policy not found." };
  }

  // Demote previous active policies to archived
  const updatedList = list.map((p) => {
    if (p.id === id) {
      return {
        ...p,
        status: "ACTIVE" as const,
        isLiveEnabled: true,
        updatedAt: new Date().toISOString(),
        updatedBy: user.name || "Administrator",
      };
    }
    if (p.status === "ACTIVE") {
      return {
        ...p,
        status: "ARCHIVED" as const,
        isLiveEnabled: false,
        updatedAt: new Date().toISOString(),
      };
    }
    return p;
  });

  savePoliciesList(updatedList);
  const activated = updatedList.find((p) => p.id === id);

  try {
    updateTag(CACHE_TAGS.POLICIES);
    updateTag(CACHE_TAGS.POLICY(id));
    updateTag(CACHE_TAGS.DASHBOARD);
  } catch {}

  return { success: true, policy: activated };
}

export async function duplicatePolicyAction(
  id: string
): Promise<{ success: boolean; policy?: AbsenceAlertPolicy; error?: string }> {
  const user = await requireUser();
  const list = getPoliciesList();

  const source = list.find((p) => p.id === id);
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

  savePoliciesList([copy, ...list]);

  try {
    updateTag(CACHE_TAGS.POLICIES);
    updateTag(CACHE_TAGS.DASHBOARD);
  } catch {}

  return { success: true, policy: copy };
}

export async function archivePolicyAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  await requireUser();
  const list = getPoliciesList();

  const target = list.find((p) => p.id === id);
  if (!target) {
    return { success: false, error: "Policy not found." };
  }

  if (target.status === "ACTIVE") {
    return {
      success: false,
      error: "Cannot archive the active policy. Please activate another policy first.",
    };
  }

  savePoliciesList(
    list.map((p) =>
      p.id === id ? { ...p, status: "ARCHIVED" as const, isLiveEnabled: false } : p
    )
  );

  try {
    updateTag(CACHE_TAGS.POLICIES);
    updateTag(CACHE_TAGS.POLICY(id));
    updateTag(CACHE_TAGS.DASHBOARD);
  } catch {}

  return { success: true };
}

export async function simulatePolicyAction(
  policyId: string,
  input: PolicySimulationInput
): Promise<{ success: boolean; result: PolicySimulationResult; error?: string }> {
  await requireUser();
  const list = getPoliciesList();

  const policy =
    list.find((p) => p.id === policyId) || DEFAULT_ACTIVE_POLICY;

  const result = evaluatePolicy(input, policy);
  return { success: true, result };
}
