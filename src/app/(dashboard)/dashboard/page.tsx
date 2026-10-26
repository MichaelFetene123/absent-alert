import { requireUser } from "@/lib/guards";
import { getDashboardOverview } from "@/lib/services/attendance.service";
import { getReportsData } from "@/lib/services/reports.service";
import { DashboardView } from "@/components/dashboard-view";

export const instant = false;

export default async function DashboardPage() {
  const user = await requireUser();

  const [overview, reports] = await Promise.all([
    getDashboardOverview({
      userId: user.id,
      role: user.role,
    }),
    getReportsData(),
  ]);

  return (
    <DashboardView
      data={overview}
      reports={reports}
      user={{
        id: user.id,
        email: user.email || "",
        name: user.name,
        role: user.role,
      }}
    />
  );
}
