"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, History, FileText, ChevronLeft } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

export function SettingsNav() {
  const pathname = usePathname();
  const { locale } = useI18n();

  const tabs = [
    {
      label: locale === "am" ? "የት/ቤት ቅንብሮች" : "School Settings",
      href: "/settings",
      icon: Settings,
      active: pathname === "/settings",
    },
    {
      label: locale === "am" ? "የመልእክት ታሪክ" : "Message History",
      href: "/settings/notifications",
      icon: History,
      active: pathname.startsWith("/settings/notifications"),
    },
    {
      label: locale === "am" ? "የኤስኤምኤስ ቴምፕሌቶች" : "SMS Templates",
      href: "/settings/templates",
      icon: FileText,
      active: pathname.startsWith("/settings/templates"),
    },
  ];

  const isSubPage = pathname !== "/settings";

  return (
    <div className="space-y-3 mb-6">
      {isSubPage && (
        <div>
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
          >
            <ChevronLeft className="size-3.5" />
            <span>{locale === "am" ? "ወደ ቅንብሮች ማውጫ ተመለስ" : "Back to School Settings"}</span>
          </Link>
        </div>
      )}
      <nav
        aria-label="School Settings Tabs"
        className="flex items-center gap-1.5 border-b border-border pb-px overflow-x-auto"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 text-xs font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
                tab.active
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              <Icon className="size-3.5 shrink-0" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
