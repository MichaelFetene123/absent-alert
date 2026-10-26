"use client";

import * as React from "react";
import {
  FileText,
  Languages,
  Check,
  Edit2,
  Copy,
  Sparkles,
  Smartphone,
  Eye,
  Info,
  Zap,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import {
  DEFAULT_TEMPLATES,
  renderSmsTemplate,
  type SmsTemplate,
} from "@/lib/services/templates.service";

export function TemplatesManager() {
  const { t, locale } = useI18n();

  const [templates, setTemplates] = React.useState<SmsTemplate[]>(DEFAULT_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = React.useState<SmsTemplate>(DEFAULT_TEMPLATES[0]);
  const [languageFilter, setLanguageFilter] = React.useState<"ALL" | "en" | "am">("ALL");

  // Sample dynamic values for preview
  const sampleValues = {
    student_name: "Almaz Kebede",
    class_name: "Class 7 B",
    date: "Oct 25 (ጥቅምት 15)",
    school_name: "Addis Academy",
  };

  const renderedBody = React.useMemo(() => {
    return renderSmsTemplate(selectedTemplate.body, sampleValues);
  }, [selectedTemplate]);

  // Account signature automatically appended by SMSHub
  const accountSignature = "\n\n- Addis Academy | 0982428697";
  const fullTextWithSignature = renderedBody + accountSignature;

  // Unicode detection for Amharic
  const isUnicode = selectedTemplate.language === "am" || /[\u1200-\u137F]/.test(fullTextWithSignature);
  const charLimit = isUnicode ? 70 : 160;
  const totalLength = fullTextWithSignature.length;
  const segments = Math.ceil(totalLength / charLimit) || 1;

  const filteredTemplates = React.useMemo(() => {
    if (languageFilter === "ALL") return templates;
    return templates.filter((t) => t.language === languageFilter);
  }, [templates, languageFilter]);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="size-5 text-indigo-600 dark:text-indigo-400" />
            {locale === "am" ? "የኤስኤምኤስ ማሳወቂያ ቴምፕሌቶች (Templates)" : "SMS Notification Templates"}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {locale === "am"
              ? "በእንግሊዝኛና በአማርኛ የተዘጋጁ የቀሪዎች፣ የማርፈድና የእርማት ማሳወቂያ መልእክቶች።"
              : "Pre-configured and editable English and Amharic templates for student absence and attendance alerts."}
          </p>
        </div>

        {/* Language Filter */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setLanguageFilter("ALL")}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
              languageFilter === "ALL"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            All ({templates.length})
          </button>
          <button
            type="button"
            onClick={() => setLanguageFilter("en")}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
              languageFilter === "en"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLanguageFilter("am")}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
              languageFilter === "am"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400"
            }`}
          >
            አማርኛ (Amharic)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Templates List */}
        <div className="md:col-span-5 space-y-2.5">
          <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Available Templates
          </Label>
          <div className="space-y-2">
            {filteredTemplates.map((tpl) => {
              const isSelected = selectedTemplate.id === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelectedTemplate(tpl)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? "border-indigo-600 dark:border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40 ring-1 ring-indigo-500/20"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-slate-900 dark:text-white">
                      {locale === "am" ? tpl.nameAm : tpl.name}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] uppercase font-mono px-1.5 py-0 ${
                        tpl.language === "am"
                          ? "border-amber-200 text-amber-700 bg-amber-50 dark:bg-amber-950/40"
                          : "border-blue-200 text-blue-700 bg-blue-50 dark:bg-blue-950/40"
                      }`}
                    >
                      {tpl.language}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {tpl.body}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Template Detail & Preview */}
        <div className="md:col-span-7 space-y-4">
          <Card className="border-slate-200 dark:border-slate-800 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">
                    {locale === "am" ? selectedTemplate.nameAm : selectedTemplate.name}
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Trigger Event: {selectedTemplate.triggerEvent} · Language: {selectedTemplate.language.toUpperCase()}
                  </CardDescription>
                </div>
                <Badge className="bg-emerald-600 text-white text-[10px]">Active</Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              {/* Editable Body */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">Message Template Pattern</Label>
                  <span className="text-[11px] text-slate-400">
                    Supports &#123;student_name&#125;, &#123;class_name&#125;, &#123;date&#125;
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={selectedTemplate.body}
                  onChange={(e) => {
                    const newBody = e.target.value;
                    setSelectedTemplate((prev) => ({ ...prev, body: newBody }));
                    setTemplates((prev) =>
                      prev.map((t) => (t.id === selectedTemplate.id ? { ...t, body: newBody } : t))
                    );
                  }}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
              </div>

              {/* Live Preview Box */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <Smartphone className="size-3.5 text-indigo-600" />
                  Live Handset Preview (Rendered With Account Signature)
                </Label>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs leading-relaxed">
                  <span className="text-slate-900 dark:text-white font-medium">
                    {renderedBody}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 font-normal">
                    {accountSignature}
                  </span>
                </div>
              </div>

              {/* Character & Segment Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 text-[11px] block">Encoding</span>
                  <span className="font-semibold text-slate-900 dark:text-white uppercase font-mono">
                    {isUnicode ? "Unicode" : "GSM-7"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Total Chars</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {totalLength} / {charLimit}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Segments</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {segments} SMS
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Est. Cost</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {segments} - {segments * 2} credits
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8"
                  onClick={() => toast.success("Template changes saved successfully.")}
                >
                  Save Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
