import { requireUser } from "@/lib/guards";
import { getSmsHubBalanceAction } from "@/actions/smshub.actions";
import { SmsHubSettingsManager } from "@/components/smshub-settings-manager";

export default async function SmsHubSettingsPage() {
  await requireUser();
  const balance = await getSmsHubBalanceAction();
  const hasEnvApiKey = !!process.env.SMSHUB_API_KEY;

  return (
    <SmsHubSettingsManager
      initialBalance={balance}
      hasEnvApiKey={hasEnvApiKey}
    />
  );
}
