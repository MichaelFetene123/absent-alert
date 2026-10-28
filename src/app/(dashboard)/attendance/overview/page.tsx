import { redirect } from "next/navigation";

export const instant = false;

export default async function AttendanceOverviewRedirect({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string; startDate?: string }>;
}) {
  const params = await searchParams;
  const q = new URLSearchParams();
  if (params.classId) q.set("classId", params.classId);
  if (params.startDate) q.set("startDate", params.startDate);
  const queryString = q.toString();
  redirect(`/settings/overview${queryString ? `?${queryString}` : ""}`);
}
