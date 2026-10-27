"use client";

import * as React from "react";
import {
  Users,
  Search,
  Phone,
  ShieldCheck,
  Smartphone,
  Eye,
  EyeOff,
  Copy,
  Check,
  UserCheck,
  Plus,
  School,
  ExternalLink,
  User,
  GraduationCap,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import type { GuardianDetail } from "@/lib/services/guardians.service";

interface GuardiansManagerProps {
  guardians: GuardianDetail[];
  totalGuardians: number;
  ethioCount: number;
  safaricomCount: number;
  isAdmin: boolean;
}

export function GuardiansManager({
  guardians,
  totalGuardians,
  ethioCount,
  safaricomCount,
  isAdmin,
}: GuardiansManagerProps) {
  const { t, locale } = useI18n();
  const [search, setSearch] = React.useState("");
  const [carrierFilter, setCarrierFilter] = React.useState<string>("ALL");
  const [revealedPhones, setRevealedPhones] = React.useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [selectedGuardian, setSelectedGuardian] = React.useState<GuardianDetail | null>(null);
  const [modalCopied, setModalCopied] = React.useState(false);

  const handleCopyModalPhone = (phone: string) => {
    navigator.clipboard.writeText(phone);
    setModalCopied(true);
    setTimeout(() => setModalCopied(false), 2000);
  };

  const toggleReveal = (id: string) => {
    setRevealedPhones((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyPhone = (id: string, phone: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    toast.success("Guardian phone copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const maskPhone = (phone: string, isRevealed: boolean) => {
    if (isRevealed) return phone;
    if (phone.length <= 6) return phone;
    const start = phone.slice(0, 4);
    const end = phone.slice(-3);
    return `${start} •••• ${end}`;
  };

  const filteredGuardians = React.useMemo(() => {
    return guardians.filter((g) => {
      if (carrierFilter !== "ALL" && g.carrier !== carrierFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      return (
        g.name.toLowerCase().includes(q) ||
        g.phone.includes(q) ||
        g.studentName.toLowerCase().includes(q) ||
        g.studentAdmissionNo.toLowerCase().includes(q) ||
        g.className.toLowerCase().includes(q)
      );
    });
  }, [guardians, search, carrierFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="size-5 text-primary" />
            {locale === "am" ? "የወላጆችና አሳዳጊዎች ማውጫ" : "Parent & Guardian Management"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {locale === "am"
              ? "የወላጆች የስልክ ቁጥር፣ የኢትዮ ቴሌኮምና ሳፋሪኮም ኔትወርክ ሁኔታና የወላጅ ማሳወቂያ መዝገብ።"
              : "Registered parent contacts, carrier credit pricing, and absence alert notification eligibility."}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3.5 border-border bg-card shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>{locale === "am" ? "ጠቅላላ ወላጆች" : "Total Guardians"}</span>
            <Users className="size-4 text-primary" />
          </div>
          <div className="text-xl font-bold mt-1 text-foreground">
            {totalGuardians}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Linked to active students</p>
        </Card>

        <Card className="p-3.5 border-border bg-card shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>{locale === "am" ? "ኢትዮ ቴሌኮም (09...)" : "Ethio Telecom"}</span>
            <span className="size-2 rounded-full bg-chart-1" />
          </div>
          <div className="text-xl font-bold mt-1 text-foreground">
            {ethioCount}
          </div>
          <p className="text-[11px] text-primary font-medium mt-0.5">
            1 credit / SMS
          </p>
        </Card>

        <Card className="p-3.5 border-border bg-card shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>{locale === "am" ? "ሳፋሪኮም (07...)" : "Safaricom"}</span>
            <span className="size-2 rounded-full bg-chart-2" />
          </div>
          <div className="text-xl font-bold mt-1 text-foreground">
            {safaricomCount}
          </div>
          <p className="text-[11px] text-primary font-medium mt-0.5">
            2 credits / SMS
          </p>
        </Card>

        <Card className="p-3.5 border-border bg-card shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>{locale === "am" ? "የተረጋገጡ ቁጥሮች" : "Verified Contacts"}</span>
            <ShieldCheck className="size-4 text-primary" />
          </div>
          <div className="text-xl font-bold mt-1 text-foreground">
            100%
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Valid Ethiopian MSISDN</p>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="size-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={locale === "am" ? "በስም፣ ስልክ ወይም ተማሪ ፈልግ..." : "Search guardian, phone, student..."}
            className="pl-9 h-8 text-xs bg-background border-border"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={carrierFilter}
            onChange={(e) => setCarrierFilter(e.target.value)}
            className="h-8 px-2.5 text-xs rounded-lg border border-border bg-background text-foreground font-medium"
          >
            <option value="ALL">All Carriers (ሁሉም ኔትወርኮች)</option>
            <option value="Ethio Telecom">Ethio Telecom (1 credit)</option>
            <option value="Safaricom">Safaricom (2 credits)</option>
          </select>
        </div>
      </div>

      {/* Guardians Table */}
      <Card className="border-border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50 border-b border-border">
              <TableRow>
                <TableHead className="text-xs font-semibold py-3">Guardian Name</TableHead>
                <TableHead className="text-xs font-semibold py-3">Phone (MSISDN)</TableHead>
                <TableHead className="text-xs font-semibold py-3">Carrier &amp; Cost</TableHead>
                <TableHead className="text-xs font-semibold py-3">Linked Student</TableHead>
                <TableHead className="text-xs font-semibold py-3">Class</TableHead>
                <TableHead className="text-xs font-semibold py-3">SMS Received</TableHead>
                <TableHead className="text-xs font-semibold py-3 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGuardians.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-xs">
                    No guardians match the selected criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredGuardians.map((g) => {
                  const isRevealed = !!revealedPhones[g.id];
                  const displayPhone = maskPhone(g.phone, isRevealed);
                  return (
                    <TableRow key={g.id} className="hover:bg-muted/50 text-xs">
                      <TableCell className="font-semibold text-foreground py-3">
                        <div className="flex items-center gap-2">
                          <span>{g.name}</span>
                          {g.isPrimary && (
                            <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-medium">
                              Primary
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="py-3 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="text-foreground">{displayPhone}</span>
                          <button
                            type="button"
                            onClick={() => toggleReveal(g.id)}
                            className="text-muted-foreground hover:text-foreground p-0.5 rounded"
                            title={isRevealed ? "Mask phone" : "Reveal phone"}
                          >
                            {isRevealed ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => copyPhone(g.id, g.phone)}
                            className="text-muted-foreground hover:text-foreground p-0.5 rounded"
                            title="Copy number"
                          >
                            {copiedId === g.id ? (
                              <Check className="size-3 text-primary" />
                            ) : (
                              <Copy className="size-3" />
                            )}
                          </button>
                        </div>
                      </TableCell>

                      <TableCell className="py-3">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-medium gap-1 py-0.5 border-border bg-muted/40"
                        >
                          <Smartphone className="size-3 text-muted-foreground" />
                          {g.carrier} ({g.creditCost} cr)
                        </Badge>
                      </TableCell>

                      <TableCell className="py-3 text-foreground">
                        <div>
                          <span className="font-medium">{g.studentName}</span>
                          <span className="text-[11px] text-muted-foreground font-mono ml-1.5">
                            ({g.studentAdmissionNo})
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="py-3 text-muted-foreground font-medium">
                        {g.className}
                      </TableCell>

                      <TableCell className="py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground">
                          {g.smsReceivedCount} alerts
                        </span>
                      </TableCell>

                      <TableCell className="py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-primary hover:text-primary hover:bg-primary/10"
                          onClick={() => setSelectedGuardian(g)}
                        >
                          View Profile
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Guardian & Student Profile Dialog */}
      <Dialog
        open={!!selectedGuardian}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSelectedGuardian(null);
            setModalCopied(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md p-6 rounded-2xl">
          {selectedGuardian && (
            <div className="space-y-5">
              <DialogHeader>
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <User className="size-4.5" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold text-foreground">
                      {locale === "am" ? "የወላጅና ተማሪ ፕሮፋይል" : "Guardian & Student Profile"}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                      {locale === "am"
                        ? "የተማሪውና የአሳዳጊው ዝርዝር መረጃ"
                        : "Verified contact record and student assignment"}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* Guardian Information Card */}
              <div className="p-4 rounded-xl border border-border bg-muted/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {locale === "am" ? "የወላጅ/አሳዳጊ መረጃ" : "Guardian Information"}
                  </span>
                  {selectedGuardian.isPrimary ? (
                    <Badge variant="secondary" className="text-[10px] py-0 px-2 font-medium">
                      Primary Guardian
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] py-0 px-2 font-medium">
                      Secondary Guardian
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-[11px] text-muted-foreground">
                      {locale === "am" ? "የወላጅ ሙሉ ስም" : "Guardian Name"}
                    </p>
                    <p className="font-semibold text-foreground mt-0.5 text-sm">
                      {selectedGuardian.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-muted-foreground">
                      {locale === "am" ? "የስልክ ቁጥር" : "Phone Number"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="font-mono font-semibold text-foreground">
                        {selectedGuardian.phone}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyModalPhone(selectedGuardian.phone)}
                        className="text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
                        title="Copy phone"
                      >
                        {modalCopied ? (
                          <Check className="size-3 text-primary" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-[11px] text-muted-foreground">
                      {locale === "am" ? "ኔትወርክና ወጪ" : "Carrier Network"}
                    </p>
                    <p className="font-medium text-foreground mt-0.5 flex items-center gap-1">
                      <Smartphone className="size-3 text-muted-foreground" />
                      {selectedGuardian.carrier} ({selectedGuardian.creditCost} cr)
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-muted-foreground">
                      {locale === "am" ? "የኤስኤምኤስ ቋንቋ" : "SMS Language"}
                    </p>
                    <p className="font-medium text-foreground mt-0.5">
                      {selectedGuardian.preferredLanguage === "am"
                        ? "አማርኛ (Unicode)"
                        : "English (GSM-7)"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Linked Student Information Card */}
              <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="size-4 text-primary" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {locale === "am" ? "የተማሪው መረጃ" : "Linked Student"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-[11px] text-muted-foreground">
                      {locale === "am" ? "የተማሪው ስም" : "Student Name"}
                    </p>
                    <p className="font-semibold text-foreground mt-0.5 text-sm">
                      {selectedGuardian.studentName}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-muted-foreground">
                      {locale === "am" ? "የተማሪ መለያ (ID / ADM)" : "Student ID / ADM"}
                    </p>
                    <p className="font-mono font-semibold text-primary mt-0.5">
                      {selectedGuardian.studentAdmissionNo}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-muted-foreground">
                      {locale === "am" ? "ክፍል" : "Assigned Class"}
                    </p>
                    <p className="font-medium text-foreground mt-0.5 flex items-center gap-1">
                      <School className="size-3 text-muted-foreground" />
                      {selectedGuardian.className}
                    </p>
                  </div>

                  <div>
                    <p className="text-[11px] text-muted-foreground">
                      {locale === "am" ? "የደረሱ ማሳወቂያዎች" : "Alerts Delivered"}
                    </p>
                    <p className="font-medium text-foreground mt-0.5">
                      {selectedGuardian.smsReceivedCount} SMS alerts
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-2 sm:justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedGuardian(null)}
                  className="h-8 text-xs rounded-lg"
                >
                  {locale === "am" ? "ዝጋ" : "Close"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
