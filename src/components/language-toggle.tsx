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
        className="h-8 gap-1.5 px-2.5 text-xs font-medium"
        aria-label="Change Language"
      >
        <Globe className="size-3.5 text-primary" />
        <span className="hidden sm:inline font-semibold">
          {locale === "am" ? "አማርኛ" : "English"}
        </span>
        <span className="sm:hidden font-semibold uppercase">{locale}</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xs p-4">
          <DialogHeader className="pb-2 border-b border-border">
            <DialogTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Globe className="size-4 text-primary" />
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
                      ? "bg-primary/10 border-primary/20 text-primary font-semibold"
                      : "border-transparent hover:bg-muted text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{lang.flag}</span>
                    <div>
                      <div className="font-medium text-foreground">
                        {lang.nativeName}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {lang.name}
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="size-4 text-primary shrink-0" />
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
