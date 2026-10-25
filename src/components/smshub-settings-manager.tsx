"use client";

import * as React from "react";
import {
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Coins,
  KeyRound,
  ExternalLink,
  Lock,
  Loader2,
  Zap,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { getSmsHubBalanceAction, type SmsHubBalanceResult } from "@/actions/smshub.actions";
import Link from "next/link";

interface SmsHubSettingsManagerProps {
  initialBalance: SmsHubBalanceResult;
  hasEnvApiKey: boolean;
}

export function SmsHubSettingsManager({
  initialBalance,
  hasEnvApiKey,
}: SmsHubSettingsManagerProps) {
  const { t, locale } = useI18n();

  const [balance, setBalance] = React.useState<SmsHubBalanceResult>(initialBalance);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [apiKeyInput, setApiKeyInput] = React.useState("");

  const refreshBalance = async () => {
    setIsRefreshing(true);
    try {
      const res = await getSmsHubBalanceAction();
      setBalance(res);
      if (res.ok) {
        toast.success(`Balance refreshed: ${res.credits} credits available`);
      } else {
        toast.error(res.error || "Failed to query balance");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to check balance");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Smartphone className="size-5 text-indigo-600 dark:text-indigo-400" />
            {locale === "am" ? "የSMSHub ኤፒአይ ውቅርና የክሬዲት ሁኔታ" : "SMSHub API Integration & Credit Balance"}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {locale === "am"
              ? "የኢትዮ ቴሌኮምና ሳፋሪኮም ኤስኤምኤስ ስርጭት ሁኔታ፣ የክሬዲት ቀሪ ሂሳብና የአቅራቢው ግንኙነት መቆጣጠሪያ።"
              : "Official SMSHub (smshub.et) connectivity, credit consumption, carrier cost accounting, and server credentials."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshBalance}
            disabled={isRefreshing}
            className="h-8 text-xs gap-1.5"
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Check Balance</span>
          </Button>

          <Link href="/notifications/test">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 gap-1.5">
              <Zap className="size-3.5" />
              <span>Test SMS (0 Cost)</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Credit & Balance Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Balance Card */}
        <Card className={`border shadow-xs ${balance.isLow ? "border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"}`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Current Credit Balance</span>
              <Coins className="size-4 text-amber-500" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              {balance.credits}
              <span className="text-xs font-normal text-slate-500 ml-1.5">credits</span>
            </div>
          </CardHeader>
          <CardContent className="pt-0 text-xs">
            {balance.isLow ? (
              <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium">
                <AlertTriangle className="size-3.5" />
                <span>Low credit warning (Threshold: {balance.lowCreditThreshold})</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="size-3.5" />
                <span>Healthy balance above threshold</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Carrier Pricing Rules */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Ethiopian Carrier Costs</span>
              <Smartphone className="size-4 text-indigo-500" />
            </div>
            <div className="mt-2 space-y-1.5 text-xs">
              <div className="flex justify-between items-center pb-1 border-b border-slate-100 dark:border-slate-800">
                <span className="font-medium text-slate-700 dark:text-slate-300">Ethio Telecom (09...)</span>
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 font-mono text-[10px]">
                  1 credit / SMS
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-slate-700 dark:text-slate-300">Safaricom (07...)</span>
                <Badge className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 font-mono text-[10px]">
                  2 credits / SMS
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Connection Status */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-400">Connection Status</span>
              <ShieldCheck className="size-4 text-emerald-500" />
            </div>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs font-medium py-1 px-2.5 gap-1.5 border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-emerald-950">
                <CheckCircle2 className="size-3.5" />
                <span>SMSHub Gateway Online</span>
              </Badge>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                Base URL: <code className="font-mono text-slate-700 dark:text-slate-300">https://smshub.et</code>
              </p>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Security & Credentials */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <KeyRound className="size-4 text-indigo-600" />
            <span>Server-Side SMSHub API Credentials</span>
          </CardTitle>
          <CardDescription className="text-xs">
            API keys are strictly evaluated server-side and never exposed to browser client sessions.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Active Server API Key Status</Label>
            <div className="flex items-center gap-2 font-mono text-xs">
              <div className="flex-1 p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                {hasEnvApiKey ? "sk_live_••••••••••••••••••••••••" : "Configured via Server Environment (.env)"}
              </div>
              <Badge variant="outline" className="text-[11px] border-emerald-200 text-emerald-700 bg-emerald-50">
                Secured
              </Badge>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-950/60 bg-indigo-50/40 dark:bg-indigo-950/20 text-xs space-y-1.5">
            <div className="font-semibold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
              <Lock className="size-3.5" />
              <span>Provider Account Signature Behavior</span>
            </div>
            <p className="text-indigo-700/80 dark:text-indigo-300/80 text-[11px] leading-relaxed">
              SMSHub automatically attaches your registered institution signature to every live and test message. No custom &quot;from&quot; header is accepted in request payloads. Available single-segment character limits are 160 characters (GSM-7) or 70 characters (Unicode / Amharic).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
