import { requireUser } from "@/lib/guards";
import { TemplatesManager } from "@/components/templates-manager";

export default async function TemplatesPage() {
  await requireUser();
  return <TemplatesManager />;
}
