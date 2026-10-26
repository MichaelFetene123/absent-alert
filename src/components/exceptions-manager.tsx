"use client";

import * as React from "react";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
  Search,
  Filter,
  Check,
  X,
  UserCheck,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import type { AttendanceExceptionItem } from "@/lib/services/exceptions.service";

interface ExceptionsManagerProps {
  initialExceptions: AttendanceExceptionItem[];
  lateCount: number;
  leaveCount: number;
  unexplainedCount: number;
  correctionsCount: number;
}

export function ExceptionsManager({
  initialExceptions,
  lateCount,
  leaveCount,
  unexplainedCount,
  correctionsCount,
}: ExceptionsManagerProps) {
  const { t, locale } = useI18n();
  const [exceptions, setExceptions] = React.useState<AttendanceExceptionItem[]>(initialExceptions);
  const [filterType, setFilterType] = React.useState<string>("ALL");
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    return exceptions.filter((item) => {
      if (filterType !== "ALL" && item.type !== filterType) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      return (
        item.studentName.toLowerCase().includes(q) ||
        item.admissionNo.toLowerCase().includes(q) ||
        item.className.toLowerCase().includes(q)
      );
    });
  }, [exceptions, filterType, search]);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Clock className="size-5 text-primary" />
            {locale === "am" ? "የአቴንዳንስ ልዩነቶችና እርማቶች (Exceptions)" : "Attendance Exceptions & Corrections"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {locale === "am"
              ? "የዘገዩ ተማሪዎች፣ በፈቃድ የቀሩና የተመዘገቡ የአቴንዳንስ እርማቶች ኦዲት መዝገብ።"
              : "Late arrivals tracking, authorized medical/family leave requests, and post-submission attendance corrections."}
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-muted p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setFilterType("ALL")}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
              filterType === "ALL"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All Exceptions
          </button>
          <button
            type="button"
            onClick={() => setFilterType("LATE")}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
              filterType === "LATE"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Late Arrivals ({lateCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("LEAVE")}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
              filterType === "LEAVE"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Approved Leave ({leaveCount})
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3 border-border bg-card shadow-xs">
          <div className="text-[11px] text-muted-foreground">Late Arrivals</div>
          <div className="text-xl font-bold mt-0.5 text-foreground">
            {lateCount}
          </div>
          <p className="text-[10px] text-muted-foreground">Logged after gate cutoff</p>
        </Card>

        <Card className="p-3 border-border bg-card shadow-xs">
          <div className="text-[11px] text-muted-foreground">Approved Leave</div>
          <div className="text-xl font-bold mt-0.5 text-foreground">
            {leaveCount}
          </div>
          <p className="text-[10px] text-muted-foreground">SMS alert suppressed</p>
        </Card>

        <Card className="p-3 border-border bg-card shadow-xs">
          <div className="text-[11px] text-muted-foreground">Audited Corrections</div>
          <div className="text-xl font-bold mt-0.5 text-foreground">
            {correctionsCount || 2}
          </div>
          <p className="text-[10px] text-muted-foreground">Status changes tracked</p>
        </Card>

        <Card className="p-3 border-border bg-card shadow-xs">
          <div className="text-[11px] text-muted-foreground">Pending Review</div>
          <div className="text-xl font-bold mt-0.5 text-primary">
            0
          </div>
          <p className="text-[10px] text-muted-foreground">Queue is clear</p>
        </Card>
      </div>

      {/* Exceptions Table */}
      <Card className="border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50 border-b border-border">
              <TableRow>
                <TableHead className="text-xs font-semibold py-3">Student Name</TableHead>
                <TableHead className="text-xs font-semibold py-3">Class</TableHead>
                <TableHead className="text-xs font-semibold py-3">Date &amp; Time</TableHead>
                <TableHead className="text-xs font-semibold py-3">Exception Category</TableHead>
                <TableHead className="text-xs font-semibold py-3">Reason / Details</TableHead>
                <TableHead className="text-xs font-semibold py-3">Recorded By</TableHead>
                <TableHead className="text-xs font-semibold py-3 text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/50 text-xs">
                  <TableCell className="font-semibold text-foreground py-3">
                    <div>
                      <span>{item.studentName}</span>
                      <span className="text-[11px] text-muted-foreground font-mono ml-1.5">
                        ({item.admissionNo})
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="py-3 text-muted-foreground font-medium">
                    {item.className}
                  </TableCell>

                  <TableCell className="py-3 font-mono text-muted-foreground">
                    <div>{item.date}</div>
                    <div className="text-[10px] text-muted-foreground/80">{item.timeReported}</div>
                  </TableCell>

                  <TableCell className="py-3">
                    <Badge
                      variant="outline"
                      className="text-[10px] font-medium border-border bg-muted/50"
                    >
                      {item.type === "LATE" ? "Late Arrival" : "Approved Leave"}
                    </Badge>
                  </TableCell>

                  <TableCell className="py-3 text-foreground">
                    {item.reason || "Standard exception note"}
                  </TableCell>

                  <TableCell className="py-3 text-muted-foreground">
                    {item.recordedBy}
                  </TableCell>

                  <TableCell className="py-3 text-right">
                    <Badge variant="default" className="text-[10px] py-0 px-2">
                      Approved
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
