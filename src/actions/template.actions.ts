"use server";

import "server-only";
import { z } from "zod";
import { requireUser } from "@/lib/guards";
import {
  getSmsTemplates,
  saveSmsTemplate,
  resetSmsTemplatesToDefaults,
  type SmsTemplate,
} from "@/lib/services/templates.service";

const updateTemplateSchema = z.object({
  id: z.string().min(1, "Template ID is required"),
  body: z.string().min(1, "Template body cannot be empty").max(1000, "Template body too long"),
  name: z.string().optional(),
  nameAm: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;

export async function getSmsTemplatesAction(): Promise<SmsTemplate[]> {
  await requireUser();
  return getSmsTemplates();
}

export async function updateSmsTemplateAction(input: UpdateTemplateInput): Promise<{
  success: boolean;
  template?: SmsTemplate | null;
  error?: string;
}> {
  try {
    await requireUser();
    const parsed = updateTemplateSchema.parse(input);
    const updated = await saveSmsTemplate(parsed.id, {
      body: parsed.body,
      name: parsed.name,
      nameAm: parsed.nameAm,
      isActive: parsed.isActive,
    });
    return { success: true, template: updated };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to save template" };
  }
}

export async function resetSmsTemplatesAction(): Promise<{
  success: boolean;
  templates?: SmsTemplate[];
  error?: string;
}> {
  try {
    await requireUser();
    const templates = await resetSmsTemplatesToDefaults();
    return { success: true, templates };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to reset templates" };
  }
}

