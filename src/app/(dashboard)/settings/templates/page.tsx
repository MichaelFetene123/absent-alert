import { requireUser } from "@/lib/guards";
import { TemplatesManager } from "@/components/templates-manager";

export const instant = false;

export default async function SettingsTemplatesPage() {
  await requireUser();
  return <TemplatesManager />;
}
