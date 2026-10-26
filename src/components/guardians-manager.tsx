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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="size-5 text-indigo-600 dark:text-indigo-400" />
            {locale === "am" ? "የወላጆችና አሳዳጊዎች ማውጫ" : "Parent & Guardian Management"}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {locale === "am"
              ? "የወላጆች የስልክ ቁጥር፣ የኢትዮ ቴሌኮምና ሳፋሪኮም ኔትወርክ ሁኔታና የወላጅ ማሳወቂያ መዝገብ።"
              : "Registered parent contacts, carrier credit pricing, and absence alert notification eligibility."}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3.5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>{locale === "am" ? "ጠቅላላ ወላጆች" : "Total Guardians"}</span>
            <Users className="size-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold mt-1 text-slate-900 dark:text-white">
            {totalGuardians}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Linked to active students</p>
        </Card>

        <Card className="p-3.5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>{locale === "am" ? "ኢትዮ ቴሌኮም (09...)" : "Ethio Telecom"}</span>
            <span className="size-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-xl font-bold mt-1 text-slate-900 dark:text-white">
            {ethioCount}
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
            1 credit / SMS
          </p>
        </Card>

        <Card className="p-3.5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>{locale === "am" ? "ሳፋሪኮም (07...)" : "Safaricom"}</span>
            <span className="size-2 rounded-full bg-blue-500" />
          </div>
          <div className="text-xl font-bold mt-1 text-slate-900 dark:text-white">
            {safaricomCount}
          </div>
          <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">
            2 credits / SMS
          </p>
        </Card>

        <Card className="p-3.5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>{locale === "am" ? "የተረጋገጡ ቁጥሮች" : "Verified Contacts"}</span>
            <ShieldCheck className="size-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold mt-1 text-slate-900 dark:text-white">
            100%
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Valid Ethiopian MSISDN</p>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="size-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={locale === "am" ? "በስም፣ ስልክ ወይም ተማሪ ፈልግ..." : "Search guardian, phone, student..."}
            className="pl-9 h-8 text-xs bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={carrierFilter}
            onChange={(e) => setCarrierFilter(e.target.value)}
            className="h-8 px-2.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="ALL">All Carriers (ሁሉም ኔትወርኮች)</option>
            <option value="Ethio Telecom">Ethio Telecom (1 credit)</option>
            <option value="Safaricom">Safaricom (2 credits)</option>
          </select>
        </div>
      </div>

      {/* Guardians Table */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
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
                  <TableCell colSpan={7} className="text-center py-8 text-slate-400 text-xs">
                    No guardians match the selected criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredGuardians.map((g) => {
                  const isRevealed = !!revealedPhones[g.id];
                  const displayPhone = maskPhone(g.phone, isRevealed);
                  return (
                    <TableRow key={g.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 text-xs">
                      <TableCell className="font-semibold text-slate-900 dark:text-white py-3">
                        <div className="flex items-center gap-2">
                          <span>{g.name}</span>
                          {g.isPrimary && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-medium border-indigo-200 text-indigo-700 bg-indigo-50 dark:bg-indigo-950 dark:text-indigo-300">
                              Primary
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="py-3 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-800 dark:text-slate-200">{displayPhone}</span>
                          <button
                            type="button"
                            onClick={() => toggleReveal(g.id)}
                            className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
                            title={isRevealed ? "Mask phone" : "Reveal phone"}
                          >
                            {isRevealed ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => copyPhone(g.id, g.phone)}
                            className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
                            title="Copy number"
                          >
                            {copiedId === g.id ? (
                              <Check className="size-3 text-emerald-600" />
                            ) : (
                              <Copy className="size-3" />
                            )}
                          </button>
                        </div>
                      </TableCell>

                      <TableCell className="py-3">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-medium gap-1 py-0.5 ${
                            g.carrier === "Safaricom"
                              ? "border-blue-200 text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300"
                              : "border-emerald-200 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300"
                          }`}
                        >
                          <Smartphone className="size-3" />
                          {g.carrier} ({g.creditCost} cr)
                        </Badge>
                      </TableCell>

                      <TableCell className="py-3 text-slate-700 dark:text-slate-300">
                        <div>
                          <span className="font-medium">{g.studentName}</span>
                          <span className="text-[11px] text-slate-400 font-mono ml-1.5">
                            ({g.studentAdmissionNo})
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="py-3 text-slate-600 dark:text-slate-400 font-medium">
                        {g.className}
                      </TableCell>

                      <TableCell className="py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {g.smsReceivedCount} alerts
                        </span>
                      </TableCell>

                      <TableCell className="py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                          onClick={() => toast.info(`Guardian: ${g.name}\nPhone: ${g.phone}\nStudent: ${g.studentName}`)}
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
    </div>
  );
}
