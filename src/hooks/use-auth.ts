"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loginAction, logoutAction, type AuthActionResult } from "@/actions/auth.actions";

export function useLoginMutation() {
  return useMutation({
    mutationFn: (formData: FormData) => loginAction(null, formData),
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => logoutAction(),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
