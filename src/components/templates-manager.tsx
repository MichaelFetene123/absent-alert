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
  Loader2,
  Tag,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { SettingsNav } from "@/components/settings-nav";
import {
  DEFAULT_TEMPLATES,
  AVAILABLE_PLACEHOLDERS,
  renderSmsTemplate,
  type SmsTemplate,
} from "@/lib/services/templates-shared";
import {
  useTemplatesQuery,
  useUpdateTemplateMutation,
  useSetActiveTemplateMutation,
} from "@/hooks/use-templates";

interface TemplatesManagerProps {
  initialTemplates?: SmsTemplate[];
}

export function TemplatesManager({ initialTemplates }: TemplatesManagerProps) {
  const { t, locale } = useI18n();

  // TanStack Query hooks for reading and mutating templates
  const { data: templates = (initialTemplates && initialTemplates.length > 0 ? initialTemplates : DEFAULT_TEMPLATES) } =
    useTemplatesQuery(initialTemplates);
  const updateMutation = useUpdateTemplateMutation();
  const setActiveMutation = useSetActiveTemplateMutation();

  const isSaving = updateMutation.isPending || setActiveMutation.isPending;

  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string>(() => {
    return initialTemplates && initialTemplates.length > 0 ? initialTemplates[0].id : DEFAULT_TEMPLATES[0].id;
  });

  const [languageFilter, setLanguageFilter] = React.useState<"ALL" | "en" | "am">("ALL");

  const selectedTemplate = React.useMemo(() => {
    return templates.find((t) => t.id === selectedTemplateId) || templates[0] || DEFAULT_TEMPLATES[0];
  }, [templates, selectedTemplateId]);

  // Local draft state for the template text area
  const [draftBody, setDraftBody] = React.useState<string>(selectedTemplate.body);

  React.useEffect(() => {
    setDraftBody(selectedTemplate.body);
  }, [selectedTemplate.id, selectedTemplate.body]);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Sample dynamic values for preview
  const sampleValues = React.useMemo(
    () => ({
      student_name: "Almaz Kebede",
      class_name: "Class 7 B",
      date: "Oct 28 (ጥቅምት 18)",
      status: "Absent",
      admission_no: "ADM-001",
      school_name: "Addis Academy",
      time: "08:15 AM",
    }),
    []
  );

  const renderedBody = React.useMemo(() => {
    return renderSmsTemplate(draftBody, sampleValues);
  }, [draftBody, sampleValues]);

  // Account signature automatically appended by SMSHub
  const accountSignature = "\n\n- Addis Academy | 0982428697";
  const fullTextWithSignature = renderedBody + accountSignature;

  // Unicode detection for Amharic or non-GSM chars
  const isUnicode = selectedTemplate.language === "am" || /[\u1200-\u137F]/.test(fullTextWithSignature);
  const charLimit = isUnicode ? 70 : 160;
  const totalLength = fullTextWithSignature.length;
  const segments = Math.ceil(totalLength / charLimit) || 1;

  const filteredTemplates = React.useMemo(() => {
    if (languageFilter === "ALL") return templates;
    return templates.filter((t) => t.language === languageFilter);
  }, [templates, languageFilter]);

  // Insert placeholder token into textarea at current selection
  const handleInsertPlaceholder = (placeholderKey: string) => {
    const token = `{${placeholderKey}}`;
    const textarea = textareaRef.current;
    if (!textarea) {
      setDraftBody((prev) => prev + " " + token);
      return;
    }

    const start = textarea.selectionStart ?? draftBody.length;
    const end = textarea.selectionEnd ?? draftBody.length;
    const updated = draftBody.substring(0, start) + token + draftBody.substring(end);

    setDraftBody(updated);

    requestAnimationFrame(() => {
      textarea.focus();
      const nextPos = start + token.length;
      textarea.setSelectionRange(nextPos, nextPos);
    });
  };

  const handleSave = async () => {
    if (!draftBody.trim()) {
      toast.error("Template body cannot be empty");
      return;
    }

    try {
      const res = await updateMutation.mutateAsync({
        id: selectedTemplate.id,
        body: draftBody,
        name: selectedTemplate.name,
        nameAm: selectedTemplate.nameAm,
        isActive: true, // Saving automatically activates this template
      });

      if (res.success) {
        toast.success(
          locale === "am"
            ? "የኤስኤምኤስ ቴምፕሌት ተቀምጧል እንዲሁም ለቀጣይ መልእክቶች ነቅቷል!"
            : "Template saved and activated for future SMS dispatches!"
        );
      } else {
        toast.error(res.error || "Failed to save template");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to save template");
    }
  };

  const handleSetActive = async () => {
    try {
      const res = await setActiveMutation.mutateAsync(selectedTemplate.id);
      if (res.success) {
        toast.success(
          locale === "am"
            ? `ቴምፕሌት '${selectedTemplate.nameAm}' ለቀጣይ መልእክቶች ነቅቷል!`
            : `Template '${selectedTemplate.name}' is now active for all outbound SMS notifications.`
        );
      } else {
        toast.error(res.error || "Failed to activate template");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to activate template");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <SettingsNav />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="size-5 text-primary" />
            {locale === "am" ? "የኤስኤምኤስ ማሳወቂያ ቴምፕሌቶች (Templates)" : "SMS Notification Templates"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {locale === "am"
              ? "በእንግሊዝኛና በአማርኛ የተዘጋጁ የቀሪዎች፣ የማርፈድና የእርማት ማሳወቂያ መልእክቶች። በዳታቤዝ ውስጥ ይቀመጣሉ።"
              : "Dynamic, database-driven English and Amharic templates for student absence and attendance alerts."}
          </p>
        </div>

        {/* Language Filter */}
        <div className="flex items-center gap-1.5 bg-muted p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setLanguageFilter("ALL")}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
              languageFilter === "ALL"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({templates.length})
          </button>
          <button
            type="button"
            onClick={() => setLanguageFilter("en")}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
              languageFilter === "en"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLanguageFilter("am")}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
              languageFilter === "am"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            አማርኛ (Amharic)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Templates List */}
        <div className="md:col-span-5 space-y-2.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Available Templates
          </Label>
          <div className="space-y-2">
            {filteredTemplates.map((tpl) => {
              const isSelected = selectedTemplate.id === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelectedTemplateId(tpl.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 ring-1 ring-primary/20"
                      : "border-border bg-card hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-foreground">
                      {locale === "am" ? tpl.nameAm : tpl.name}
                    </span>
                    <div className="flex items-center gap-1">
                      {tpl.isActive ? (
                        <span className="inline-flex items-center px-1.5 py-0 rounded text-[9px] font-semibold bg-emerald-600 text-white">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0 rounded text-[9px] font-medium text-muted-foreground bg-muted">
                          Inactive
                        </span>
                      )}
                      <Badge
                        variant="outline"
                        className="text-[10px] uppercase font-mono px-1.5 py-0"
                      >
                        {tpl.language}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {tpl.body}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Template Detail & Preview */}
        <div className="md:col-span-7 space-y-4">
          <Card className="border-border shadow-xs">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-foreground">
                    {locale === "am" ? selectedTemplate.nameAm : selectedTemplate.name}
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5 text-muted-foreground">
                    Trigger Event: {selectedTemplate.triggerEvent} · Language: {selectedTemplate.language.toUpperCase()}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {selectedTemplate.isActive ? (
                    <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white text-xs px-2.5 py-0.5 flex items-center gap-1 font-semibold">
                      <Check className="size-3" /> Active (In Use)
                    </Badge>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isSaving}
                      onClick={handleSetActive}
                      className="h-7 text-xs text-primary hover:text-primary font-medium"
                    >
                      Set as Active
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              {/* Editable Body */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground">Message Template Pattern</Label>
                  <span className="text-[11px] text-muted-foreground">
                    Supports dynamic placeholders below
                  </span>
                </div>
                <textarea
                  ref={textareaRef}
                  rows={4}
                  value={draftBody}
                  onChange={(e) => setDraftBody(e.target.value)}
                  className="w-full text-xs p-3 rounded-lg border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-ring text-foreground leading-relaxed"
                />

                {/* Clickable Placeholder Chips */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                    <Tag className="size-3 text-primary" />
                    <span>Click to insert placeholder:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_PLACEHOLDERS.map((ph) => (
                      <button
                        key={ph.key}
                        type="button"
                        onClick={() => handleInsertPlaceholder(ph.key)}
                        className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-muted hover:bg-primary/10 hover:text-primary border border-border transition-colors text-foreground"
                        title={`Sample: ${ph.sample}`}
                      >
                        &#123;{ph.key}&#125;
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                  <Smartphone className="size-3.5 text-primary" />
                  Live Handset Preview (Rendered With Account Signature)
                </Label>
                <div className="p-3.5 rounded-xl border border-border bg-muted/40 text-xs leading-relaxed">
                  <span className="text-foreground font-medium">
                    {renderedBody}
                  </span>
                  <span className="text-muted-foreground font-normal">
                    {accountSignature}
                  </span>
                </div>
              </div>

              {/* Character & Segment Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-muted/40 border border-border text-xs">
                <div>
                  <span className="text-muted-foreground text-[11px] block">Encoding</span>
                  <span className="font-semibold text-foreground uppercase font-mono">
                    {isUnicode ? "Unicode" : "GSM-7"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px] block">Total Chars (With Sig)</span>
                  <span className={`font-semibold ${totalLength > charLimit ? "text-amber-500 font-bold" : "text-foreground"}`}>
                    {totalLength} / {charLimit}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px] block">Segments</span>
                  <span className="font-semibold text-foreground">
                    {segments} SMS
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px] block">Est. Cost</span>
                  <span className="font-bold text-primary">
                    {segments} - {segments * 2} credits
                  </span>
                </div>
              </div>

              {totalLength > charLimit && (
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400">
                  <p className="font-semibold flex items-center gap-1.5">
                    <Info className="size-3.5" />
                    SMSHub Length Warning ({totalLength} / {charLimit} chars)
                  </p>
                  <p className="text-[11px] mt-0.5 opacity-90">
                    Once the automatic SMSHub signature is appended, messages exceeding {charLimit} characters may be rejected by the telecom provider. Consider shortening the template pattern.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  size="sm"
                  className="text-xs h-8 px-4"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving && <Loader2 className="size-3.5 mr-1.5 animate-spin" />}
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
