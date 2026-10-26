"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";
import {
  listNotifications,
  retryNotification,
  batchRetryFailedNotificationsAction,
  dispatchPendingNotificationsAction,
  type ListNotificationsInput,
} from "@/actions/notification.actions";
import type { NotificationHistoryResult } from "@/lib/services/notification.service";

export function useNotificationsQuery(
  params?: ListNotificationsInput,
  initialData?: NotificationHistoryResult
) {
  return useQuery({
    queryKey: queryKeys.notifications.list({
      status: params?.status,
      classId: params?.classId,
      page: params?.page ? Number(params.page) : undefined,
      pageSize: params?.pageSize ? Number(params.pageSize) : undefined,
    }),
    queryFn: () => listNotifications(params),
    initialData,
  });
}

export function useRetryNotificationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => retryNotification(notificationId),
    onSuccess: (res) => {
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      }
    },
  });
}

export function useBatchRetryNotificationsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => batchRetryFailedNotificationsAction(),
    onSuccess: (res) => {
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      }
    },
  });
}

export function useDispatchPendingNotificationsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => dispatchPendingNotificationsAction(),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      }
    },
  });
}
