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
    toast.success("School operational settings saved.");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="pb-2 border-b border-border">
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Settings className="size-5 text-primary" />
          {locale === "am" ? "የትምህርት ቤት አጠቃላይ ቅንብሮች" : "School Settings"}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {locale === "am"
            ? "የትምህርት ዘመን፣ የስራ ቀናትና የማርፈድ ገደብ ቅንብሮችን ያዋቅሩ።"
            : "Institutional parameters, academic calendar defaults, and late arrival thresholds."}
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* School Profile */}
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <School className="size-4 text-primary" />
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
                  className="text-xs bg-background border-border"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Active Academic Year</Label>
                <Input
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="text-xs bg-background border-border"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Timing & Threshold Rules */}
        <Card className="border-border shadow-xs">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="size-4 text-primary" />
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
                  className="text-xs bg-background border-border"
                />
                <p className="text-[11px] text-muted-foreground">
                  Arrivals after this many minutes past bell are logged as Late.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Teacher Submission Deadline</Label>
                <Input
                  value={submissionCutoff}
                  onChange={(e) => setSubmissionCutoff(e.target.value)}
                  className="text-xs bg-background border-border"
                />
                <p className="text-[11px] text-muted-foreground">
                  Submissions missing after this time trigger Missing Attendance alerts.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="sm" className="text-xs h-9 gap-1.5">
            <Save className="size-3.5" />
            <span>Save School Settings</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
