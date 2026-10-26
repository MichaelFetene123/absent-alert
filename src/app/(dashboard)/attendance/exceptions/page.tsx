import { requireUser } from "@/lib/guards";
import { getAttendanceExceptions } from "@/lib/services/exceptions.service";
import { ExceptionsManager } from "@/components/exceptions-manager";

export const instant = false;

export default async function ExceptionsPage() {
  await requireUser();
  const data = await getAttendanceExceptions();

  return (
    <ExceptionsManager
      initialExceptions={data.exceptions}
      lateCount={data.lateCount}
      leaveCount={data.leaveCount}
      unexplainedCount={data.unexplainedCount}
      correctionsCount={data.correctionsCount}
    />
  );
}
