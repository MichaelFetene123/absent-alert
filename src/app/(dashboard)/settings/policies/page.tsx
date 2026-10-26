import { requireUser } from "@/lib/guards";
import { PoliciesManager } from "@/components/policies-manager";

export const instant = false;

export default async function PoliciesPage() {
  await requireUser();
  return <PoliciesManager />;
}
