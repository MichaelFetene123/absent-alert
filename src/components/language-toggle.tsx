"use client";

import * as React from "react";
import { useI18n, type Locale } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Globe, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function LanguageToggle() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = React.useState(false);

  const languages: Array<{ code: Locale; name: string; nativeName: string; flag: string }> = [
    { code: "en", name: "English", nativeName: "English (US)", flag: "🇺🇸" },
    { code: "am", name: "Amharic", nativeName: "አማርኛ (ኢትዮጵያ)", flag: "🇪🇹" },
  ];

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-8 gap-1.5 px-2.5 text-xs font-medium border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
        aria-label="Change Language"
      >
        <Globe className="size-3.5 text-indigo-600 dark:text-indigo-400" />
        <span className="hidden sm:inline font-semibold">
          {locale === "am" ? "አማርኛ" : "English"}
        </span>
        <span className="sm:hidden font-semibold uppercase">{locale}</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[340px] p-4">
          <DialogHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <Globe className="size-4 text-indigo-600 dark:text-indigo-400" />
              {locale === "am" ? "የስርዓቱን ቋንቋ ይምረጡ" : "Select Interface Language"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-1.5 pt-2">
            {languages.map((lang) => {
              const isSelected = locale === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setLocale(lang.code);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left text-xs transition-colors border ${
                    isSelected
                      ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 font-semibold"
                      : "border-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{lang.flag}</span>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {lang.nativeName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {lang.name}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="size-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
