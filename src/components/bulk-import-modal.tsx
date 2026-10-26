"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
} from "lucide-react";
import { type BulkImportRowInput } from "@/actions/student.actions";
import { useBulkImportStudentsMutation } from "@/hooks/use-students";
import { toast } from "sonner";

interface BulkImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classes: Array<{ id: string; name: string }>;
  onSuccess?: () => void;
}

interface ParsedRow extends BulkImportRowInput {
  isValidPhone: boolean;
  hasValidFields: boolean;
  classMatched: boolean;
  errorNote?: string;
}

export function BulkImportModal({
  open,
  onOpenChange,
  classes,
  onSuccess,
}: BulkImportModalProps) {
  const bulkImportMutation = useBulkImportStudentsMutation();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [parsedRows, setParsedRows] = React.useState<ParsedRow[]>([]);
  const [isParsing, setIsParsing] = React.useState(false);
  const isImporting = bulkImportMutation.isPending;

  // Set of class names and IDs for fast client pre-validation
  const classSet = React.useMemo(() => {
    const set = new Set<string>();
    classes.forEach((c) => {
      set.add(c.id.toLowerCase());
      set.add(c.name.toLowerCase().trim());
    });
    return set;
  }, [classes]);

  function downloadSampleCsv() {
    const sampleClass = classes[0]?.name || "Grade 10A";
    const sampleClass2 = classes[1]?.name || sampleClass;
    const csvContent =
      "admissionNo,fullName,className,guardianName,guardianPhone\n" +
      `ETH-2026-001,Abebe Bikila,${sampleClass},Bikila Woldie,+251911223344\n` +
      `ETH-2026-002,Derartu Tulu,${sampleClass},Tulu Deresa,+251922334455\n` +
      `ETH-2026-003,Haile Gebrselassie,${sampleClass2},Gebrselassie Bekele,0933445566\n` +
      `ETH-2026-004,Tirunesh Dibaba,${sampleClass2},Dibaba Keneni,0711223344\n`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "student_roster_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function validateEthiopianPhone(phone: string): boolean {
    const cleaned = phone.replace(/[\s()\-.]/g, "");
    return (
      /^\+251[79]\d{8}$/.test(cleaned) ||
      /^251[79]\d{8}$/.test(cleaned) ||
      /^0[79]\d{8}$/.test(cleaned) ||
      /^[79]\d{8}$/.test(cleaned)
    );
  }

  function parseCsvText(text: string) {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      toast.error("CSV file must have a header row and at least one student record");
      return;
    }

    const header = lines[0].split(",").map((h) => h.trim().replace(/^["']|["']$/g, "").toLowerCase());

    // Detect column indexes
    const admIdx = header.findIndex((h) => h.includes("admission") || h.includes("roll") || h === "adm_no" || h === "id");
    const nameIdx = header.findIndex((h) => h.includes("fullname") || (h.includes("name") && !h.includes("guardian")));
    const classIdx = header.findIndex((h) => h.includes("class") || h.includes("grade") || h.includes("section"));
    const gNameIdx = header.findIndex((h) => h.includes("guardian") && !h.includes("phone"));
    const gPhoneIdx = header.findIndex((h) => h.includes("phone") || h.includes("mobile") || h.includes("contact"));

    if (admIdx === -1 || nameIdx === -1 || classIdx === -1 || gNameIdx === -1 || gPhoneIdx === -1) {
      toast.error(
        "Could not detect all columns. Required: admissionNo, fullName, className, guardianName, guardianPhone"
      );
      return;
    }

    const rows: ParsedRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Basic CSV token parser handling comma inside quotes
      const cells = line.split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
      if (cells.length < 5) continue;

      const adm = cells[admIdx] || "";
      const name = cells[nameIdx] || "";
      const cls = cells[classIdx] || "";
      const gName = cells[gNameIdx] || "";
      const gPhone = cells[gPhoneIdx] || "";

      const isValidPhone = validateEthiopianPhone(gPhone);
      const classMatched = classSet.has(cls.toLowerCase().trim());
      const hasValidFields = adm.length > 0 && name.length >= 2 && gName.length >= 2;

      let errorNote: string | undefined;
      if (!hasValidFields) errorNote = "Missing student name or admission number";
      else if (!classMatched) errorNote = `Class '${cls}' not recognized`;
      else if (!isValidPhone) errorNote = `Invalid Ethiopian phone: ${gPhone}`;

      rows.push({
        admissionNo: adm,
        fullName: name,
        classNameOrId: cls,
        guardianName: gName,
        guardianPhone: gPhone,
        isValidPhone,
        hasValidFields,
        classMatched,
        errorNote,
      });
    }

    setParsedRows(rows);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a .csv formatted file");
      return;
    }

    setFileName(file.name);
    setIsParsing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCsvText(text);
      setIsParsing(false);
    };
    reader.onerror = () => {
      toast.error("Failed to read the file");
      setIsParsing(false);
    };
    reader.readAsText(file);
  }

  function handleReset() {
    setFileName(null);
    setParsedRows([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleImport() {
    if (parsedRows.length === 0) return;

    const payload: BulkImportRowInput[] = parsedRows.map((r) => ({
      admissionNo: r.admissionNo,
      fullName: r.fullName,
      classNameOrId: r.classNameOrId,
      guardianName: r.guardianName,
      guardianPhone: r.guardianPhone,
    }));

    bulkImportMutation.mutate({ rows: payload }, {
      onSuccess: (res) => {
        if (res.ok && res.data) {
          toast.success(
            `Successfully imported ${res.data.importedCount} student(s)! ${
              res.data.skippedCount > 0 ? `(${res.data.skippedCount} skipped due to validation)` : ""
            }`
          );
          if (res.data.errors && res.data.errors.length > 0) {
            toast.warning(
              `Notice: ${res.data.errors[0].error}${res.data.errors.length > 1 ? ` (+${res.data.errors.length - 1} more)` : ""}`
            );
          }
          handleReset();
          onOpenChange(false);
          onSuccess?.();
        } else {
          toast.error(res.error || "Failed to import students");
        }
      },
      onError: (err: any) => {
        toast.error(err.message || "Bulk import failed");
      },
    });
  }

  const validCount = parsedRows.filter(
    (r) => r.isValidPhone && r.hasValidFields && r.classMatched
  ).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <FileSpreadsheet className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
                Bulk Import Students & Guardians
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Upload a CSV roster with admission numbers, student names, classrooms, and primary guardian phone numbers.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Action Row: Template Download & File Picker */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Need the standard spreadsheet format?
              </p>
              <p className="text-[11px] text-slate-500">
                Includes sample Ethiopian student names, class names, and valid phone formats.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadSampleCsv}
              className="h-8 text-xs font-medium gap-1.5 shrink-0 border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800"
            >
              <Download className="size-3.5 text-blue-600" />
              <span>Download Template (.csv)</span>
            </Button>
          </div>

          {/* Upload Dropzone */}
          {!fileName ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-900/30"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="p-2.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                  <Upload className="size-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Click to browse or drop your roster CSV here
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Max 500 rows per batch • Columns: admissionNo, fullName, className, guardianName, guardianPhone
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
              <div className="flex items-center gap-2 min-w-0">
                <FileSpreadsheet className="size-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                  {fileName}
                </span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {parsedRows.length} rows parsed
                </Badge>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              >
                <Trash2 className="size-3.5 mr-1" />
                <span>Remove</span>
              </Button>
            </div>
          )}

          {/* Validation Status Pills */}
          {parsedRows.length > 0 && (
            <div className="flex items-center gap-2 pt-1">
              <Badge
                variant="outline"
                className="text-xs py-0.5 px-2 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 gap-1"
              >
                <CheckCircle2 className="size-3" />
                <span>{validCount} Ready to Import</span>
              </Badge>
              {invalidCount > 0 && (
                <Badge
                  variant="outline"
                  className="text-xs py-0.5 px-2 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 gap-1"
                >
                  <AlertCircle className="size-3" />
                  <span>{invalidCount} Have Warnings/Errors</span>
                </Badge>
              )}
            </div>
          )}

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden max-h-56 overflow-y-auto">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10">
                  <TableRow className="border-b border-slate-200 dark:border-slate-800">
                    <TableHead className="text-[11px] py-2 px-2.5">Status</TableHead>
                    <TableHead className="text-[11px] py-2 px-2.5">Adm #</TableHead>
                    <TableHead className="text-[11px] py-2 px-2.5">Student</TableHead>
                    <TableHead className="text-[11px] py-2 px-2.5">Class</TableHead>
                    <TableHead className="text-[11px] py-2 px-2.5">Guardian</TableHead>
                    <TableHead className="text-[11px] py-2 px-2.5">Phone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.slice(0, 15).map((row, idx) => {
                    const isValid = row.isValidPhone && row.hasValidFields && row.classMatched;
                    return (
                      <TableRow
                        key={idx}
                        className={
                          !isValid
                            ? "bg-amber-50/40 dark:bg-amber-950/20"
                            : "hover:bg-slate-50/50 dark:hover:bg-slate-900/50"
                        }
                      >
                        <TableCell className="py-1.5 px-2.5 text-xs">
                          {isValid ? (
                            <CheckCircle2 className="size-3.5 text-emerald-600" />
                          ) : (
                            <span
                              title={row.errorNote}
                              className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium"
                            >
                              <AlertCircle className="size-3.5 shrink-0" />
                              <span className="truncate max-w-20">{row.errorNote || "Check"}</span>
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="py-1.5 px-2.5 text-xs font-mono font-medium">
                          {row.admissionNo}
                        </TableCell>
                        <TableCell className="py-1.5 px-2.5 text-xs font-medium text-slate-800 dark:text-slate-200">
                          {row.fullName}
                        </TableCell>
                        <TableCell className="py-1.5 px-2.5 text-xs">
                          <span
                            className={
                              row.classMatched
                                ? "text-slate-600 dark:text-slate-400"
                                : "text-rose-600 font-semibold"
                            }
                          >
                            {row.classNameOrId}
                          </span>
                        </TableCell>
                        <TableCell className="py-1.5 px-2.5 text-xs text-slate-600 dark:text-slate-400">
                          {row.guardianName}
                        </TableCell>
                        <TableCell className="py-1.5 px-2.5 text-xs font-mono">
                          <span
                            className={
                              row.isValidPhone
                                ? "text-slate-600 dark:text-slate-400"
                                : "text-rose-600 font-semibold"
                            }
                          >
                            {row.guardianPhone}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {parsedRows.length > 15 && (
                <div className="p-2 text-center text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                  Showing first 15 of {parsedRows.length} rows
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isImporting}
            className="text-xs"
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleImport}
            disabled={parsedRows.length === 0 || isImporting}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium gap-1.5"
          >
            {isImporting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Importing Roster...</span>
              </>
            ) : (
              <>
                <Upload className="size-3.5" />
                <span>Import {validCount > 0 ? `${validCount} Valid Students` : "Roster"}</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
