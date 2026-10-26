"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";
import {
  getUserProfileAction,
  updateProfileDetailsAction,
  changePasswordAction,
  type UserProfileData,
} from "@/actions/profile.actions";

export function useUserProfileQuery(initialData?: UserProfileData) {
  return useQuery({
    queryKey: queryKeys.profile.user(),
    queryFn: async () => {
      const res = await getUserProfileAction();
      if (!res.ok || !res.profile) {
        throw new Error(res.error || "Failed to load profile");
      }
      return res.profile;
    },
    initialData,
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; email: string }) =>
      updateProfileDetailsAction(data),
    onSuccess: (res) => {
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
      }
    },
  });
}

export function useChangePasswordMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      changePasswordAction(data),
    onSuccess: (res) => {
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: queryKeys.profile.all });
      }
    },
  });
}
