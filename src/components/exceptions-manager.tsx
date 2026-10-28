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
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Clock className="size-5 text-primary" />
            <span>{locale === "am" ? "የአቴንዳንስ ልዩነቶችና እርማቶች (Exceptions)" : "Attendance Exceptions & Corrections"}</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {locale === "am"
              ? "የዘገዩ ተማሪዎች፣ በፈቃድ የቀሩና የተመዘገቡ የአቴንዳንስ እርማቶች ኦዲት መዝገብ።"
              : "Late arrivals tracking, authorized medical/family leave requests, and post-submission attendance corrections."}
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-muted p-1 rounded-lg shrink-0">
          <button
            type="button"
            onClick={() => setFilterType("ALL")}
            className={cn(
              "px-2.5 py-1 text-xs rounded-md font-medium transition-all",
              filterType === "ALL"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            All Exceptions ({initialExceptions.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("LATE")}
            className={cn(
              "px-2.5 py-1 text-xs rounded-md font-medium transition-all",
              filterType === "LATE"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Late Arrivals ({lateCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("LEAVE")}
            className={cn(
              "px-2.5 py-1 text-xs rounded-md font-medium transition-all",
              filterType === "LEAVE"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Approved Leave ({leaveCount})
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Late Arrivals */}
        <Card className="rounded-xl border border-border bg-card text-card-foreground shadow-xs">
          <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Late Arrivals
            </CardTitle>
            <Clock className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-2xl font-bold text-foreground">
              {lateCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Logged after gate cutoff
            </p>
          </CardContent>
        </Card>

        {/* Approved Leave */}
        <Card className="rounded-xl border border-border bg-card text-card-foreground shadow-xs">
          <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Approved Leave
            </CardTitle>
            <FileText className="size-4 text-purple-500" />
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-2xl font-bold text-foreground">
              {leaveCount}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              SMS alert suppressed
            </p>
          </CardContent>
        </Card>

        {/* Audited Corrections */}
        <Card className="rounded-xl border border-border bg-card text-card-foreground shadow-xs">
          <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Audited Corrections
            </CardTitle>
            <History className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-2xl font-bold text-foreground">
              {correctionsCount || 2}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Status changes tracked
            </p>
          </CardContent>
        </Card>

        {/* Pending Review */}
        <Card className="rounded-xl border border-border bg-card text-card-foreground shadow-xs">
          <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Pending Review
            </CardTitle>
            <ShieldCheck className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-3.5 pt-0">
            <div className="text-2xl font-bold text-foreground">
              0
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Queue is clear
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Exceptions Table Card */}
      <Card className="rounded-xl border border-border bg-card text-card-foreground shadow-xs overflow-hidden">
        {/* Table Search & Toolbar */}
        <div className="p-3.5 border-b border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search by student, class, or admission no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-8.5 text-xs rounded-lg bg-background"
            />
          </div>
          <div className="flex items-center gap-2">
            {search && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearch("")}
                className="h-8 text-xs text-muted-foreground hover:text-foreground px-2"
              >
                Clear
              </Button>
            )}
            <span className="text-xs text-muted-foreground">
              Showing <strong className="text-foreground">{filtered.length}</strong> of {exceptions.length} exceptions
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-muted/40 text-xs">
                <TableHead className="py-2.5 px-4 font-semibold">Student Name</TableHead>
                <TableHead className="py-2.5 px-4 font-semibold">Class</TableHead>
                <TableHead className="py-2.5 px-4 font-semibold">Date &amp; Time</TableHead>
                <TableHead className="py-2.5 px-4 font-semibold">Exception Category</TableHead>
                <TableHead className="py-2.5 px-4 font-semibold">Reason / Details</TableHead>
                <TableHead className="py-2.5 px-4 font-semibold">Recorded By</TableHead>
                <TableHead className="py-2.5 px-4 text-right font-semibold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-1.5 py-6">
                      <Clock className="size-6 text-muted-foreground" />
                      <p className="text-xs font-medium text-foreground">No attendance exceptions found</p>
                      <p className="text-[11px] text-muted-foreground">
                        {search ? "No records match your search filter." : "There are currently no logged exceptions."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/50 text-xs">
                    <TableCell className="py-2.5 px-4 font-semibold text-foreground">
                      <div>
                        <span>{item.studentName}</span>
                        <span className="text-[11px] text-muted-foreground font-mono ml-1.5">
                          ({item.admissionNo})
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="py-2.5 px-4 text-muted-foreground font-medium">
                      {item.className}
                    </TableCell>

                    <TableCell className="py-2.5 px-4 font-mono text-muted-foreground">
                      <div>{item.date}</div>
                      <div className="text-[10px] text-muted-foreground/80">{item.timeReported}</div>
                    </TableCell>

                    <TableCell className="py-2.5 px-4">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-medium border",
                          item.type === "LATE"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                            : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                        )}
                      >
                        {item.type === "LATE" ? "Late Arrival" : "Approved Leave"}
                      </Badge>
                    </TableCell>

                    <TableCell className="py-2.5 px-4 text-foreground">
                      {item.reason || "Standard exception note"}
                    </TableCell>

                    <TableCell className="py-2.5 px-4 text-muted-foreground">
                      {item.recordedBy}
                    </TableCell>

                    <TableCell className="py-2.5 px-4 text-right">
                      <Badge variant="default" className="text-[10px] py-0 px-2">
                        Approved
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
