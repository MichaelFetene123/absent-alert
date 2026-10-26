import "server-only";
import { cacheTag, CACHE_TAGS } from "@/components/cacheTag";
import type { AbsenceAlertPolicy } from "@/lib/types/policy";
import {
  DEFAULT_ACTIVE_POLICY,
  SAMPLE_POLICIES,
} from "@/lib/services/policy-engine.service";

let policiesStore: AbsenceAlertPolicy[] = [...SAMPLE_POLICIES];

export async function fetchActivePolicyData(): Promise<AbsenceAlertPolicy> {
  "use cache";
  cacheTag(CACHE_TAGS.POLICIES);

  const active =
    policiesStore.find((p) => p.status === "ACTIVE") || DEFAULT_ACTIVE_POLICY;
  return active;
}

export async function fetchAllPoliciesData(): Promise<AbsenceAlertPolicy[]> {
  "use cache";
  cacheTag(CACHE_TAGS.POLICIES);

  return policiesStore;
}

export function getPoliciesList(): AbsenceAlertPolicy[] {
  return policiesStore;
}

export function savePoliciesList(updated: AbsenceAlertPolicy[]): void {
  policiesStore = updated;
}
