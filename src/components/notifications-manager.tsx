"use client";

import * as React from "react";
import {
  History,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Search,
  Copy,
  Check,
  RotateCcw,
  Smartphone,
  School,
  Info,
  FilterX,
  CheckCheck,
  AlertTriangle,
  Send,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  retryNotification,
  batchRetryFailedNotificationsAction,
} from "@/actions/notification.actions";
import type {
  NotificationHistoryItem,
  NotificationHistoryResult,
  NotificationHistoryAttempt,
} from "@/lib/services/notification.service";
import { useRouter } from "next/navigation";

type Props = {
  initialData: NotificationHistoryResult;
  selectedStatus?: string;
  selectedClassId?: string;
};

export function NotificationsManager({
  initialData,
  selectedStatus,
  selectedClassId,
}: Props) {
  const router = useRouter();

  // Filter state
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>(selectedStatus || "ALL");
  const [classFilter, setClassFilter] = React.useState<string>(selectedClassId || "ALL");
  const [page, setPage] = React.useState(1);
  const pageSize = 15;

  // Selected notification for modal
  const [selectedNotif, setSelectedNotif] = React.useState<NotificationHistoryItem | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  // Loading states
  const [retryingId, setRetryingId] = React.useState<string | null>(null);
  const [isBatchRetrying, setIsBatchRetrying] = React.useState(false);
  const [copiedRefId, setCopiedRefId] = React.useState<string | null>(null);
  const [copiedJson, setCopiedJson] = React.useState(false);

  // Client-side filtering & search
  const filteredItems = React.useMemo(() => {
    return initialData.items.filter((item) => {
      // Status filter
      if (statusFilter !== "ALL") {
        if (statusFilter === "NEEDS_REVIEW") {
          if (!item.needsReview) return false;
        } else if (item.status !== statusFilter) {
          return false;
        }
      }

      // Class filter
      if (classFilter !== "ALL" && item.student.classId !== classFilter) {
        return false;
      }

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchName = item.student.fullName.toLowerCase().includes(q);
        const matchAdm = item.student.admissionNo.toLowerCase().includes(q);
        const matchPhone = item.guardianPhone.toLowerCase().includes(q);
        const matchRef = item.providerRef?.toLowerCase().includes(q) ?? false;
        const matchBody = item.body.toLowerCase().includes(q);

        if (!matchName && !matchAdm && !matchPhone && !matchRef && !matchBody) {
          return false;
        }
      }

      return true;
    });
  }, [initialData.items, statusFilter, classFilter, search]);

  // Paginated items
  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedItems = React.useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, page, pageSize]);

  // Handle single notification retry
  async function handleRetry(notif: NotificationHistoryItem) {
    if (!initialData.isAdmin) {
      toast.error("Unauthorized: Only administrators can retry SMS dispatch.");
      return;
    }

    setRetryingId(notif.id);
    try {
      const res = await retryNotification(notif.id);
      if (res.ok) {
        toast.success(`SMS retry accepted for ${notif.student.fullName}`, {
          description: res.providerRef ? `Provider ID: ${res.providerRef}` : undefined,
        });
        router.refresh();
      } else {
        toast.error(`Retry failed: ${res.error || "SMSHub rejected dispatch"}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to retry SMS");
    } finally {
      setRetryingId(null);
    }
  }

  // Handle batch retry of all failed notifications
  async function handleBatchRetry() {
    if (!initialData.isAdmin) {
      toast.error("Unauthorized: Only administrators can retry SMS dispatch.");
      return;
    }

    setIsBatchRetrying(true);
    try {
      const res = await batchRetryFailedNotificationsAction();
      if (res.ok) {
        toast.success(`Batch retry completed: ${res.sent} sent, ${res.failed} failed`, {
          description: `Processed ${res.total} notifications`,
        });
        router.refresh();
      } else {
        toast.error(`Batch retry partially failed: ${res.error || `${res.failed} errors`}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to execute batch retry");
    } finally {
      setIsBatchRetrying(false);
    }
  }

  // Copy helper
  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedRefId(id);
    setTimeout(() => setCopiedRefId(null), 2000);
  }

  function copyRawResponse(jsonObj: any) {
    navigator.clipboard.writeText(JSON.stringify(jsonObj, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  }

  // Relative time helper
  function formatRelativeTime(isoString: string): string {
    const ms = Date.parse(isoString);
    if (!ms) return "Recently";
    const sec = Math.floor((Date.now() - ms) / 1000);
    if (sec < 60) return "Just now";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hours = Math.floor(min / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  // Format date helper
  function formatDateTime(isoString: string): string {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <History className="size-6 text-purple-600 dark:text-purple-400" />
            SMS Notification History
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time delivery tracking, provider attempt logs, and automated retry system.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {initialData.isAdmin && initialData.summary.failed > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBatchRetry}
              disabled={isBatchRetrying}
              className="gap-2 shadow-xs"
            >
              {isBatchRetrying ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RotateCcw className="size-4" />
              )}
              Retry All Failed ({initialData.summary.failed})
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.refresh()}
            className="gap-2"
          >
            <RefreshCw className="size-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Card */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Total Notifications
            </CardTitle>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/40 rounded-lg text-purple-600 dark:text-purple-400">
              <History className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {initialData.summary.total}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Logged across accessible classes
            </p>
          </CardContent>
        </Card>

        {/* Accepted by Provider */}
        <Card className="border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-xs">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-400">
              Accepted by Provider
            </CardTitle>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg text-emerald-600 dark:text-emerald-300">
              <CheckCircle2 className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-200">
              {initialData.summary.accepted}
            </div>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
              {initialData.summary.total > 0
                ? `${Math.round((initialData.summary.accepted / initialData.summary.total) * 100)}% acceptance rate`
                : "No notifications logged yet"}
            </p>
          </CardContent>
        </Card>

        {/* Failed Delivery */}
        <Card className="border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/20 shadow-xs">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-rose-800 dark:text-rose-400">
              Failed Delivery
            </CardTitle>
            <div className="p-2 bg-rose-100 dark:bg-rose-900/50 rounded-lg text-rose-600 dark:text-rose-300">
              <AlertCircle className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-900 dark:text-rose-200">
              {initialData.summary.failed}
            </div>
            <p className="text-xs text-rose-700 dark:text-rose-400 mt-1">
              Eligible for safe manual / automated retry
            </p>
          </CardContent>
        </Card>

        {/* Queued / In Flight */}
        <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-950/20 shadow-xs">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-400">
              Queued / Sending
            </CardTitle>
            <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg text-amber-600 dark:text-amber-300">
              <Clock className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-900 dark:text-amber-200">
                {initialData.summary.pending + initialData.summary.sending}
              </span>
              {initialData.summary.needsReview > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-200 dark:bg-amber-900/70 text-amber-900 dark:text-amber-200">
                  {initialData.summary.needsReview} Need Review
                </span>
              )}
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
              {initialData.summary.pending} queued · {initialData.summary.sending} in-transit
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                placeholder="Search by student name, admission no, phone, provider ref..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-10"
              />
            </div>

            {/* Class Dropdown */}
            <div className="w-full md:w-56">
              <select
                value={classFilter}
                onChange={(e) => {
                  setClassFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full h-10 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              >
                <option value="ALL">All Classes</option>
                {initialData.accessibleClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            {(statusFilter !== "ALL" || classFilter !== "ALL" || search) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter("ALL");
                  setClassFilter("ALL");
                  setSearch("");
                  setPage(1);
                }}
                className="h-10 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 gap-1.5"
              >
                <FilterX className="size-4" />
                Clear
              </Button>
            )}
          </div>

          {/* Status Filter Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1">
              Status Filter:
            </span>

            <Button
              variant={statusFilter === "ALL" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setStatusFilter("ALL");
                setPage(1);
              }}
              className="h-7 text-xs px-2.5 rounded-full"
            >
              All ({initialData.summary.total})
            </Button>

            <Button
              variant={statusFilter === "ACCEPTED" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setStatusFilter("ACCEPTED");
                setPage(1);
              }}
              className="h-7 text-xs px-2.5 rounded-full border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            >
              <CheckCircle2 className="size-3 text-emerald-500 mr-1" />
              Accepted ({initialData.summary.accepted})
            </Button>

            <Button
              variant={statusFilter === "FAILED" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setStatusFilter("FAILED");
                setPage(1);
              }}
              className="h-7 text-xs px-2.5 rounded-full border-rose-300 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              <AlertCircle className="size-3 text-rose-500 mr-1" />
              Failed ({initialData.summary.failed})
            </Button>

            <Button
              variant={statusFilter === "PENDING" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setStatusFilter("PENDING");
                setPage(1);
              }}
              className="h-7 text-xs px-2.5 rounded-full"
            >
              <Clock className="size-3 text-slate-500 mr-1" />
              Queued ({initialData.summary.pending})
            </Button>

            <Button
              variant={statusFilter === "SENDING" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setStatusFilter("SENDING");
                setPage(1);
              }}
              className="h-7 text-xs px-2.5 rounded-full border-blue-300 dark:border-blue-800"
            >
              <Loader2 className="size-3 text-blue-500 mr-1 animate-spin" />
              Sending ({initialData.summary.sending})
            </Button>

            {initialData.summary.needsReview > 0 && (
              <Button
                variant={statusFilter === "NEEDS_REVIEW" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setStatusFilter("NEEDS_REVIEW");
                  setPage(1);
                }}
                className="h-7 text-xs px-2.5 rounded-full border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300"
              >
                <AlertTriangle className="size-3 text-amber-500 mr-1" />
                Needs Review ({initialData.summary.needsReview})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/80">
              <TableRow>
                <TableHead className="w-[170px]">Timestamp</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Guardian Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>Provider Ref</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <History className="size-10 text-slate-300 dark:text-slate-700 mb-2" />
                      <p className="text-base font-medium text-slate-700 dark:text-slate-300">
                        No notifications match the filter
                      </p>
                      <p className="text-sm text-slate-400 mt-1">
                        Try adjusting your search query, status, or class selection.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((notif) => {
                  const isRetrying = retryingId === notif.id;

                  return (
                    <TableRow
                      key={notif.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Timestamp */}
                      <TableCell className="align-middle">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            {formatDateTime(notif.createdAt)}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="size-3" />
                            {formatRelativeTime(notif.createdAt)}
                          </span>
                        </div>
                      </TableCell>

                      {/* Student */}
                      <TableCell className="align-middle">
                        <div className="flex flex-col">
                          <span className="font-medium text-sm text-slate-900 dark:text-slate-100">
                            {notif.student.fullName}
                          </span>
                          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                            {notif.student.admissionNo}
                          </span>
                        </div>
                      </TableCell>

                      {/* Class */}
                      <TableCell className="align-middle">
                        <Badge
                          variant="secondary"
                          className="font-normal text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        >
                          <School className="size-3 mr-1 text-slate-400" />
                          {notif.student.className}
                        </Badge>
                      </TableCell>

                      {/* Guardian Phone */}
                      <TableCell className="align-middle">
                        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-700 dark:text-slate-300">
                          <Smartphone className="size-3.5 text-slate-400" />
                          {notif.guardianPhone}
                        </div>
                      </TableCell>

                      {/* Status Badge */}
                      <TableCell className="align-middle">
                        <div className="flex flex-col items-start gap-1">
                          {notif.status === "ACCEPTED" && (
                            <Badge className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 font-medium text-xs gap-1">
                              <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                              Accepted by provider
                            </Badge>
                          )}

                          {notif.status === "DELIVERED" && (
                            <Badge className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 font-medium text-xs gap-1">
                              <CheckCheck className="size-3 text-emerald-600 dark:text-emerald-400" />
                              Delivered
                            </Badge>
                          )}

                          {notif.status === "FAILED" && (
                            <Badge className="bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-200 dark:border-rose-800/60 font-medium text-xs gap-1">
                              <AlertCircle className="size-3 text-rose-600 dark:text-rose-400" />
                              Failed
                            </Badge>
                          )}

                          {notif.status === "PENDING" && (
                            <Badge className="bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700 font-medium text-xs gap-1">
                              <Clock className="size-3 text-slate-500" />
                              Queued
                            </Badge>
                          )}

                          {notif.status === "SENDING" && (
                            <Badge className="bg-blue-100 hover:bg-blue-200 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200 dark:border-blue-800/60 font-medium text-xs gap-1">
                              <Loader2 className="size-3 text-blue-600 dark:text-blue-400 animate-spin" />
                              Sending
                            </Badge>
                          )}

                          {/* Needs Review flag if stuck >5 min */}
                          {notif.needsReview && (
                            <Badge
                              variant="outline"
                              className="text-[10px] py-0 px-1.5 border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 gap-1"
                            >
                              <AlertTriangle className="size-2.5" />
                              Needs Review (&gt;5m)
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      {/* Attempts */}
                      <TableCell className="align-middle">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedNotif(notif);
                            setDialogOpen(true);
                          }}
                          className="h-7 text-xs px-2 gap-1 text-slate-600 dark:text-slate-300 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                        >
                          <span className="font-semibold">{notif.attempts.length}</span>
                          <span>{notif.attempts.length === 1 ? "attempt" : "attempts"}</span>
                          <Info className="size-3 text-slate-400 ml-0.5" />
                        </Button>
                      </TableCell>

                      {/* Provider Reference */}
                      <TableCell className="align-middle">
                        {notif.providerRef ? (
                          <div className="flex items-center gap-1.5 group">
                            <span className="font-mono text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                              {notif.providerRef.length > 16
                                ? `${notif.providerRef.slice(0, 14)}…`
                                : notif.providerRef}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(notif.providerRef!, notif.id)}
                              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-1"
                              title="Copy provider reference"
                            >
                              {copiedRefId === notif.id ? (
                                <Check className="size-3 text-emerald-600" />
                              ) : (
                                <Copy className="size-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="align-middle text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Attempt logs button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedNotif(notif);
                              setDialogOpen(true);
                            }}
                            className="h-8 px-2 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                            title="View Attempt Logs & Response"
                          >
                            <Info className="size-3.5 mr-1" />
                            Logs
                          </Button>

                          {/* Retry button for FAILED rows */}
                          {notif.status === "FAILED" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRetry(notif)}
                              disabled={isRetrying || !initialData.isAdmin}
                              title={
                                initialData.isAdmin
                                  ? "Retry SMS Dispatch"
                                  : "Admin privilege required to retry SMS"
                              }
                              className="h-8 px-2.5 text-xs border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1.5"
                            >
                              {isRetrying ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <RotateCcw className="size-3.5" />
                              )}
                              Retry
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing {Math.min((page - 1) * pageSize + 1, totalItems)} to{" "}
              {Math.min(page * pageSize, totalItems)} of {totalItems} items
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-8 text-xs"
              >
                Previous
              </Button>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="h-8 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Attempt Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedNotif && (
            <div className="space-y-5">
              <DialogHeader>
                <div className="flex items-center justify-between pr-6">
                  <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <History className="size-5 text-purple-600" />
                    SMS Dispatch Log &amp; Attempts
                  </DialogTitle>
                </div>
                <DialogDescription>
                  Audit record for notification #{selectedNotif.id}
                </DialogDescription>
              </DialogHeader>

              {/* Student and recipient summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Student</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedNotif.student.fullName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Class</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedNotif.student.className}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Guardian Phone</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {selectedNotif.guardianPhone}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Current Status</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedNotif.status}
                  </span>
                </div>
              </div>

              {/* Message body preview */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  SMS Message Body
                </span>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 font-sans leading-relaxed">
                  {selectedNotif.body}
                </div>
              </div>

              {/* Attempts Timeline */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Dispatch Attempts ({selectedNotif.attempts.length})
                  </span>

                  {selectedNotif.status === "FAILED" && initialData.isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRetry(selectedNotif)}
                      disabled={retryingId === selectedNotif.id}
                      className="h-7 text-xs border-rose-300 text-rose-700 dark:text-rose-300 gap-1.5"
                    >
                      {retryingId === selectedNotif.id ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <RotateCcw className="size-3" />
                      )}
                      Retry Now
                    </Button>
                  )}
                </div>

                {selectedNotif.attempts.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    No attempt rows recorded yet. The message is queued in PENDING state.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedNotif.attempts.map((attempt, idx) => (
                      <div
                        key={attempt.id}
                        className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              Attempt #{idx + 1}
                            </span>
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-500 dark:text-slate-400">
                              {formatDateTime(attempt.attemptedAt)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {attempt.httpStatus && (
                              <Badge
                                variant="outline"
                                className={`text-[11px] font-mono ${
                                  attempt.httpStatus >= 200 && attempt.httpStatus < 300
                                    ? "border-emerald-300 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30"
                                    : "border-rose-300 text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/30"
                                }`}
                              >
                                HTTP {attempt.httpStatus}
                              </Badge>
                            )}

                            {attempt.success ? (
                              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 text-[11px]">
                                <CheckCircle2 className="size-3 mr-1" />
                                Success
                              </Badge>
                            ) : (
                              <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 text-[11px]">
                                <AlertCircle className="size-3 mr-1" />
                                Failed
                              </Badge>
                            )}
                          </div>
                        </div>

                        {attempt.error && (
                          <div className="p-2 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 text-xs">
                            <span className="font-semibold">Error:</span> {attempt.error}
                          </div>
                        )}

                        {attempt.rawResponse && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-mono text-slate-400">
                                Raw Provider Response:
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyRawResponse(attempt.rawResponse)}
                                className="h-6 text-[10px] px-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                              >
                                {copiedJson ? (
                                  <Check className="size-3 text-emerald-500 mr-1" />
                                ) : (
                                  <Copy className="size-3 mr-1" />
                                )}
                                Copy JSON
                              </Button>
                            </div>
                            <pre className="p-2.5 rounded bg-slate-900 text-slate-100 dark:bg-slate-950 font-mono text-[11px] overflow-x-auto max-h-48 leading-relaxed">
                              {JSON.stringify(attempt.rawResponse, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
