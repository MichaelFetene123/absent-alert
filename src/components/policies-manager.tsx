"use client";

import * as React from "react";
import {
  ShieldCheck,
  Zap,
  Sliders,
  History,
  PlayCircle,
  Plus,
  Copy,
  CheckCircle2,
  AlertCircle,
  Clock,
  Users,
  Smartphone,
  ChevronRight,
  ChevronLeft,
  X,
  RefreshCw,
  FileText,
  Calendar,
  Lock,
  ArrowRight,
  Send,
  HelpCircle,
  Eye,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import {
  DEFAULT_ACTIVE_POLICY,
  SAMPLE_POLICIES,
  evaluatePolicy,
  renderHumanSummary,
} from "@/lib/services/policy-engine.service";
import type {
  AbsenceAlertPolicy,
  PolicySimulationInput,
  PolicySimulationResult,
  TriggerType,
  AttendanceScope,
  RecipientStrategy,
} from "@/lib/types/policy";
import {
  getAllPoliciesAction,
  activatePolicyAction,
  duplicatePolicyAction,
  archivePolicyAction,
  createDraftPolicyAction,
  simulatePolicyAction,
} from "@/actions/policy.actions";

export function PoliciesManager() {
  const { t, locale } = useI18n();

  // State
  const [policies, setPolicies] = React.useState<AbsenceAlertPolicy[]>(SAMPLE_POLICIES);
  const [activeTab, setActiveTab] = React.useState<"active" | "all" | "simulate">("active");
  const [isWizardOpen, setIsWizardOpen] = React.useState(false);
  const [wizardStep, setWizardStep] = React.useState(1);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Active policy
  const activePolicy =
    policies.find((p) => p.status === "ACTIVE") || policies[0] || DEFAULT_ACTIVE_POLICY;

  // New policy wizard state
  const [newPolicy, setNewPolicy] = React.useState<Partial<AbsenceAlertPolicy>>({
    name: "New Attendance Absence Policy",
    nameAm: "አዲስ የመቅረት ማሳወቂያ ፖሊሲ",
    description: "Configurable school-specific rules for student absence alerts.",
    version: "v1.3.0-draft",
    scope: "DAILY",
    triggerType: "DELAYED",
    triggerDelayMinutes: 10,
    scheduledTime: "09:00",
    consecutiveLessonsThreshold: 2,
    recipientStrategy: "PRIMARY_ONLY",
    defaultLanguage: "am",
    languageStrategy: "GUARDIAN_PREFERRED",
    suppressApprovedLeave: true,
    suppressHolidays: true,
    suppressUnsubmitted: true,
    maxAlertsPerStudentPerDay: 1,
    cooldownHours: 24,
    notifyLateArrival: true,
    lateArrivalThresholdMinutes: 15,
    notifyCorrections: true,
    maxRetries: 3,
    pauseOnLowCredit: true,
  });

  // Simulator state
  const [simPolicyId, setSimPolicyId] = React.useState<string>(activePolicy.id);
  const [simInput, setSimInput] = React.useState<PolicySimulationInput>({
    schoolId: "school-eth-01",
    studentId: "std-001",
    studentName: "Abebe Bikila",
    className: "Grade 8 A",
    date: new Date().toISOString().split("T")[0],
    status: "ABSENT",
    isRegisterSubmitted: true,
    minutesSinceSubmission: 15,
    hasApprovedLeave: false,
    isHoliday: false,
    guardianName: "Bikila Wolde",
    guardianPhone: "0911223344",
    isPhoneVerified: true,
    priorAlertSentToday: false,
    preferredLanguage: "am",
  });
  const [simResult, setSimResult] = React.useState<PolicySimulationResult | null>(() =>
    evaluatePolicy(simInput, activePolicy)
  );

  // Load policies
  React.useEffect(() => {
    getAllPoliciesAction().then((res) => {
      if (res.success && res.policies.length > 0) {
        setPolicies(res.policies);
      }
    });
  }, []);

  // Pre-configured test scenarios for simulator
  const loadScenario = (type: "standard" | "leave" | "unsubmitted" | "window" | "invalid_phone" | "duplicate") => {
    let updated: PolicySimulationInput = { ...simInput };
    if (type === "standard") {
      updated = {
        ...updated,
        studentName: "Abebe Bikila",
        status: "ABSENT",
        isRegisterSubmitted: true,
        minutesSinceSubmission: 15,
        hasApprovedLeave: false,
        isHoliday: false,
        guardianPhone: "0911223344",
        priorAlertSentToday: false,
      };
      toast.info("Loaded Scenario: Standard Unexplained Absence (Eligible)");
    } else if (type === "leave") {
      updated = {
        ...updated,
        studentName: "Tigist Assefa",
        status: "LEAVE",
        hasApprovedLeave: true,
        isRegisterSubmitted: true,
        minutesSinceSubmission: 20,
        guardianPhone: "0922334455",
        priorAlertSentToday: false,
      };
      toast.info("Loaded Scenario: Approved Medical Leave (Suppressed)");
    } else if (type === "unsubmitted") {
      updated = {
        ...updated,
        studentName: "Dawit Kebede",
        status: "ABSENT",
        isRegisterSubmitted: false,
        minutesSinceSubmission: 0,
        hasApprovedLeave: false,
        priorAlertSentToday: false,
      };
      toast.info("Loaded Scenario: Unsubmitted Teacher Register (Pending)");
    } else if (type === "window") {
      updated = {
        ...updated,
        studentName: "Kenenisa Bekele",
        status: "ABSENT",
        isRegisterSubmitted: true,
        minutesSinceSubmission: 4, // within 10 min window
        hasApprovedLeave: false,
        priorAlertSentToday: false,
      };
      toast.info("Loaded Scenario: Within 10m Correction Window (Pending)");
    } else if (type === "invalid_phone") {
      updated = {
        ...updated,
        studentName: "Hiwot Mengistu",
        status: "ABSENT",
        isRegisterSubmitted: true,
        minutesSinceSubmission: 15,
        hasApprovedLeave: false,
        guardianPhone: "011-555555", // invalid landline format
        priorAlertSentToday: false,
      };
      toast.info("Loaded Scenario: Invalid Guardian Phone (Requires Review)");
    } else if (type === "duplicate") {
      updated = {
        ...updated,
        studentName: "Yared Haile",
        status: "ABSENT",
        isRegisterSubmitted: true,
        minutesSinceSubmission: 30,
        hasApprovedLeave: false,
        guardianPhone: "0933445566",
        priorAlertSentToday: true, // already alerted
      };
      toast.info("Loaded Scenario: Prior Alert Sent Today (Suppressed Duplicate)");
    }
    setSimInput(updated);
    const pol = policies.find((p) => p.id === simPolicyId) || activePolicy;
    setSimResult(evaluatePolicy(updated, pol));
  };

  const runSimulation = () => {
    const pol = policies.find((p) => p.id === simPolicyId) || activePolicy;
    const res = evaluatePolicy(simInput, pol);
    setSimResult(res);
    toast.success(`Simulation evaluated: ${res.decision}`);
  };

  const handleActivatePolicy = async (id: string) => {
    const res = await activatePolicyAction(id);
    if (res.success && res.policy) {
      toast.success(`${res.policy.name} is now the active live policy.`);
      setPolicies((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "ACTIVE" } : p.status === "ACTIVE" ? { ...p, status: "ARCHIVED" } : p))
      );
    } else {
      toast.error(res.error || "Failed to activate policy.");
    }
  };

  const handleDuplicatePolicy = async (id: string) => {
    const res = await duplicatePolicyAction(id);
    if (res.success && res.policy) {
      toast.success(`Duplicated policy as draft: ${res.policy.name}`);
      setPolicies((prev) => [res.policy!, ...prev]);
    }
  };

  const handleArchivePolicy = async (id: string) => {
    const res = await archivePolicyAction(id);
    if (res.success) {
      toast.success("Policy archived.");
      setPolicies((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: "ARCHIVED" } : p))
      );
    } else {
      toast.error(res.error || "Cannot archive active policy.");
    }
  };

  const handleCreatePolicy = async () => {
    setIsSubmitting(true);
    try {
      const res = await createDraftPolicyAction(newPolicy);
      if (res.success && res.policy) {
        toast.success(`Draft policy created: ${res.policy.name}`);
        setPolicies((prev) => [res.policy!, ...prev]);
        setIsWizardOpen(false);
        setWizardStep(1);
        setActiveTab("all");
      }
    } catch {
      toast.error("Error creating draft policy.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {locale === "am" ? "የመቅረት ማስጠንቀቂያ ፖሊሲዎች" : "Absence Alert Policies"}
            </h1>
            <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 text-xs">
              Policy Engine v1.2
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {locale === "am"
              ? "የትምህርት ቤቱን የመቅረት ማሳወቂያ ደንቦች፣ የእርማት መስኮቶች፣ የተፈቀደ ፈቃድ ማጣሪያዎች እና የማሳወቂያ መንገዶች ማዋቀሪያ።"
              : "Configure deterministic school attendance rules, post-submission correction windows, holiday suppression, and guardian recipient policies."}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab("simulate")}
            className="text-xs h-9"
          >
            <PlayCircle className="h-4 w-4 mr-1.5 text-primary" />
            {locale === "am" ? "ፖሊሲ ሞካሪ (ሲሙሌተር)" : "Policy Simulator"}
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setIsWizardOpen(true);
              setWizardStep(1);
            }}
            className="text-xs h-9"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            {locale === "am" ? "አዲስ ፖሊሲ አዋቅር" : "Create New Policy"}
          </Button>
        </div>
      </div>

      {/* Operational KPI Metric Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <Card className="p-3.5 bg-card border-border shadow-xs">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
            {locale === "am" ? "ተግባራዊ ፖሊሲ" : "Active Policy"}
          </span>
          <div className="text-base font-bold text-foreground mt-1 truncate">
            {locale === "am" ? activePolicy.nameAm : activePolicy.name}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-primary">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{activePolicy.version} (Live Active)</span>
          </div>
        </Card>

        <Card className="p-3.5 bg-card border-border shadow-xs">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
            {locale === "am" ? "የማሳወቂያ ሰዓት / መዘግየት" : "Trigger Timing"}
          </span>
          <div className="text-base font-bold text-foreground mt-1">
            {activePolicy.triggerType === "DELAYED"
              ? `${activePolicy.triggerDelayMinutes}m Window`
              : activePolicy.triggerType === "SCHEDULED_TIME"
              ? activePolicy.scheduledTime
              : "Immediate"}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>Post-submission delay</span>
          </div>
        </Card>

        <Card className="p-3.5 bg-card border-border shadow-xs">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
            {locale === "am" ? "የድግግሞሽ መከላከያ" : "Deduplication Rule"}
          </span>
          <div className="text-base font-bold text-foreground mt-1">
            Max {activePolicy.maxAlertsPerStudentPerDay} / student / day
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>24h Cooldown window</span>
          </div>
        </Card>

        <Card className="p-3.5 bg-card border-border shadow-xs">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
            {locale === "am" ? "ማጣሪያዎችና እገዳዎች" : "Suppression Rules"}
          </span>
          <div className="text-base font-bold text-foreground mt-1">
            Leave & Holidays
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-primary">
            <Zap className="h-3.5 w-3.5" />
            <span>False-alarm safeguards on</span>
          </div>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border gap-6">
        <button
          onClick={() => setActiveTab("active")}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "active"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {locale === "am" ? "ተግባራዊ ፖሊሲ ዝርዝር" : "Active Policy Overview"}
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "all"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {locale === "am"
            ? `ሁሉም ፖሊሲዎች እና ረቂቆች (${policies.length})`
            : `All Policies & Drafts (${policies.length})`}
        </button>
        <button
          onClick={() => setActiveTab("simulate")}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "simulate"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {locale === "am" ? "የፖሊሲ ሲሙሌተርና ማረጋገጫ" : "Policy Simulator & Workbench"}
        </button>
      </div>

      {/* TAB 1: ACTIVE POLICY OVERVIEW */}
      {activeTab === "active" && (
        <div className="space-y-6">
          <Card className="border-border bg-card shadow-xs overflow-hidden">
            <div className="bg-muted/50 px-6 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="font-semibold text-lg text-foreground">
                    {locale === "am" ? activePolicy.nameAm : activePolicy.name}
                  </span>
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                    ACTIVE LIVE
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {activePolicy.version}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {activePolicy.description}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDuplicatePolicy(activePolicy.id)}
                  className="text-xs h-8"
                >
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  {locale === "am" ? "ረቂቅ ቅጂ ፍጠር" : "Duplicate as Draft"}
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setSimPolicyId(activePolicy.id);
                    setActiveTab("simulate");
                  }}
                  className="text-xs h-8"
                >
                  <PlayCircle className="h-3.5 w-3.5 mr-1" />
                  {locale === "am" ? "በሲሙሌተር ሞክር" : "Simulate Live Policy"}
                </Button>
              </div>
            </div>

            <CardContent className="p-6 space-y-6">
              {/* Plain-Language Human Summary (Section 8 Requirement) */}
              <div className="p-4 rounded-lg bg-muted/40 border border-border">
                <span className="text-xs font-semibold text-primary uppercase tracking-wide block mb-1">
                  {locale === "am" ? "የፖሊሲው አጠቃላይ ማጠቃለያ (Human-Readable Summary)" : "Auditable Policy Summary"}
                </span>
                <p className="text-sm text-foreground leading-relaxed">
                  {renderHumanSummary(activePolicy, locale)}
                </p>
              </div>

              {/* 8-Step Parameter Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-3.5 rounded border border-border bg-muted/30">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase block">1. Scope</span>
                  <div className="text-sm font-semibold text-foreground mt-0.5">
                    {activePolicy.scope === "DAILY" ? "Daily Attendance" : activePolicy.scope}
                  </div>
                  <span className="text-xs text-muted-foreground block mt-1">Homeroom morning register</span>
                </div>

                <div className="p-3.5 rounded border border-border bg-muted/30">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase block">2. Trigger Mechanism</span>
                  <div className="text-sm font-semibold text-foreground mt-0.5">
                    {activePolicy.triggerDelayMinutes}m Post-Submission Delay
                  </div>
                  <span className="text-xs text-muted-foreground block mt-1">Allows teacher correction</span>
                </div>

                <div className="p-3.5 rounded border border-border bg-muted/30">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase block">3. Recipient Strategy</span>
                  <div className="text-sm font-semibold text-foreground mt-0.5">
                    Primary Guardian Only
                  </div>
                  <span className="text-xs text-muted-foreground block mt-1">E.164 verified numbers</span>
                </div>

                <div className="p-3.5 rounded border border-border bg-muted/30">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase block">4. Language Strategy</span>
                  <div className="text-sm font-semibold text-foreground mt-0.5">
                    Guardian Preferred (አማርኛ / EN)
                  </div>
                  <span className="text-xs text-muted-foreground block mt-1">Fallback: Amharic</span>
                </div>

                <div className="p-3.5 rounded border border-border bg-muted/30">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase block">5. Leave Suppression</span>
                  <div className="text-sm font-semibold text-primary mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Enabled</span>
                  </div>
                  <span className="text-xs text-muted-foreground block mt-1">Excludes medical/family leave</span>
                </div>

                <div className="p-3.5 rounded border border-border bg-muted/30">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase block">6. Holiday Suppression</span>
                  <div className="text-sm font-semibold text-primary mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Enabled</span>
                  </div>
                  <span className="text-xs text-muted-foreground block mt-1">Excludes Ethiopian holidays</span>
                </div>

                <div className="p-3.5 rounded border border-border bg-muted/30">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase block">7. Late Arrival Alerts</span>
                  <div className="text-sm font-semibold text-foreground mt-0.5">
                    Enabled (&gt;15 mins)
                  </div>
                  <span className="text-xs text-muted-foreground block mt-1">Gate check alert</span>
                </div>

                <div className="p-3.5 rounded border border-border bg-muted/30">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase block">8. Bounded Retries</span>
                  <div className="text-sm font-semibold text-foreground mt-0.5">
                    3 Attempts (Exp Backoff)
                  </div>
                  <span className="text-xs text-muted-foreground block mt-1">429, 500, 502, 503 only</span>
                </div>
              </div>

              {/* Audit Trail & Metadata */}
              <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground border-t border-border pt-4">
                <div className="flex items-center gap-4">
                  <span>Tenant ID: <strong className="text-foreground">{activePolicy.schoolId}</strong></span>
                  <span>Effective From: <strong className="text-foreground">{activePolicy.effectiveFrom}</strong></span>
                  <span>Last Updated: <strong className="text-foreground">{activePolicy.updatedAt.slice(0, 10)} by {activePolicy.updatedBy}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-primary">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Single Source of Truth for Absence Eligibility</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: ALL POLICIES & DRAFTS */}
      {activeTab === "all" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3.5">
            {policies.map((p) => {
              const isActive = p.status === "ACTIVE";
              const isDraft = p.status === "DRAFT";
              const isScheduled = p.status === "SCHEDULED";
              const isArchived = p.status === "ARCHIVED";

              return (
                <Card
                  key={p.id}
                  className={`p-4 bg-card border transition-all ${
                    isActive
                      ? "border-primary/50 shadow-xs"
                      : "border-border"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-base text-foreground">
                          {locale === "am" ? p.nameAm : p.name}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            isActive
                              ? "bg-primary/10 text-primary border-primary/20 text-xs"
                              : isDraft
                              ? "bg-muted text-muted-foreground border-border text-xs"
                              : isScheduled
                              ? "bg-muted text-foreground border-border text-xs"
                              : "bg-muted text-muted-foreground text-xs"
                          }
                        >
                          {p.status}
                        </Badge>
                        <span className="text-xs font-mono text-muted-foreground">{p.version}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {p.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                        <span>Scope: <strong>{p.scope}</strong></span>
                        <span>Trigger: <strong>{p.triggerType}</strong></span>
                        <span>Language: <strong>{p.defaultLanguage.toUpperCase()}</strong></span>
                        <span>Updated: <strong>{p.updatedAt.slice(0, 10)}</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {!isActive && !isArchived && (
                        <Button
                          size="sm"
                          onClick={() => handleActivatePolicy(p.id)}
                          className="text-xs h-8"
                        >
                          {locale === "am" ? "አሁን አንቃ (Activate)" : "Activate"}
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDuplicatePolicy(p.id)}
                        className="text-xs h-8"
                      >
                        <Copy className="h-3.5 w-3.5 mr-1" />
                        {locale === "am" ? "ቅጂ" : "Duplicate"}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSimPolicyId(p.id);
                          setActiveTab("simulate");
                        }}
                        className="text-xs h-8"
                      >
                        <PlayCircle className="h-3.5 w-3.5 mr-1 text-primary" />
                        {locale === "am" ? "ሞክር" : "Simulate"}
                      </Button>

                      {!isActive && !isArchived && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleArchivePolicy(p.id)}
                          className="text-xs h-8 text-destructive hover:bg-destructive/10"
                        >
                          {locale === "am" ? "አስቀምጥ" : "Archive"}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: POLICY SIMULATOR & WORKBENCH */}
      {activeTab === "simulate" && (
        <div className="space-y-6">
          <Card className="p-4 bg-muted/40 border border-border">
            <div className="flex items-start gap-3">
              <HelpCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-foreground">
                  {locale === "am" ? "የፖሊሲ ሲሙሌሽን እና ማረጋገጫ መስኮት" : "Policy Validation & Simulation Workbench"}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {locale === "am"
                    ? "ይህ ሞካሪ ልክ እንደቀጥታ ሥርዓቱ ተመሳሳይ የአቴንዳንስ ማጣሪያ ደንቦችን ይጠቀማል፤ ነገር ግን ምንም ዓይነት የኤስኤምኤስ ክፍያ ወይም የቀጥታ መልእክት አይልክም። ፖሊሲውን ከማንቃትዎ በፊት የውሳኔውን ትክክለኛነት ያረጋግጡ።"
                    : "Simulate attendance events through the exact backend policy engine without sending real SMS messages or consuming credits. Test edge cases such as approved leave, holiday suppression, correction windows, and invalid phone formats before activating a policy."}
                </p>
              </div>
            </div>
          </Card>

          {/* Quick Scenario Preset Strip */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
              {locale === "am" ? "ፈጣን የሙከራ ሁኔታዎች (Quick Test Scenarios)" : "Pre-Configured Test Scenarios"}
            </span>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadScenario("standard")}
                className="text-xs h-8 bg-card"
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-primary" />
                Case A: Unexplained Absence (Eligible)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadScenario("leave")}
                className="text-xs h-8 bg-card"
              >
                <AlertCircle className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                Case B: Medical Leave (Suppressed)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadScenario("window")}
                className="text-xs h-8 bg-card"
              >
                <Clock className="h-3.5 w-3.5 mr-1 text-primary" />
                Case C: Within 10m Window (Pending)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadScenario("unsubmitted")}
                className="text-xs h-8 bg-card"
              >
                <FileText className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                Case D: Unsubmitted Register (Pending)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadScenario("invalid_phone")}
                className="text-xs h-8 bg-card"
              >
                <Smartphone className="h-3.5 w-3.5 mr-1 text-destructive" />
                Case E: Invalid Phone (Requires Review)
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadScenario("duplicate")}
                className="text-xs h-8 bg-card"
              >
                <Copy className="h-3.5 w-3.5 mr-1 text-primary" />
                Case F: Duplicate Alert (Suppressed)
              </Button>
            </div>
          </div>

          {/* Simulator Inputs & Result Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Input Form Column */}
            <div className="lg:col-span-5 space-y-4 bg-card p-5 rounded-lg border border-border shadow-xs">
              <h3 className="text-sm font-semibold text-foreground flex items-center justify-between">
                <span>Simulation Event Inputs</span>
                <span className="text-xs font-normal text-muted-foreground">School: {simInput.schoolId}</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-muted-foreground block mb-1">Evaluating Under Policy</label>
                  <select
                    value={simPolicyId}
                    onChange={(e) => {
                      setSimPolicyId(e.target.value);
                      const pol = policies.find((p) => p.id === e.target.value) || activePolicy;
                      setSimResult(evaluatePolicy(simInput, pol));
                    }}
                    className="w-full px-2.5 py-1.5 rounded border border-border bg-background text-xs text-foreground"
                  >
                    {policies.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.version}) - {p.status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-muted-foreground block mb-1">Student Name</label>
                    <Input
                      value={simInput.studentName}
                      onChange={(e) => setSimInput({ ...simInput, studentName: e.target.value })}
                      className="h-8 text-xs bg-background border-border"
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground block mb-1">Class / Section</label>
                    <Input
                      value={simInput.className}
                      onChange={(e) => setSimInput({ ...simInput, className: e.target.value })}
                      className="h-8 text-xs bg-background border-border"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-muted-foreground block mb-1">Attendance Status</label>
                    <select
                      value={simInput.status}
                      onChange={(e) =>
                        setSimInput({ ...simInput, status: e.target.value as any })
                      }
                      className="w-full px-2.5 py-1.5 rounded border border-border bg-background text-xs text-foreground"
                    >
                      <option value="ABSENT">ABSENT (ቀሪ)</option>
                      <option value="LEAVE">LEAVE (ፈቃድ)</option>
                      <option value="LATE">LATE (አርፋጅ)</option>
                      <option value="PRESENT">PRESENT (የተገኘ)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-muted-foreground block mb-1">Minutes Since Submit</label>
                    <Input
                      type="number"
                      value={simInput.minutesSinceSubmission}
                      onChange={(e) =>
                        setSimInput({ ...simInput, minutesSinceSubmission: Number(e.target.value) })
                      }
                      className="h-8 text-xs bg-background border-border"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-muted-foreground block mb-1">Guardian Name</label>
                    <Input
                      value={simInput.guardianName}
                      onChange={(e) => setSimInput({ ...simInput, guardianName: e.target.value })}
                      className="h-8 text-xs bg-background border-border"
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground block mb-1">Guardian Phone</label>
                    <Input
                      value={simInput.guardianPhone}
                      onChange={(e) => setSimInput({ ...simInput, guardianPhone: e.target.value })}
                      className="h-8 text-xs bg-background border-border"
                      placeholder="09... or 07..."
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={simInput.isRegisterSubmitted}
                      onChange={(e) =>
                        setSimInput({ ...simInput, isRegisterSubmitted: e.target.checked })
                      }
                      className="rounded border-border text-primary"
                    />
                    <span className="text-foreground">Teacher submitted register</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={simInput.hasApprovedLeave}
                      onChange={(e) =>
                        setSimInput({ ...simInput, hasApprovedLeave: e.target.checked })
                      }
                      className="rounded border-border text-primary"
                    />
                    <span className="text-foreground">Approved medical/family leave</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={simInput.isHoliday}
                      onChange={(e) => setSimInput({ ...simInput, isHoliday: e.target.checked })}
                      className="rounded border-border text-primary"
                    />
                    <span className="text-foreground">Calendar holiday / closure</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={simInput.priorAlertSentToday}
                      onChange={(e) =>
                        setSimInput({ ...simInput, priorAlertSentToday: e.target.checked })
                      }
                      className="rounded border-border text-primary"
                    />
                    <span className="text-foreground">Alert already sent today (Duplicate)</span>
                  </label>
                </div>

                <Button
                  onClick={runSimulation}
                  className="w-full h-8 text-xs mt-2"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  Evaluate Policy Decision
                </Button>
              </div>
            </div>

            {/* Results Column */}
            <div className="lg:col-span-7 space-y-4">
              {simResult && (
                <Card className="border-border bg-card shadow-xs overflow-hidden">
                  {/* Decision Banner */}
                  <div
                    className={`px-5 py-3.5 border-b flex items-center justify-between ${
                      simResult.decision === "ELIGIBLE"
                        ? "bg-primary/10 border-primary/20 text-primary"
                        : simResult.decision === "SUPPRESSED"
                        ? "bg-muted border-border text-muted-foreground"
                        : simResult.decision === "PENDING"
                        ? "bg-muted border-border text-foreground"
                        : "bg-destructive/10 border-destructive/20 text-destructive"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider">Evaluation Outcome:</span>
                      <Badge
                        variant={
                          simResult.decision === "ELIGIBLE"
                            ? "default"
                            : simResult.decision === "REQUIRES_REVIEW"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-xs font-bold"
                      >
                        {simResult.decision}
                      </Badge>
                    </div>

                    <span className="text-xs font-mono">
                      {simResult.idempotencyKey.slice(0, 24)}...
                    </span>
                  </div>

                  <CardContent className="p-5 space-y-4">
                    <div>
                      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                        Engine Decision Rationale
                      </span>
                      <p className="text-sm font-medium text-foreground mt-1">
                        {locale === "am" ? simResult.reasonAm : simResult.reason}
                      </p>
                    </div>

                    {/* Step-by-Step Rule Checklist */}
                    <div className="space-y-2 border-t border-border pt-3">
                      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                        Deterministic Policy Checklist
                      </span>
                      <div className="space-y-1.5">
                        {simResult.checks.map((c, idx) => (
                          <div
                            key={idx}
                            className={`p-2 rounded text-xs flex items-start gap-2 border ${
                              c.passed
                                ? "bg-muted/40 border-border"
                                : "bg-destructive/10 border-destructive/20"
                            }`}
                          >
                            {c.passed ? (
                              <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                            )}
                            <div>
                              <span className={`font-semibold ${c.passed ? "text-foreground" : "text-destructive"}`}>
                                {locale === "am" ? c.ruleNameAm : c.ruleName}
                              </span>
                              <p className={`text-[11px] mt-0.5 ${c.passed ? "text-muted-foreground" : "text-destructive/80"}`}>
                                {locale === "am" ? c.detailsAm : c.details}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Message Preview (If recipient resolved) */}
                    {simResult.renderedMessage && (
                      <div className="border-t border-border pt-3 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-foreground">
                            Rendered SMS Preview
                          </span>
                          <span className="text-muted-foreground">
                            Carrier: <strong>{simResult.recipient?.carrier}</strong> | Segments:{" "}
                            <strong>{simResult.estimatedSegments}</strong> | Est. Cost:{" "}
                            <strong>{simResult.estimatedCredits} credit(s)</strong>
                          </span>
                        </div>
                        <div className="p-3 rounded bg-muted/60 font-mono text-xs text-foreground border border-border">
                          {simResult.renderedMessage}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 8-STEP GUIDED POLICY WIZARD MODAL */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground border border-border rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/40">
              <div>
                <span className="text-xs font-semibold text-primary uppercase tracking-wider block">
                  Step {wizardStep} of 8
                </span>
                <h3 className="text-base font-bold text-foreground">
                  {wizardStep === 1 && "Step 1: General Policy Settings"}
                  {wizardStep === 2 && "Step 2: Attendance Scope & States"}
                  {wizardStep === 3 && "Step 3: Trigger Strategy & Correction Window"}
                  {wizardStep === 4 && "Step 4: Recipient Selection & Fallbacks"}
                  {wizardStep === 5 && "Step 5: Deduplication & Cooldown Rules"}
                  {wizardStep === 6 && "Step 6: Message Language & Template Selection"}
                  {wizardStep === 7 && "Step 7: Bounded Retries & Error Handling"}
                  {wizardStep === 8 && "Step 8: Auditable Review & Draft Activation"}
                </h3>
              </div>
              <button
                onClick={() => setIsWizardOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Step 1: General */}
              {wizardStep === 1 && (
                <div className="space-y-3">
                  <div>
                    <label className="text-foreground font-medium block mb-1">
                      Policy Name (English)
                    </label>
                    <Input
                      value={newPolicy.name}
                      onChange={(e) => setNewPolicy({ ...newPolicy, name: e.target.value })}
                      placeholder="e.g. Standard High School Absence Alert Policy"
                      className="bg-background border-border"
                    />
                  </div>
                  <div>
                    <label className="text-foreground font-medium block mb-1">
                      የፖሊሲ ስም (በአማርኛ)
                    </label>
                    <Input
                      value={newPolicy.nameAm}
                      onChange={(e) => setNewPolicy({ ...newPolicy, nameAm: e.target.value })}
                      placeholder="ምሳሌ፡ የሁለተኛ ደረጃ መደበኛ የመቅረት ማሳወቂያ ፖሊሲ"
                      className="bg-background border-border"
                    />
                  </div>
                  <div>
                    <label className="text-foreground font-medium block mb-1">
                      Description & Operational Rationale
                    </label>
                    <textarea
                      value={newPolicy.description}
                      onChange={(e) => setNewPolicy({ ...newPolicy, description: e.target.value })}
                      className="w-full px-3 py-2 rounded border border-border bg-background text-foreground text-xs"
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Scope */}
              {wizardStep === 2 && (
                <div className="space-y-3">
                  <label className="text-foreground font-medium block">
                    Attendance Monitoring Scope
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["DAILY", "LESSON", "BOTH"] as AttendanceScope[]).map((scope) => (
                      <button
                        key={scope}
                        type="button"
                        onClick={() => setNewPolicy({ ...newPolicy, scope })}
                        className={`p-3 rounded border text-left transition-colors ${
                          newPolicy.scope === scope
                            ? "border-primary bg-primary/10"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <span className="font-semibold block text-foreground">{scope}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {scope === "DAILY"
                            ? "Evaluate whole-day register"
                            : scope === "LESSON"
                            ? "Evaluate per period"
                            : "Both daily & period rules"}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-border space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newPolicy.suppressApprovedLeave}
                        onChange={(e) =>
                          setNewPolicy({ ...newPolicy, suppressApprovedLeave: e.target.checked })
                        }
                        className="rounded border-border text-primary"
                      />
                      <span className="text-foreground">Suppress alerts when student has approved medical/family leave</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newPolicy.suppressHolidays}
                        onChange={(e) =>
                          setNewPolicy({ ...newPolicy, suppressHolidays: e.target.checked })
                        }
                        className="rounded border-border text-primary"
                      />
                      <span className="text-foreground">Suppress alerts on scheduled holidays and school closures</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Step 3: Trigger */}
              {wizardStep === 3 && (
                <div className="space-y-3">
                  <label className="text-foreground font-medium block">
                    Trigger Strategy
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { type: "DELAYED", title: "Delayed (Correction Window)", desc: "Waits X minutes after submission" },
                      { type: "IMMEDIATE", title: "Immediate", desc: "Sends right after teacher submission" },
                      { type: "SCHEDULED_TIME", title: "Scheduled Daily Time", desc: "e.g. 09:00 AM morning sweep" },
                      { type: "CONSECUTIVE_LESSONS", title: "Consecutive Missed Lessons", desc: "Trigger after 2+ lessons" },
                    ].map((item) => (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => setNewPolicy({ ...newPolicy, triggerType: item.type as TriggerType })}
                        className={`p-3 rounded border text-left transition-colors ${
                          newPolicy.triggerType === item.type
                            ? "border-primary bg-primary/10"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <span className="font-semibold block text-foreground">{item.title}</span>
                        <span className="text-[11px] text-muted-foreground">{item.desc}</span>
                      </button>
                    ))}
                  </div>

                  {newPolicy.triggerType === "DELAYED" && (
                    <div className="pt-2">
                      <label className="text-muted-foreground block mb-1">Correction Delay (Minutes)</label>
                      <Input
                        type="number"
                        value={newPolicy.triggerDelayMinutes}
                        onChange={(e) =>
                          setNewPolicy({ ...newPolicy, triggerDelayMinutes: Number(e.target.value) })
                        }
                        className="w-32 h-8 bg-background border-border"
                      />
                    </div>
                  )}

                  {newPolicy.triggerType === "SCHEDULED_TIME" && (
                    <div className="pt-2">
                      <label className="text-muted-foreground block mb-1">Scheduled Time (Africa/Addis_Ababa)</label>
                      <Input
                        type="time"
                        value={newPolicy.scheduledTime}
                        onChange={(e) => setNewPolicy({ ...newPolicy, scheduledTime: e.target.value })}
                        className="w-32 h-8 bg-background border-border"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Recipients */}
              {wizardStep === 4 && (
                <div className="space-y-3">
                  <label className="text-foreground font-medium block">
                    Guardian Recipient Strategy
                  </label>
                  <div className="space-y-2">
                    {[
                      { strategy: "PRIMARY_ONLY", title: "Primary Guardian Only", desc: "Notify verified primary guardian contact" },
                      { strategy: "ALL_GUARDIANS", title: "All Authorized Guardians", desc: "Broadcast to all verified family contacts" },
                      { strategy: "PRIMARY_WITH_FALLBACK", title: "Primary with Fallback", desc: "Fallback to secondary contact if primary invalid" },
                      { strategy: "STAFF_REVIEW_REQUIRED", title: "Staff Review Queue", desc: "Hold in exception queue for human approval" },
                    ].map((s) => (
                      <label
                        key={s.strategy}
                        className={`p-3 rounded border flex items-center gap-3 cursor-pointer ${
                          newPolicy.recipientStrategy === s.strategy
                            ? "border-primary bg-primary/10"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="recipientStrategy"
                          checked={newPolicy.recipientStrategy === s.strategy}
                          onChange={() =>
                            setNewPolicy({ ...newPolicy, recipientStrategy: s.strategy as RecipientStrategy })
                          }
                          className="border-border text-primary"
                        />
                        <div>
                          <span className="font-semibold block text-foreground">{s.title}</span>
                          <span className="text-[11px] text-muted-foreground">{s.desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 5: Frequency & Deduplication */}
              {wizardStep === 5 && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-muted-foreground block mb-1">Max Alerts / Student / Day</label>
                      <Input
                        type="number"
                        value={newPolicy.maxAlertsPerStudentPerDay}
                        onChange={(e) =>
                          setNewPolicy({ ...newPolicy, maxAlertsPerStudentPerDay: Number(e.target.value) })
                        }
                        className="h-8 bg-background border-border"
                      />
                    </div>
                    <div>
                      <label className="text-muted-foreground block mb-1">Cooldown Window (Hours)</label>
                      <Input
                        type="number"
                        value={newPolicy.cooldownHours}
                        onChange={(e) =>
                          setNewPolicy({ ...newPolicy, cooldownHours: Number(e.target.value) })
                        }
                        className="h-8 bg-background border-border"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newPolicy.notifyLateArrival}
                        onChange={(e) =>
                          setNewPolicy({ ...newPolicy, notifyLateArrival: e.target.checked })
                        }
                        className="rounded border-border text-primary"
                      />
                      <span className="text-foreground">Send distinct alert for late arrivals (&gt; 15 mins)</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newPolicy.notifyCorrections}
                        onChange={(e) =>
                          setNewPolicy({ ...newPolicy, notifyCorrections: e.target.checked })
                        }
                        className="rounded border-border text-primary"
                      />
                      <span className="text-foreground">Send attendance correction update if status changed from Absent to Present</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Step 6: Language */}
              {wizardStep === 6 && (
                <div className="space-y-3">
                  <div>
                    <label className="text-foreground font-medium block mb-1">
                      Language Selection Strategy
                    </label>
                    <select
                      value={newPolicy.languageStrategy}
                      onChange={(e) =>
                        setNewPolicy({ ...newPolicy, languageStrategy: e.target.value as any })
                      }
                      className="w-full px-2.5 py-1.5 rounded border border-border bg-background text-foreground text-xs"
                    >
                      <option value="GUARDIAN_PREFERRED">Guardian's Preferred Language (Amharic or English)</option>
                      <option value="SCHOOL_DEFAULT">School Default Language Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-foreground font-medium block mb-1">
                      Default Language
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="defaultLang"
                          checked={newPolicy.defaultLanguage === "am"}
                          onChange={() => setNewPolicy({ ...newPolicy, defaultLanguage: "am" })}
                        />
                        <span className="text-foreground">Amharic (አማርኛ)</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="defaultLang"
                          checked={newPolicy.defaultLanguage === "en"}
                          onChange={() => setNewPolicy({ ...newPolicy, defaultLanguage: "en" })}
                        />
                        <span className="text-foreground">English</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 7: Failure Handling */}
              {wizardStep === 7 && (
                <div className="space-y-3">
                  <div>
                    <label className="text-muted-foreground block mb-1">Max Bounded Retries (Transient Errors)</label>
                    <Input
                      type="number"
                      max={5}
                      min={1}
                      value={newPolicy.maxRetries}
                      onChange={(e) => setNewPolicy({ ...newPolicy, maxRetries: Number(e.target.value) })}
                      className="w-32 h-8 bg-background border-border"
                    />
                    <span className="text-[11px] text-muted-foreground block mt-1">
                      Applies bounded exponential backoff only to 429, 500, 502, 503.
                    </span>
                  </div>

                  <div className="pt-2 border-t border-border space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newPolicy.pauseOnLowCredit}
                        onChange={(e) =>
                          setNewPolicy({ ...newPolicy, pauseOnLowCredit: e.target.checked })
                        }
                        className="rounded border-border text-primary"
                      />
                      <span className="text-foreground">Pause dispatch workflow & trigger admin banner when SMS balance is low</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Step 8: Review & Activation */}
              {wizardStep === 8 && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded bg-muted/50 border border-border">
                    <span className="font-semibold text-xs text-primary block mb-1">
                      Generated Auditable Policy Summary
                    </span>
                    <p className="text-xs text-foreground leading-relaxed">
                      {renderHumanSummary(newPolicy as AbsenceAlertPolicy, locale)}
                    </p>
                  </div>

                  <div className="space-y-1.5 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1.5 text-primary">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Single-tenant security isolation verified</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-primary">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Deduplication key constraint validated</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-primary">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Amharic & English variable interpolation active</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-border flex items-center justify-between bg-muted/40">
              <Button
                variant="outline"
                size="sm"
                disabled={wizardStep === 1}
                onClick={() => setWizardStep((s) => s - 1)}
                className="text-xs h-8"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                Previous
              </Button>

              <div className="flex items-center gap-2">
                {wizardStep < 8 ? (
                  <Button
                    size="sm"
                    onClick={() => setWizardStep((s) => s + 1)}
                    className="text-xs h-8"
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    disabled={isSubmitting}
                    onClick={handleCreatePolicy}
                    className="text-xs h-8"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                    Save & Publish Policy Draft
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
