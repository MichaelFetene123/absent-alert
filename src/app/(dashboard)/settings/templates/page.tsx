import { requireUser } from "@/lib/guards";
import { TemplatesManager } from "@/components/templates-manager";
import { getSmsTemplates } from "@/lib/services/templates.service";

export const instant = false;

export default async function SettingsTemplatesPage() {
  await requireUser();
  const initialTemplates = await getSmsTemplates();
  return <TemplatesManager initialTemplates={initialTemplates} />;
}
