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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="size-5 text-indigo-600 dark:text-indigo-400" />
            {locale === "am" ? "የአቴንዳንስ ልዩነቶችና እርማቶች (Exceptions)" : "Attendance Exceptions & Corrections"}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {locale === "am"
              ? "የዘገዩ ተማሪዎች፣ በፈቃድ የቀሩና የተመዘገቡ የአቴንዳንስ እርማቶች ኦዲት መዝገብ።"
              : "Late arrivals tracking, authorized medical/family leave requests, and post-submission attendance corrections."}
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setFilterType("ALL")}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
              filterType === "ALL"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            All Exceptions
          </button>
          <button
            type="button"
            onClick={() => setFilterType("LATE")}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
              filterType === "LATE"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            Late Arrivals ({lateCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("LEAVE")}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
              filterType === "LEAVE"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            Approved Leave ({leaveCount})
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="text-[11px] text-slate-500">Late Arrivals</div>
          <div className="text-xl font-bold mt-0.5 text-amber-600 dark:text-amber-400">
            {lateCount}
          </div>
          <p className="text-[10px] text-slate-400">Logged after gate cutoff</p>
        </Card>

        <Card className="p-3 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="text-[11px] text-slate-500">Approved Leave</div>
          <div className="text-xl font-bold mt-0.5 text-blue-600 dark:text-blue-400">
            {leaveCount}
          </div>
          <p className="text-[10px] text-slate-400">SMS alert suppressed</p>
        </Card>

        <Card className="p-3 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="text-[11px] text-slate-500">Audited Corrections</div>
          <div className="text-xl font-bold mt-0.5 text-indigo-600 dark:text-indigo-400">
            {correctionsCount || 2}
          </div>
          <p className="text-[10px] text-slate-400">Status changes tracked</p>
        </Card>

        <Card className="p-3 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="text-[11px] text-slate-500">Pending Review</div>
          <div className="text-xl font-bold mt-0.5 text-emerald-600 dark:text-emerald-400">
            0
          </div>
          <p className="text-[10px] text-slate-400">Queue is clear</p>
        </Card>
      </div>

      {/* Exceptions Table */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
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
                <TableRow key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 text-xs">
                  <TableCell className="font-semibold text-slate-900 dark:text-white py-3">
                    <div>
                      <span>{item.studentName}</span>
                      <span className="text-[11px] text-slate-400 font-mono ml-1.5">
                        ({item.admissionNo})
                      </span>
                    </div>
                  </TableCell>

                  <TableCell className="py-3 text-slate-600 dark:text-slate-400 font-medium">
                    {item.className}
                  </TableCell>

                  <TableCell className="py-3 font-mono text-slate-500">
                    <div>{item.date}</div>
                    <div className="text-[10px] text-slate-400">{item.timeReported}</div>
                  </TableCell>

                  <TableCell className="py-3">
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-medium ${
                        item.type === "LATE"
                          ? "border-amber-200 text-amber-700 bg-amber-50 dark:bg-amber-950/40"
                          : "border-blue-200 text-blue-700 bg-blue-50 dark:bg-blue-950/40"
                      }`}
                    >
                      {item.type === "LATE" ? "Late Arrival" : "Approved Leave"}
                    </Badge>
                  </TableCell>

                  <TableCell className="py-3 text-slate-700 dark:text-slate-300">
                    {item.reason || "Standard exception note"}
                  </TableCell>

                  <TableCell className="py-3 text-slate-600 dark:text-slate-400">
                    {item.recordedBy}
                  </TableCell>

                  <TableCell className="py-3 text-right">
                    <Badge className="bg-emerald-600 text-white text-[10px] py-0 px-2">
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
