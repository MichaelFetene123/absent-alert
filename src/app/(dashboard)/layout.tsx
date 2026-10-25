import { requireUser } from "@/lib/guards";
import { logoutAction } from "@/actions/auth.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
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
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const instant = false;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user;
  try {
    user = await requireUser();
  } catch {
    redirect("/login");
  }

  const navItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      adminOnly: false,
    },
    {
      title: "Classes",
      href: "/classes",
      icon: School,
      adminOnly: false,
    },
    {
      title: "Teachers",
      href: "/teachers",
      icon: GraduationCap,
      adminOnly: false,
    },
    {
      title: "Students",
      href: "/students",
      icon: Users,
      adminOnly: false,
    },
    {
      title: "Daily Attendance",
      href: "/attendance",
      icon: CalendarCheck,
      adminOnly: false,
    },
    {
      title: "Two-Week Overview",
      href: "/attendance/overview",
      icon: CalendarDays,
      adminOnly: false,
    },
    {
      title: "SMS Notifications",
      href: "/notifications",
      icon: History,
      adminOnly: false,
    },
  ];

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 md:h-screen bg-white dark:bg-slate-900 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between shrink-0 md:overflow-y-auto">
        <div>
          {/* Brand & Theme Toggle */}
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <Bell className="size-5" />
              </div>
              <div>
                <h1 className="font-bold text-slate-900 dark:text-white leading-tight">
                  AbsentAlert
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">School Portal</p>
              </div>
            </div>

            {/* Dark / Light Mode Toggle Button */}
            <ThemeToggle />
          </div>

          {/* User Profile Card */}
          <div className="p-4 mx-3 my-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate max-w-32.5">
                {user.name || user.email}
              </span>
              <Badge
                variant={user.role === "ADMIN" ? "default" : "secondary"}
                className={
                  user.role === "ADMIN"
                    ? "bg-purple-600 hover:bg-purple-700 text-white text-[10px]"
                    : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-[10px]"
                }
              >
                {user.role === "ADMIN" ? (
                  <span className="flex items-center gap-1">
                    <Shield className="size-3" /> Admin
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <GraduationCap className="size-3" /> Teacher
                  </span>
                )}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
          </div>

          {/* Nav links */}
          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <Icon className="size-4 text-slate-500 dark:text-slate-400" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer with Theme Row & Sign Out */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <form action={logoutAction}>
            <Button
              variant="outline"
              size="sm"
              type="submit"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 border-slate-200 dark:border-slate-800 gap-2"
            >
              <LogOut className="size-4" />
              <span>Sign out</span>
            </Button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:h-screen md:overflow-y-auto">
        <div className="p-6 md:p-8 max-w-6xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
