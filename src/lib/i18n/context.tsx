"use client";

import * as React from "react";
import translations from "@/locales/translations.json";

export type Locale = "en" | "am";

const DICTIONARIES = translations;

type I18nContextType = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  toggleLocale: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const I18nContext = React.createContext<I18nContextType | null>(null);

function resolveKey(obj: any, path: string): string | undefined {
  const parts = path.split(".");
  let cur = obj;
  for (const part of parts) {
    if (cur && typeof cur === "object" && part in cur) {
      cur = cur[part];
    } else {
      return undefined;
    }
  }
  return typeof cur === "string" ? cur : undefined;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>("en");

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("absent_alert_locale");
      if (saved === "am" || saved === "en") {
        setLocaleState(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem("absent_alert_locale", next);
      document.cookie = `NEXT_LOCALE=${next};path=/;max-age=31536000`;
    } catch {
      // ignore
    }
  };

  const toggleLocale = () => {
    setLocale(locale === "en" ? "am" : "en");
  };

  const t = React.useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const dict = DICTIONARIES[locale] || DICTIONARIES.en;
      let text = resolveKey(dict, key);
      
      // Fallback to English if key missing in Amharic
      if (!text && locale !== "en") {
        text = resolveKey(DICTIONARIES.en, key);
      }
      
      if (!text) {
        return key;
      }

      if (params) {
        for (const [paramKey, paramVal] of Object.entries(params)) {
          text = text.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(paramVal));
        }
      }

      return text;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, toggleLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = React.useContext(I18nContext);
  if (!ctx) {
    // Graceful fallback outside provider
    return {
      locale: "en" as Locale,
      setLocale: () => {},
      toggleLocale: () => {},
      t: (key: string, params?: Record<string, string | number>) => {
        let text = resolveKey(DICTIONARIES.en, key) || key;
        if (params) {
          for (const [k, v] of Object.entries(params)) {
            text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
          }
        }
        return text;
      },
    };
  }
  return ctx;
}
