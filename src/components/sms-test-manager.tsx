"use client";

import * as React from "react";
import {
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Send,
  Zap,
  Info,
  Sparkles,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { testSmsHubAction, type SmsTestResult } from "@/actions/smshub.actions";
import { useI18n } from "@/lib/i18n/context";

export function SmsTestManager() {
  const { t, locale } = useI18n();

  const [phone, setPhone] = React.useState("0911234567");
  const [message, setMessage] = React.useState(
    "AbsentAlert Test: Student Almaz Kebede was marked absent on Oct 25."
  );
  const [isRunning, setIsRunning] = React.useState(false);
  const [result, setResult] = React.useState<SmsTestResult | null>(null);

  // Live calculation of encoding & characters
  const isUnicode = React.useMemo(() => /[\u1200-\u137F]/.test(message), [message]);
  const charLimit = isUnicode ? 70 : 160;
  const signature = "\n\n- AbsentAlert Demo | 0982428697";
  const estimatedFinalText = message + signature;
  const totalChars = estimatedFinalText.length;
  const segments = Math.ceil(totalChars / charLimit) || 1;

  async function handleRunTest(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) {
      toast.error("Please enter a valid Ethiopian mobile number");
      return;
    }
    if (!message.trim()) {
      toast.error("Please enter message body");
      return;
    }

    setIsRunning(true);
    setResult(null);
    try {
      const res = await testSmsHubAction(phone, message);
      setResult(res);
      if (res.ok) {
        toast.success("SMSHub Zero-Cost Test Passed!");
      } else {
        toast.error(res.error || "Validation failed");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to execute test");
    } finally {
      setIsRunning(false);
    }
  }

  const sampleMessages = [
    {
      label: "English Absence Alert",
      text: "AbsentAlert: Student Almaz Kebede was marked absent from Class 7 B today Oct 25.",
    },
    {
      label: "Amharic Absence Alert (አማርኛ)",
      text: "አብሰንትአለርት፡ ተማሪ አልማዝ ከበደ ጥቅምት 15 ቀን 2017 ዓ.ም ከ7ኛ B ክፍል አልተገኘችም።",
    },
    {
      label: "Late Arrival Notice",
      text: "Notice: Dawit Haile arrived late to Class 7 B today at 08:52 AM.",
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-2 border-b border-border">
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <ShieldCheck className="size-5 text-primary" />
          {locale === "am" ? "የSMSHub የሙከራ መልእክት መላኪያ (0 ወጪ)" : "SMSHub Zero-Cost Test Mode"}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {locale === "am"
            ? "በPOST /api/test በኩል የስልክ ቁጥርን ትክክለኛነት፣ የፊደላት ብዛትና የአማርኛ ኢንኮዲንግ ያለ ምንም ክሬዲት ወጪ ያረጋግጡ።"
            : "Safely validate Ethiopian mobile numbers, message length, Amharic Unicode encoding, and credit estimates via POST /api/test without consuming credits."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Test Form */}
        <div className="md:col-span-7 space-y-4">
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>Test Parameters</span>
                <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                  Zero Cost (0 Credits)
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Enter an Ethiopian number (Ethio Telecom 09... or Safaricom 07...) to validate.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleRunTest} className="space-y-4">
                {/* Mobile Number */}
                <div className="space-y-1.5">
                  <Label htmlFor="test-phone" className="text-xs font-semibold">
                    Recipient Mobile Number (Ethiopian MSISDN)
                  </Label>
                  <Input
                    id="test-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0911234567 or 0712345678"
                    className="font-mono text-xs bg-background border-border"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Accepts 09xxxxxxxx, 07xxxxxxxx, 2519..., +251...
                  </p>
                </div>

                {/* Quick Presets */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Load Sample Preset Message:
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {sampleMessages.map((m) => (
                      <button
                        key={m.label}
                        type="button"
                        onClick={() => setMessage(m.text)}
                        className="px-2 py-1 rounded text-[11px] font-medium border border-border hover:bg-muted text-foreground"
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message Body */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="test-message" className="text-xs font-semibold">
                      Message Body
                    </Label>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="font-mono text-muted-foreground">
                        {message.length} chars (raw)
                      </span>
                      <Badge variant="outline" className="text-[10px] py-0 px-1 font-mono uppercase">
                        {isUnicode ? "Unicode (Amharic)" : "GSM-7"}
                      </Badge>
                    </div>
                  </div>
                  <textarea
                    id="test-message"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-ring font-sans text-foreground"
                    placeholder="Type message text here..."
                  />
                </div>

                {/* Submit Test Button */}
                <Button
                  type="submit"
                  disabled={isRunning}
                  className="w-full font-medium text-xs h-9 gap-1.5"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Validating with SMSHub API...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="size-3.5" />
                      <span>Run SMSHub Validation Test (0 Credits)</span>
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview & Provider Signature Panel */}
        <div className="md:col-span-5 space-y-4">
          <Card className="border-border shadow-xs bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                <Smartphone className="size-3.5 text-primary" />
                Live Message Preview (With Auto Signature)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3.5 rounded-xl border border-border bg-card shadow-xs space-y-2">
                <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                  {message}
                  <span className="text-muted-foreground font-medium">
                    {signature}
                  </span>
                </p>
              </div>

              {/* Character & Segment Budget */}
              <div className="space-y-1.5 text-xs bg-card p-3 rounded-lg border border-border">
                <div className="flex justify-between text-muted-foreground">
                  <span>Encoding Mode:</span>
                  <span className="font-semibold text-foreground uppercase">
                    {isUnicode ? "Unicode (Amharic)" : "GSM-7 (Standard)"}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Total Chars with Signature:</span>
                  <span className="font-semibold text-foreground">
                    {totalChars} / {charLimit} per segment
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Segment Count:</span>
                  <span className="font-semibold text-foreground">
                    {segments} {segments === 1 ? "SMS segment" : "SMS segments"}
                  </span>
                </div>
                <div className="flex justify-between text-muted-foreground border-t border-border pt-1.5">
                  <span>Est. Credit Cost:</span>
                  <span className="font-bold text-primary">
                    {segments * (phone.startsWith("07") ? 2 : 1)} Credits
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Result Inspection */}
          {result && (
            <Card
              className={`border shadow-xs ${
                result.ok
                  ? "border-primary/20 bg-primary/10"
                  : "border-destructive/20 bg-destructive/10"
              }`}
            >
              <CardContent className="p-3.5 space-y-2">
                <div className="flex items-center gap-2">
                  {result.ok ? (
                    <CheckCircle2 className="size-4 text-primary" />
                  ) : (
                    <AlertTriangle className="size-4 text-destructive" />
                  )}
                  <span className="text-xs font-bold text-foreground">
                    {result.ok ? "SMSHub /api/test Passed" : "Validation Rejected"}
                  </span>
                </div>

                {result.ok && result.data && (
                  <div className="text-[11px] space-y-1 font-mono text-foreground">
                    <p>• Status: {result.data.message_status}</p>
                    <p>• Network: {result.data.network.toUpperCase()}</p>
                    <p>• Credits Needed: {result.data.credits_needed}</p>
                    <p>• Credits Used: 0 (Zero Cost)</p>
                    <p>• Remaining Balance: {result.data.credits_remaining}</p>
                    <p className="text-primary font-sans font-medium mt-1">
                      {result.data.message}
                    </p>
                  </div>
                )}

                {!result.ok && (
                  <p className="text-xs text-destructive font-medium">
                    {result.error}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
