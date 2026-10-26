"use client";

import * as React from "react";
import {
  Settings,
  School,
  Calendar,
  Clock,
  Shield,
  Bell,
  CheckCircle2,
  Save,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";

export function SchoolSettingsManager() {
  const { t, locale } = useI18n();

  const [schoolName, setSchoolName] = React.useState("Addis Ababa Academy");
  const [academicYear, setAcademicYear] = React.useState("2017 E.C. (2024/2025)");
  const [lateThreshold, setLateThreshold] = React.useState("15");
  const [submissionCutoff, setSubmissionCutoff] = React.useState("10:00 AM");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("School attendance policies and operational settings saved.");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="size-5 text-indigo-600 dark:text-indigo-400" />
          {locale === "am" ? "የትምህርት ቤት አጠቃላይ ቅንብሮችና ፖሊሲዎች" : "School Settings & Attendance Policies"}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {locale === "am"
            ? "የትምህርት ዘመን፣ የስራ ቀናት፣ የማርፈድ ገደብና የመገኘት መቆጣጠሪያ ፖሊሲዎችን ያዋቅሩ።"
            : "Institutional parameters, academic calendar defaults, late arrival thresholds, and notification rules."}
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* School Profile */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <School className="size-4 text-indigo-600" />
              Institutional Identity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">School Name</Label>
                <Input
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="text-xs bg-slate-50 dark:bg-slate-950"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Active Academic Year</Label>
                <Input
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="text-xs bg-slate-50 dark:bg-slate-950"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Policy Rules */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="size-4 text-indigo-600" />
              Attendance Timing &amp; Thresholds
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Late Arrival Threshold (Minutes)</Label>
                <Input
                  type="number"
                  value={lateThreshold}
                  onChange={(e) => setLateThreshold(e.target.value)}
                  className="text-xs bg-slate-50 dark:bg-slate-950"
                />
                <p className="text-[11px] text-slate-400">
                  Arrivals after this many minutes past bell are logged as Late.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Teacher Submission Deadline</Label>
                <Input
                  value={submissionCutoff}
                  onChange={(e) => setSubmissionCutoff(e.target.value)}
                  className="text-xs bg-slate-50 dark:bg-slate-950"
                />
                <p className="text-[11px] text-slate-400">
                  Submissions missing after this time trigger Missing Attendance alerts.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 gap-1.5">
            <Save className="size-3.5" />
            <span>Save School Policies</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
