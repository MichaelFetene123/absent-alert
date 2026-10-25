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
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
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

function subscribeToSidebar(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSidebarSnapshot(): boolean {
  try {
    return localStorage.getItem("sidebar_collapsed") === "true";
  } catch {
    return false;
  }
}

function getSidebarServerSnapshot(): boolean {
  return false;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [collapsedOverride, setCollapsedOverride] = React.useState<boolean | null>(null);

  const storedCollapsed = React.useSyncExternalStore(
    subscribeToSidebar,
    getSidebarSnapshot,
    getSidebarServerSnapshot
  );

  const collapsed = collapsedOverride ?? storedCollapsed;

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsedOverride(next);
    try {
      localStorage.setItem("sidebar_collapsed", String(next));
    } catch {
      // ignore
    }
  };

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
      label: "Attendance",
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
          badge: null,
        },
      ],
    },
    {
      label: "Management",
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
      label: "System",
      items: [
        {
          title: "SMS Logs",
          href: "/notifications",
          icon: History,
          badge: null,
        },
      ],
    },
  ];

  // Quick navigation items for Cmd+K search
  const allNavItems = navSections.flatMap((s) => s.items);
  const filteredCommandItems = allNavItems.filter((i) =>
    i.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col antialiased text-slate-900 dark:text-slate-100">
      {/* Top Universal Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          {/* Left: Brand & Mobile Trigger & Desktop Sidebar Toggle */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden inline-flex items-center justify-center size-8 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              aria-label="Open navigation menu"
            >
              <Menu className="size-4" />
            </button>

            {/* Desktop Collapsible Toggle Button */}
            <button
              type="button"
              onClick={toggleCollapsed}
              className="hidden md:inline-flex items-center justify-center size-8 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              aria-label={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {collapsed ? (
                <PanelLeftOpen className="size-4" />
              ) : (
                <PanelLeftClose className="size-4" />
              )}
            </button>

            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="size-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Bell className="size-4" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">
                  AbsentAlert
                </span>
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {user.role}
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Search / Command Palette Shortcut */}
          <div className="hidden md:flex items-center justify-center flex-1 max-w-sm mx-4">
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 text-xs transition-colors"
            >
              <div className="flex items-center gap-2">
                <Search className="size-3.5" />
                <span>Search pages &amp; classes...</span>
              </div>
              <kbd className="inline-flex items-center px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono text-[10px] text-slate-600 dark:text-slate-400">
                Ctrl K
              </kbd>
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5">
            {/* Live Gateway Pill */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span>SMSHub Active</span>
            </div>

            {/* Quick Action: Mark Attendance */}
            <Link href="/attendance">
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-8 gap-1.5 px-3 rounded-lg shadow-xs"
              >
                <CalendarCheck className="size-3.5" />
                <span className="hidden sm:inline">Take Attendance</span>
                <span className="sm:hidden">Attendance</span>
              </Button>
            </Link>

            {/* Dark / Light Mode Toggle */}
            <ThemeToggle />

            {/* User Avatar */}
            <div
              className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200"
              title={`${user.name || user.email} (${user.role})`}
            >
              {user.name ? user.name.slice(0, 2).toUpperCase() : user.role === "ADMIN" ? "AD" : "TC"}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container: Sidebar + Content */}
      <div className="flex-1 flex w-full">
        {/* Desktop Collapsible / Expandable Sidebar */}
        <aside
          className={cn(
            "hidden md:flex flex-col shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-4 justify-between transition-all duration-200 ease-in-out min-h-[calc(100vh-3.5rem)]",
            collapsed ? "w-16" : "w-60"
          )}
        >
          <div className="space-y-4">
            {/* User summary card (only when expanded) */}
            {!collapsed ? (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                    {user.name || "User"}
                  </span>
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-medium">
                    {user.role}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                  {user.email}
                </p>
              </div>
            ) : (
              <div className="flex justify-center pb-1">
                <div
                  className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-300"
                  title={`${user.name || user.email} (${user.role})`}
                >
                  {user.name ? user.name.slice(0, 2).toUpperCase() : "U"}
                </div>
              </div>
            )}

            {/* Navigation Groups */}
            <div className="space-y-4">
              {navSections.map((section) => (
                <div key={section.label} className="space-y-1">
                  {!collapsed && (
                    <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {section.label}
                    </p>
                  )}
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
                          title={collapsed ? item.title : undefined}
                          className={cn(
                            "flex items-center rounded-lg text-xs font-medium transition-colors",
                            collapsed
                              ? "justify-center size-10 mx-auto"
                              : "justify-between px-2.5 py-2",
                            isActive
                              ? "bg-blue-600 text-white font-semibold shadow-xs"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                          )}
                        >
                          <div className={cn("flex items-center", collapsed ? "" : "gap-2.5")}>
                            <Icon
                              className={cn(
                                "size-4 shrink-0",
                                isActive
                                  ? "text-white"
                                  : "text-slate-500 dark:text-slate-400"
                              )}
                            />
                            {!collapsed && <span>{item.title}</span>}
                          </div>

                          {!collapsed && item.badge && (
                            <span
                              className={cn(
                                "text-[10px] font-semibold px-1.5 py-0.2 rounded border",
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

          {/* Sidebar Footer: Toggle + Logout */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
            {!collapsed && (
              <div className="px-2.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 text-[11px] text-slate-500 space-y-0.5">
                <div className="flex justify-between">
                  <span>School Term</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">2026/27</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[10px]">
                  <CheckCircle2 className="size-2.5" />
                  <span>Roll-Call Active</span>
                </div>
              </div>
            )}

            <form action={logoutAction} className="w-full">
              <Button
                variant="ghost"
                size="sm"
                type="submit"
                title={collapsed ? "Sign out" : undefined}
                className={cn(
                  "text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg font-medium",
                  collapsed ? "w-10 h-10 p-0 mx-auto flex justify-center" : "w-full justify-start gap-2"
                )}
              >
                <LogOut className="size-4 shrink-0" />
                {!collapsed && <span>Sign out</span>}
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
              className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 p-4 shadow-xl flex flex-col justify-between border-r border-slate-200 dark:border-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
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
                    aria-label="Close menu"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                <div className="space-y-4">
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
                                "flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors",
                                isActive
                                  ? "bg-blue-600 text-white font-semibold"
                                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                              )}
                            >
                              <div className="flex items-center gap-2.5">
                                <Icon className="size-4" />
                                <span>{item.title}</span>
                              </div>
                              {item.badge && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded border bg-slate-100 dark:bg-slate-800">
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

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <form action={logoutAction} className="w-full">
                  <Button
                    variant="ghost"
                    size="sm"
                    type="submit"
                    className="w-full justify-start text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg gap-2"
                  >
                    <LogOut className="size-4" />
                    <span>Sign out</span>
                  </Button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full min-w-0">
          {children}
        </main>
      </div>

      {/* Global Command Palette Dialog */}
      {commandOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-start justify-center pt-[15vh] px-4"
          onClick={() => setCommandOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center px-3 border-b border-slate-200 dark:border-slate-800">
              <Search className="size-4 text-slate-400 mr-2" />
              <Input
                autoFocus
                placeholder="Search views, classes, actions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 border-0 focus-visible:ring-0 shadow-none text-sm bg-transparent"
              />
              <kbd className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                ESC
              </kbd>
            </div>

            <div className="max-h-72 overflow-y-auto p-2 space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Navigation
              </div>
              {filteredCommandItems.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No matching views found
                </div>
              ) : (
                filteredCommandItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => {
                        setCommandOpen(false);
                        router.push(item.href);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="size-4 text-slate-500" />
                        <span>{item.title}</span>
                      </div>
                      <ChevronRight className="size-3.5 text-slate-400" />
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
