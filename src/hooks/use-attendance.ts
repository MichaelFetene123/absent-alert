"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";
import {
  getDailyAttendance,
  markAttendance,
} from "@/actions/attendance.actions";

export function useDailyAttendanceQuery(
  params: { classId: string; date: string },
  initialData?: any
) {
  return useQuery({
    queryKey: queryKeys.attendance.daily(params.classId, params.date),
    queryFn: () => getDailyAttendance(params),
    enabled: Boolean(params.classId && params.date),
    initialData,
  });
}

export function useMarkAttendanceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: unknown) => markAttendance(input),
    onSuccess: (res, variables: any) => {
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
        if (variables?.classId && variables?.date) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.attendance.daily(variables.classId, variables.date),
          });
        }
      }
    },
  });
}
