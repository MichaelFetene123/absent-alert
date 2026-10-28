"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";
import {
  getSmsTemplatesAction,
  updateSmsTemplateAction,
  setActiveTemplateAction,
  type UpdateTemplateInput,
} from "@/actions/template.actions";
import type { SmsTemplate } from "@/lib/services/templates-shared";

export const templatesKeys = {
  all: ["templates"] as const,
  list: () => (queryKeys?.templates?.list ? queryKeys.templates.list() : (["templates", "list"] as const)),
};

export function useTemplatesQuery(initialData?: SmsTemplate[]) {
  return useQuery({
    queryKey: templatesKeys.list(),
    queryFn: () => getSmsTemplatesAction(),
    initialData,
  });
}

export function useUpdateTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateTemplateInput) => updateSmsTemplateAction(input),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({
          queryKey: queryKeys?.templates?.all ?? templatesKeys.all,
        });
      }
    },
  });
}

export function useSetActiveTemplateMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (templateId: string) => setActiveTemplateAction(templateId),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({
          queryKey: queryKeys?.templates?.all ?? templatesKeys.all,
        });
      }
    },
  });
}
