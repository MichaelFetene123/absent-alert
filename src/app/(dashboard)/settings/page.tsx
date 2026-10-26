import { requireUser } from "@/lib/guards";
import { SchoolSettingsManager } from "@/components/school-settings-manager";

export const instant = false;

export default async function SettingsPage() {
  await requireUser();
  return <SchoolSettingsManager />;
}
