import { requireUser } from "@/lib/guards";
import { SmsTestManager } from "@/components/sms-test-manager";

export const instant = false;

export default async function SmsTestPage() {
  await requireUser();
  return <SmsTestManager />;
}
