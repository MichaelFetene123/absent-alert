import { requireUser } from "@/lib/guards";
import { getGuardiansList } from "@/lib/services/guardians.service";
import { GuardiansManager } from "@/components/guardians-manager";

export const instant = false;

export default async function GuardiansPage() {
  const user = await requireUser();
  const data = await getGuardiansList();

  return (
    <GuardiansManager
      guardians={data.guardians}
      totalGuardians={data.totalGuardians}
      ethioCount={data.ethioCount}
      safaricomCount={data.safaricomCount}
      isAdmin={user.role === "ADMIN"}
    />
  );
}
