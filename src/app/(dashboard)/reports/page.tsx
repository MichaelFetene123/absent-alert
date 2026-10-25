import { requireUser } from "@/lib/guards";
import { getReportsData } from "@/lib/services/reports.service";
import { ReportsManager } from "@/components/reports-manager";

export default async function ReportsPage() {
  await requireUser();
  const data = await getReportsData();

  return (
    <ReportsManager
      dailyTrends={data.dailyTrends}
      gradeComparisons={data.gradeComparisons}
      chronicAbsentees={data.chronicAbsentees}
      smsAnalytics={data.smsAnalytics}
      overallAttendanceRate={data.overallAttendanceRate}
      initialTab="daily"
    />
  );
}
