"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  LayoutDashboard,
  School,
  Users,
  CalendarCheck,
  CalendarDays,
  History,
  LogOut,
  Shield,
  GraduationCap,
  Menu,
  X,
  Search,
  Sparkles,
  Command,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  CheckCircle2,
  Clock,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ThemeToggle, ThemeSegmentedToggle } from "@/components/theme-toggle";
import { logoutAction } from "@/actions/auth.actions";
import { cn } from "@/lib/utils";

export type DashboardUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: "ADMIN" | "TEACHER";
};

interface DashboardShellProps {
  user: DashboardUser;
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Close mobile drawer on route change
  const [prevPathname, setPrevPathname] = React.useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
  }

  // Command palette keyboard shortcut (Ctrl+K or Cmd+K)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setCommandOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navSections = [
    {
      label: "Attendance & Insights",
      items: [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
          badge: null,
        },
        {
          title: "Daily Attendance",
          href: "/attendance",
          icon: CalendarCheck,
          badge: "Live",
          badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        },
        {
          title: "Two-Week Overview",
          href: "/attendance/overview",
          icon: CalendarDays,
          badge: "Trends",
          badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        },
      ],
    },
    {
      label: "School Management",
      items: [
        {
          title: "Classes",
          href: "/classes",
          icon: School,
          badge: null,
        },
        {
          title: "Teachers",
          href: "/teachers",
          icon: GraduationCap,
          badge: user.role === "ADMIN" ? "Admin" : null,
          badgeColor: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
        },
        {
          title: "Students",
          href: "/students",
          icon: Users,
          badge: null,
        },
      ],
    },
    {
      label: "Communications",
      items: [
        {
          title: "SMS History & Retries",
          href: "/notifications",
          icon: History,
          badge: "SMSHub",
          badgeColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        },
      ],
    },
  ];

  // Quick navigation items for Cmd+K search
  const allNavItems = navSections.flatMap((s) => s.items);
  const filteredCommandItems = allNavItems.filter((i) =>
    i.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Today's date banner string
  const todayDateString = React.useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-slate-950 flex flex-col antialiased text-slate-900 dark:text-slate-100">
      {/* Top Universal Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl transition-all">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: Brand & Mobile Trigger */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden inline-flex items-center justify-center size-9 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              aria-label="Open sidebar menu"
            >
              <Menu className="size-5" />
            </button>

            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="relative size-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-blue-500/25 ring-1 ring-white/20 transition-transform group-hover:scale-105 duration-200">
                <Bell className="size-5" />
                <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white tracking-tight text-base leading-none">
                    AbsentAlert
                  </span>
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/40">
                    SaaS Portal
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Automated Absence SMS Gateway
                </p>
              </div>
            </Link>
          </div>

          {/* Center: Command Palette Trigger */}
          <div className="hidden md:flex items-center justify-center flex-1 max-w-md mx-6">
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="w-full flex items-center justify-between gap-3 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-900 text-xs transition-all shadow-xs"
            >
              <div className="flex items-center gap-2">
                <Search className="size-3.5" />
                <span>Search pages, classes, rosters...</span>
              </div>
              <kbd className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 font-mono text-[10px] text-slate-600 dark:text-slate-400 shadow-2xs">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right Controls: Today Badge, Mark Attendance Action, Theme, User */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Live Gateway Status Pill */}
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
              <span className="size-2 rounded-full bg-emerald-500 animate-ping inline-block" />
              <span>SMSHub: Online</span>
            </div>

            {/* Quick Action: Mark Attendance */}
            <Link href="/attendance">
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm shadow-blue-500/20 text-xs h-8 gap-1.5 px-3 rounded-lg transition-transform active:scale-95"
              >
                <CalendarCheck className="size-3.5" />
                <span className="hidden sm:inline">Mark Attendance</span>
                <span className="sm:hidden">Mark</span>
              </Button>
            </Link>

            {/* Dark / Light Mode Toggle */}
            <div className="border-l border-slate-200 dark:border-slate-800 pl-2">
              <ThemeToggle />
            </div>

            {/* User Profile Pill */}
            <div className="flex items-center gap-2 pl-1">
              <div className="size-8 rounded-full bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-700 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200 shadow-xs">
                {user.name ? user.name.slice(0, 2).toUpperCase() : user.role === "ADMIN" ? "AD" : "TC"}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container: Sidebar + Content */}
      <div className="flex-1 flex w-full">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md p-4 space-y-6 justify-between min-h-[calc(100vh-4rem)]">
          <div className="space-y-6">
            {/* User Info Card */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/60 dark:from-slate-800/60 dark:to-slate-900/40 border border-slate-200/70 dark:border-slate-800/60 shadow-2xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate max-w-[130px]">
                  {user.name || (user.role === "ADMIN" ? "Admin User" : "Teacher")}
                </span>
                <Badge
                  variant={user.role === "ADMIN" ? "default" : "secondary"}
                  className={cn(
                    "text-[10px] font-semibold px-2 py-0 rounded-md border",
                    user.role === "ADMIN"
                      ? "bg-purple-600/10 text-purple-700 dark:text-purple-300 border-purple-500/20"
                      : "bg-blue-600/10 text-blue-700 dark:text-blue-300 border-blue-500/20"
                  )}
                >
                  {user.role === "ADMIN" ? (
                    <span className="flex items-center gap-1">
                      <Shield className="size-2.5" /> Admin
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <GraduationCap className="size-2.5" /> Teacher
                    </span>
                  )}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                {user.email}
              </p>
            </div>

            {/* Navigation Sections */}
            <div className="space-y-5">
              {navSections.map((section) => (
                <div key={section.label} className="space-y-1">
                  <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {section.label}
                  </p>
                  <nav className="space-y-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        pathname === item.href ||
                        (item.href !== "/dashboard" && pathname.startsWith(item.href));
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150",
                            isActive
                              ? "bg-blue-600 text-white shadow-sm shadow-blue-500/25 font-semibold"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon
                              className={cn(
                                "size-4 transition-transform group-hover:scale-110",
                                isActive
                                  ? "text-white"
                                  : "text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100"
                              )}
                            />
                            <span>{item.title}</span>
                          </div>
                          {item.badge && (
                            <span
                              className={cn(
                                "text-[10px] font-semibold px-1.5 py-0.2 rounded-md border",
                                isActive
                                  ? "bg-white/20 text-white border-white/30"
                                  : item.badgeColor || "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar Footer: System Status Card & Sign Out */}
          <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 space-y-3">
            {/* School System Mini-Card */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800/60 text-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px] mb-1">
                <span>Ethiopian School Term</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">2026/27</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle2 className="size-3" />
                <span>Attendance Monitoring Active</span>
              </div>
            </div>

            {/* Logout Button */}
            <form action={logoutAction}>
              <Button
                variant="ghost"
                size="sm"
                type="submit"
                className="w-full justify-start text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl gap-2 font-medium"
              >
                <LogOut className="size-3.5" />
                <span>Sign out</span>
              </Button>
            </form>
          </div>
        </aside>

        {/* Mobile Navigation Drawer Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 p-5 shadow-2xl flex flex-col justify-between border-r border-slate-200 dark:border-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                      <Bell className="size-4" />
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      AbsentAlert
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                <div className="space-y-5">
                  {navSections.map((section) => (
                    <div key={section.label} className="space-y-1">
                      <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        {section.label}
                      </p>
                      <nav className="space-y-0.5">
                        {section.items.map((item) => {
                          const Icon = item.icon;
                          const isActive =
                            pathname === item.href ||
                            (item.href !== "/dashboard" && pathname.startsWith(item.href));
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={cn(
                                "flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors",
                                isActive
                                  ? "bg-blue-600 text-white font-semibold"
                                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                              )}
                            >
                              <div className="flex items-center gap-2.5">
                                <Icon className="size-4" />
                                <span>{item.title}</span>
                              </div>
                              {item.badge && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-md bg-white/20 text-white">
                                  {item.badge}
                                </span>
                              )}
                            </Link>
                          );
                        })}
                      </nav>
                    </div>
                  ))}
                </div>
              </div>

              <form action={logoutAction} className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  type="submit"
                  className="w-full justify-start text-xs text-red-600 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/40 gap-2"
                >
                  <LogOut className="size-4" />
                  <span>Sign out</span>
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full transition-all">
          {children}
        </main>
      </div>

      {/* Global Command Palette Modal (Cmd+K) */}
      {commandOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-start justify-center pt-20 px-4"
          onClick={() => setCommandOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center px-4 border-b border-slate-100 dark:border-slate-800">
              <Search className="size-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type a page, command, or action..."
                className="w-full px-3 py-3.5 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
                autoFocus
              />
              <kbd className="px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 font-mono">
                ESC
              </kbd>
            </div>

            <div className="max-h-72 overflow-y-auto p-2 space-y-1">
              <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Navigation
              </p>
              {filteredCommandItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => {
                      router.push(item.href);
                      setCommandOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="size-4 text-slate-400" />
                      <span>{item.title}</span>
                    </div>
                    <ChevronRight className="size-3.5 text-slate-400" />
                  </button>
                );
              })}

              {filteredCommandItems.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400">
                  No matching pages or actions found.
                </div>
              )}
            </div>

            <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 flex items-center justify-between text-[11px] text-slate-400">
              <span>Navigate with arrow keys or click</span>
              <span>AbsentAlert School OS</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
