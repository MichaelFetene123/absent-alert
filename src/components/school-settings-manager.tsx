"use client";

import * as React from "react";
import Link from "next/link";
import {
  Settings,
  History,
  FileText,
  ArrowRight,
  ShieldCheck,
  Send,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/context";

export function SchoolSettingsManager() {
  const { locale } = useI18n();

  const menuItems = [
    {
      title: locale === "am" ? "የመልእክት ታሪክ" : "Message History",
      subtitle: locale === "am" ? "የወላጅ ማሳወቂያዎች ክትትል" : "Parent Notifications & SMS Dispatch",
      description:
        locale === "am"
          ? "የተላኩ የቀሪ ማሳወቂያዎች ዝርዝር፣ የSMSHub የስርጭት ሁኔታና ያልተሳኩ መልእክቶችን ዳግም መላኪያ።"
          : "Audit absence notifications sent to guardians, carrier delivery status from SMSHub, and retry failed alerts.",
      href: "/settings/notifications",
      icon: History,
      badge: locale === "am" ? "የቀጥታ ክትትል" : "Live Dispatch Logs",
      badgeColor: "bg-primary/10 text-primary border-primary/20",
      cta: locale === "am" ? "የመልእክት ታሪክ ይመልከቱ" : "View Message History",
    },
    {
      title: locale === "am" ? "የኤስኤምኤስ ቴምፕሌቶች" : "SMS Templates",
      subtitle: locale === "am" ? "የማሳወቂያ ጽሑፎች ውቅር" : "Message Templates & Dynamic Tags",
      description:
        locale === "am"
          ? "በእንግሊዝኛና በአማርኛ የተዘጋጁ የቀሪዎች ማሳወቂያ ጽሑፎችን ማስተካከል፣ መፈተሽና ማዋቀር።"
          : "Create and customize automated absence and late alert message templates in English and Amharic with dynamic tags.",
      href: "/settings/templates",
      icon: FileText,
      badge: locale === "am" ? "አማርኛና እንግሊዝኛ" : "English & Amharic",
      badgeColor: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
      cta: locale === "am" ? "ቴምፕሌቶችን ያዋቅሩ" : "Configure Templates",
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="pb-3 border-b border-border">
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Settings className="size-5 text-primary" />
          {locale === "am" ? "የትምህርት ቤት ቅንብሮች" : "School Settings"}
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          {locale === "am"
            ? "የመልእክት ስርጭት ታሪክ፣ የወላጅ ማሳወቂያ ቴምፕሌቶችና የግንኙነት ውቅሮች ማዕከል።"
            : "Institutional communication center, SMS dispatch logs, and notification template settings."}
        </p>
      </div>

      {/* Card-Based Menu */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group block rounded-xl border border-border bg-card text-card-foreground p-5 shadow-xs hover:border-primary/50 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
                  <Icon className="size-5" />
                </div>
                <Badge
                  variant="outline"
                  className={`text-[10px] font-semibold border ${item.badgeColor}`}
                >
                  {item.badge}
                </Badge>
              </div>

              <div>
                <h2 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                  {item.title}
                </h2>
                <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                  {item.subtitle}
                </p>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between text-xs font-semibold text-primary">
                <span>{item.cta}</span>
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 duration-200" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
