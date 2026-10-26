import { requireUser } from "@/lib/guards";
import { PoliciesManager } from "@/components/policies-manager";

export default async function PoliciesPage() {
  await requireUser();
  return <PoliciesManager />;
}
