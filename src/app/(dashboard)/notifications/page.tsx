import { requireUser } from "@/lib/guards";
import { getNotificationHistory } from "@/lib/services/notification.service";
import { NotificationsManager } from "@/components/notifications-manager";

export const instant = false;

type SearchParamsPromise = Promise<{
  status?: string;
  classId?: string;
  search?: string;
  page?: string;
}>;

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: SearchParamsPromise;
}) {
  const user = await requireUser();
  const resolvedParams = await searchParams;

  const validStatuses = ["PENDING", "SENDING", "ACCEPTED", "DELIVERED", "FAILED"] as const;
  const statusParam = resolvedParams.status?.toUpperCase();
  const status = validStatuses.includes(statusParam as any)
    ? (statusParam as (typeof validStatuses)[number])
    : undefined;

  const historyResult = await getNotificationHistory({
    userId: user.id,
    role: user.role,
    status,
    classId: resolvedParams.classId,
    search: resolvedParams.search,
    page: resolvedParams.page ? parseInt(resolvedParams.page, 10) : 1,
    pageSize: 100, // Fetch up to 100 for interactive client-side filtering and instant search
  });

  return (
    <NotificationsManager
      initialData={historyResult}
      selectedStatus={status}
      selectedClassId={resolvedParams.classId}
    />
  );
}
