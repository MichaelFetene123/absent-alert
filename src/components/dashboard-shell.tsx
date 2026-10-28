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
  Settings,
  Clock,
  User,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { I18nProvider, useI18n } from "@/lib/i18n/context";
import { useLogoutMutation } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export type DashboardUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: "ADMIN" | "TEACHER";
};

export type NavItem = {
  title: string;
  href: string;
  icon: any;
  badge?: string | null;
  badgeColor?: string;
};

export type NavSection = {
  label: string;
  items: NavItem[];
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

function ShellInner({ user, children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t, locale } = useI18n();
  const logoutMutation = useLogoutMutation();
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

  // User dropdown menu state in header
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  // Close menus on route change
  const [prevPathname, setPrevPathname] = React.useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }

  // Click outside to close user menu
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userMenuOpen]);

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

  const navSections: NavSection[] = [
    {
      label: locale === "am" ? "አቴንዳንስ" : "Attendance",
      items: [
        {
          title: locale === "am" ? "ዳሽቦርድ" : "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
          badge: null,
        },
        {
          title: locale === "am" ? "አቴንዳንስ መዝግብ" : "Take Attendance",
          href: "/attendance",
          icon: CalendarCheck,
          badge: null,
        },
        {
          title: locale === "am" ? "ልዩነቶችና እርማቶች" : "Exceptions & Late",
          href: "/attendance/exceptions",
          icon: Clock,
          badge: null,
        },
      ],
    },
    {
      label: locale === "am" ? "ተማሪዎችና ክፍሎች" : "Classes & Students",
      items: [
        {
          title: locale === "am" ? "ክፍሎች" : "Grades & Sections",
          href: "/classes",
          icon: School,
          badge: null,
        },
        {
          title: locale === "am" ? "የተማሪዎች ማውጫ" : "Student Directory",
          href: "/students",
          icon: Users,
          badge: null,
        },
        {
          title: locale === "am" ? "ወላጆችና አሳዳጊዎች" : "Parents & Guardians",
          href: "/guardians",
          icon: Users,
          badge: null,
        },
      ],
    },
    {
      label: locale === "am" ? "አስተዳደር" : "Administration",
      items: [
        {
          title: locale === "am" ? "መምህራንና ሠራተኞች" : "Teachers & Staff",
          href: "/teachers",
          icon: GraduationCap,
          badge: user.role === "ADMIN" ? "Admin" : null,
          badgeColor: "bg-primary/10 text-primary border-primary/20",
        },
        {
          title: locale === "am" ? "የት/ቤት ቅንብሮች" : "School Settings",
          href: "/settings",
          icon: Settings,
          badge: null,
        },
      ],
    },
  ];

  // Quick navigation items for Cmd+K search
  const allNavItems: NavItem[] = navSections.flatMap((s) => s.items);
  const filteredCommandItems: NavItem[] = allNavItems.filter((i) =>
    i.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allHrefs = allNavItems.map((i) => i.href);

  const checkIsActive = (href: string) => {
    if (pathname === href) return true;
    if (allHrefs.includes(pathname)) return false;
    return href !== "/dashboard" && pathname.startsWith(href + "/");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
      {/* Top Universal Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-card text-card-foreground">
        <div className="flex h-14 items-center justify-between px-3 sm:px-6">
          {/* Left: Brand & Mobile Trigger & Desktop Sidebar Toggle */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden inline-flex items-center justify-center size-8 rounded-lg border border-border hover:bg-muted text-muted-foreground transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="size-4" />
            </button>

            {/* Desktop Collapsible Toggle Button */}
            <button
              type="button"
              onClick={toggleCollapsed}
              className="hidden md:inline-flex items-center justify-center size-8 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              aria-label={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {collapsed ? (
                <PanelLeftOpen className="size-4" />
              ) : (
                <PanelLeftClose className="size-4" />
              )}
            </button>

            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-xs">
                <Bell className="size-4" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-foreground text-sm tracking-tight">
                  AbsentAlert
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Search / Command Palette Shortcut */}
          <div className="hidden lg:flex items-center justify-center flex-1 max-w-sm mx-4">
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg border border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground text-xs transition-colors"
            >
              <div className="flex items-center gap-2">
                <Search className="size-3.5" />
                <span>Search pages &amp; classes...</span>
              </div>
              <kbd className="inline-flex items-center px-1.5 py-0.5 rounded border border-border bg-background font-mono text-[10px] text-muted-foreground">
                Ctrl K
              </kbd>
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            {/* Language Switcher (EN / AM) */}
            <LanguageToggle />

            {/* Dark / Light Mode Toggle */}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Container: Sidebar + Content */}
      <div className="flex-1 flex w-full">
        {/* Desktop Fixed Collapsible / Expandable Sidebar */}
        <aside
          className={cn(
            "hidden md:flex flex-col fixed top-14 bottom-0 left-0 z-30 border-r border-border bg-sidebar text-sidebar-foreground p-3 transition-all duration-200 ease-in-out",
            collapsed ? "w-16" : "w-60"
          )}
        >
          <div className="space-y-4 overflow-y-auto flex-1 pr-0.5">
            {/* Navigation Groups */}
            <div className="space-y-4">
              {navSections.map((section) => (
                <div key={section.label} className="space-y-1">
                  {!collapsed && (
                    <p className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {section.label}
                    </p>
                  )}
                  <nav className="space-y-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = checkIsActive(item.href);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          title={collapsed ? item.title : undefined}
                          className={cn(
                            "flex items-center rounded-lg text-xs font-medium transition-colors",
                            collapsed
                              ? "justify-center size-9 mx-auto"
                              : "justify-between px-2.5 py-1.5",
                            isActive
                              ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          )}
                        >
                          <div className={cn("flex items-center", collapsed ? "" : "gap-2.5")}>
                            <Icon
                              className={cn(
                                "size-4 shrink-0",
                                isActive
                                  ? "text-primary-foreground"
                                  : "text-muted-foreground"
                              )}
                            />
                            {!collapsed && <span className="truncate">{item.title}</span>}
                          </div>

                          {!collapsed && item.badge && (
                            <span
                              className={cn(
                                "text-[10px] font-semibold px-1.5 py-0.2 rounded border shrink-0",
                                isActive
                                  ? "bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30"
                                  : item.badgeColor || "bg-muted text-muted-foreground border-border"
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

          {/* Bottom Sidebar User Profile */}
          <div className="pt-2 border-t border-border relative mt-auto" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((prev) => !prev)}
              className={cn(
                "flex items-center gap-2 rounded-lg border border-border bg-muted/50 hover:bg-muted transition-colors text-xs",
                collapsed
                  ? "size-9 mx-auto justify-center p-0"
                  : "w-full p-1.5 justify-between"
              )}
              aria-expanded={userMenuOpen}
              aria-label="User account menu"
              title={collapsed ? (user.name || "User account") : undefined}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                  {user.name ? user.name.slice(0, 2).toUpperCase() : user.role === "ADMIN" ? "AD" : "TC"}
                </div>
                {!collapsed && (
                  <div className="flex flex-col text-left leading-tight truncate">
                    <span className="font-semibold text-foreground truncate text-xs">
                      {user.name || (user.role === "ADMIN" ? "Administrator" : "Teacher")}
                    </span>
                    <span className="text-[10px] text-muted-foreground capitalize truncate">
                      {user.role.toLowerCase()}
                    </span>
                  </div>
                )}
              </div>
              {!collapsed && (
                <ChevronDown
                  className={cn(
                    "size-3 text-muted-foreground shrink-0 transition-transform",
                    userMenuOpen && "rotate-180"
                  )}
                />
              )}
            </button>

            {userMenuOpen && (
              <div
                className={cn(
                  "absolute rounded-xl border border-border bg-popover text-popover-foreground shadow-xl py-1.5 z-50 text-xs",
                  collapsed
                    ? "bottom-0 left-full ml-2 w-56"
                    : "bottom-full left-0 mb-2 w-full min-w-50"
                )}
              >
                <div className="px-3 py-2 border-b border-border">
                  <p className="font-semibold text-foreground truncate">
                    {user.name || "User Account"}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                    {user.email || "No email"}
                  </p>
                  <div className="mt-1.5">
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                      {user.role}
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    href="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-foreground hover:bg-muted font-medium transition-colors"
                  >
                    <User className="size-4 text-primary shrink-0" />
                    <div>
                      <p className="leading-none">{locale === "am" ? "የግል መገለጫ" : "My Profile"}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {locale === "am" ? "መለያና የይለፍ ቃል" : "Account details & security"}
                      </p>
                    </div>
                  </Link>
                </div>

                <div className="border-t border-border pt-1">
                  <button
                    type="button"
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-destructive hover:bg-destructive/10 font-medium transition-colors text-left disabled:opacity-50"
                  >
                    <LogOut className="size-4 shrink-0" />
                    <span>{locale === "am" ? "መውጣት (Sign out)" : "Sign out"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Mobile Navigation Drawer Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div
              className="fixed inset-y-0 left-0 w-64 bg-card text-card-foreground p-4 shadow-xl flex flex-col justify-between border-r border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-6rem)]">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="size-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
                      <Bell className="size-3.5" />
                    </div>
                    <span className="font-bold text-foreground text-sm">
                      AbsentAlert
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </div>

                {navSections.map((sec) => (
                  <div key={sec.label} className="space-y-1">
                    <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {sec.label}
                    </p>
                    <nav className="space-y-0.5">
                      {sec.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = checkIsActive(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={cn(
                              "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium",
                              isActive
                                ? "bg-primary text-primary-foreground font-semibold"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <Icon className="size-4 shrink-0" />
                              <span>{item.title}</span>
                            </div>
                            {item.badge && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded border bg-muted text-muted-foreground border-border">
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

              <div className="pt-3 border-t border-border space-y-2">
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 p-2 rounded-lg border border-border bg-muted/50 hover:bg-muted transition-colors text-xs"
                >
                  <div className="size-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                    {user.name ? user.name.slice(0, 2).toUpperCase() : user.role === "ADMIN" ? "AD" : "TC"}
                  </div>
                  <div className="flex flex-col text-left leading-tight truncate flex-1 min-w-0">
                    <span className="font-semibold text-foreground truncate text-xs">
                      {user.name || (user.role === "ADMIN" ? "Administrator" : "Teacher")}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      {user.email || (user.role === "ADMIN" ? "admin" : "teacher")}
                    </span>
                  </div>
                  <User className="size-3.5 text-muted-foreground shrink-0" />
                </Link>

                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                  className="w-full justify-start gap-2 text-destructive hover:bg-destructive/10 text-xs px-3"
                >
                  <LogOut className="size-4" />
                  <span>{locale === "am" ? "ውጣ" : "Sign out"}</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area (Offset for fixed sidebar on md+) */}
        <main
          className={cn(
            "flex-1 p-4 sm:p-6 lg:p-8 w-full transition-all duration-200 min-h-[calc(100vh-3.5rem)]",
            collapsed ? "md:ml-16" : "md:ml-60"
          )}
        >
          {children}
        </main>
      </div>

      {/* Command Palette Modal (Ctrl+K) */}
      {commandOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-xs flex items-start justify-center pt-20 px-4"
          onClick={() => setCommandOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-popover text-popover-foreground rounded-xl shadow-2xl border border-border overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-border">
              <Search className="size-4 text-muted-foreground shrink-0" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Type to search modules, classes, and settings..."
                className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden"
              />
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-border text-muted-foreground">
                ESC
              </kbd>
            </div>

            <div className="p-2 max-h-72 overflow-y-auto space-y-1">
              {filteredCommandItems.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground">
                  No matching modules found.
                </div>
              ) : (
                filteredCommandItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => {
                        router.push(item.href);
                        setCommandOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-lg text-xs hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="size-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">
                          {item.title}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {item.href}
                      </span>
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

export function DashboardShell({ user, children }: DashboardShellProps) {
  return (
    <I18nProvider>
      <ShellInner user={user}>{children}</ShellInner>
    </I18nProvider>
  );
}
