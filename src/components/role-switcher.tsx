"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  GraduationCap,
  UserCheck,
  ClipboardCheck,
  Smartphone,
  Users,
  Check,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/context";

export type SystemRole =
  | "ADMIN"
  | "TEACHER"
  | "HOMEROOM"
  | "ATTENDANCE_OFFICER"
  | "SMS_ADMIN"
  | "PARENT";

const ROLES_META: Array<{
  id: SystemRole;
  titleKey: string;
  descKey: string;
  icon: any;
  color: string;
  badge: string;
}> = [
  {
    id: "ADMIN",
    titleKey: "School Administrator",
    descKey: "Full access to school-wide metrics, class submissions, SMSHub balances, teacher roster, and settings.",
    icon: Shield,
    color: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800",
    badge: "Admin",
  },
  {
    id: "TEACHER",
    titleKey: "Subject Teacher",
    descKey: "High-speed classroom attendance-taking for assigned classes with roster shortcuts.",
    icon: GraduationCap,
    color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800",
    badge: "Teacher",
  },
  {
    id: "HOMEROOM",
    titleKey: "Homeroom / Class Teacher",
    descKey: "Assigned section roster tracking, chronic absenteeism follow-up, and direct parent contact review.",
    icon: UserCheck,
    color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800",
    badge: "Homeroom",
  },
  {
    id: "ATTENDANCE_OFFICER",
    titleKey: "Attendance Officer",
    descKey: "Consolidated missing attendance queue, late arrivals processing, and attendance correction reviews.",
    icon: ClipboardCheck,
    color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800",
    badge: "Officer",
  },
  {
    id: "SMS_ADMIN",
    titleKey: "SMS & System Administrator",
    descKey: "SMSHub API credentials, test mode validation, credit consumption monitoring, and webhook logs.",
    icon: Smartphone,
    color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800",
    badge: "SMS Admin",
  },
  {
    id: "PARENT",
    titleKey: "Parent & Guardian Management",
    descKey: "Guardian records, verified phone numbers, and notification delivery channels.",
    icon: Users,
    color: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800",
    badge: "Guardian",
  },
];

interface RoleSwitcherProps {
  currentRole: string;
  onRoleChange?: (role: SystemRole) => void;
}

export function RoleSwitcher({ currentRole, onRoleChange }: RoleSwitcherProps) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [open, setOpen] = React.useState(false);
  const [activeRole, setActiveRole] = React.useState<SystemRole>(
    (currentRole as SystemRole) || "ADMIN"
  );

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("absent_alert_preview_role");
      if (saved && ROLES_META.some((r) => r.id === saved)) {
        setActiveRole(saved as SystemRole);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSelectRole = (role: SystemRole) => {
    setActiveRole(role);
    try {
      localStorage.setItem("absent_alert_preview_role", role);
    } catch {
      // ignore
    }
    if (onRoleChange) {
      onRoleChange(role);
    }
    setOpen(false);

    if (role === "PARENT") {
      router.push("/guardians");
    } else {
      router.push("/dashboard");
    }
  };

  const activeMeta = ROLES_META.find((r) => r.id === activeRole) || ROLES_META[0];
  const Icon = activeMeta.icon;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs"
        title="Switch role view"
      >
        <Icon className="size-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
        <span className="font-semibold text-slate-800 dark:text-slate-200 max-w-[100px] sm:max-w-none truncate">
          {activeMeta.badge}
        </span>
        <ChevronDown className="size-3 text-slate-400" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg p-5">
          <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Shield className="size-5 text-indigo-600 dark:text-indigo-400" />
              <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
                {locale === "am" ? "የስራ ሚና እይታ ቀይር (Role Preview)" : "Role-Based SaaS Experience"}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {locale === "am"
                ? "የተለያዩ ባለድርሻ አካላት (አስተዳዳሪ፣ መምህር፣ የክፍል ኃላፊ፣ የአቴንዳንስ ኦፊሰር፣ የወላጅ ፖርታል) የሚያዩትን ገጽ ይሞክሩ።"
                : "Experience the platform from the perspective of each key educational stakeholder."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3">
            {ROLES_META.map((role) => {
              const isSelected = activeRole === role.id;
              const RoleIcon = role.icon;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleSelectRole(role.id)}
                  className={`flex flex-col text-left p-3 rounded-xl border transition-all relative ${
                    isSelected
                      ? "border-indigo-600 dark:border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 shadow-xs ring-1 ring-indigo-500/20"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <div className={`p-1.5 rounded-lg border ${role.color}`}>
                      <RoleIcon className="size-4" />
                    </div>
                    {isSelected && (
                      <Badge className="bg-indigo-600 text-white text-[10px] h-5 px-1.5 gap-1">
                        <Check className="size-3" />
                        Active
                      </Badge>
                    )}
                  </div>
                  <div className="font-semibold text-xs text-slate-900 dark:text-white">
                    {role.titleKey}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-snug">
                    {role.descKey}
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
