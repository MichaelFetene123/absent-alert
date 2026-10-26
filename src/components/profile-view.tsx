"use client";

import * as React from "react";
import {
  User as UserIcon,
  Mail,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  School,
  CalendarCheck,
  Save,
  LogOut,
  Sparkles,
  Lock,
  Globe,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { useLogoutMutation } from "@/hooks/use-auth";
import {
  useUserProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} from "@/hooks/use-profile";
import type { UserProfileData } from "@/actions/profile.actions";

type Props = {
  initialProfile: UserProfileData;
};

export function ProfileView({ initialProfile }: Props) {
  const { t, locale, setLocale } = useI18n();

  const { data: profile = initialProfile } = useUserProfileQuery(initialProfile);
  const updateProfileMutation = useUpdateProfileMutation();
  const changePasswordMutation = useChangePasswordMutation();
  const logoutMutation = useLogoutMutation();

  // Profile Form State
  const [name, setName] = React.useState(initialProfile.name);
  const [email, setEmail] = React.useState(initialProfile.email);
  const isSavingProfile = updateProfileMutation.isPending;

  // Password Form State
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false);
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const isChangingPassword = changePasswordMutation.isPending;

  // Active Tab
  const [activeTab, setActiveTab] = React.useState<"general" | "security" | "preferences">("general");

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error("Name must be at least 2 characters.");
      return;
    }
    if (!email.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }

    updateProfileMutation.mutate(
      { name, email },
      {
        onSuccess: (res) => {
          if (res.ok) {
            toast.success("Profile details updated successfully.");
          } else {
            toast.error(res.error || "Failed to update profile.");
          }
        },
        onError: () => {
          toast.error("An unexpected error occurred while saving profile.");
        },
      }
    );
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match.");
      return;
    }

    changePasswordMutation.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: (res) => {
          if (res.ok) {
            toast.success("Password changed successfully.");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
          } else {
            toast.error(res.error || "Failed to change password.");
          }
        },
        onError: () => {
          toast.error("An unexpected error occurred while changing password.");
        },
      }
    );
  };

  const getInitials = (name: string) => {
    if (!name) return "US";
    const parts = name.trim().split(" ");
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0]! + parts[1][0]!).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Profile Header Banner */}
      <div className="relative rounded-2xl bg-card text-card-foreground border border-border p-6 shadow-xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-2xl bg-primary text-primary-foreground font-bold text-xl flex items-center justify-center shadow-xs shrink-0">
              {getInitials(profile.name)}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  {profile.name}
                </h1>
                <Badge
                  variant={profile.role === "ADMIN" ? "default" : "secondary"}
                  className="text-xs font-semibold"
                >
                  {profile.role === "ADMIN" ? "School Administrator" : "Teacher"}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground font-mono">
                {profile.email}
              </p>

              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1.5">
                  <School className="size-3.5 text-primary" />
                  {profile.assignedClasses.length > 0
                    ? profile.assignedClasses.join(", ")
                    : "School-Wide Access"}
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarCheck className="size-3.5 text-primary" />
                  {profile.totalMarkedCount} Attendance Records Marked
                </span>
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="text-xs text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive gap-1.5 h-8.5"
          >
            <LogOut className="size-3.5" />
            <span>Sign out</span>
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border gap-6">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "general"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {locale === "am" ? "የግል መረጃ" : "Personal Information"}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "security"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {locale === "am" ? "ደህንነትና የይለፍ ቃል" : "Security & Password"}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("preferences")}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "preferences"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {locale === "am" ? "ምርጫዎች" : "Preferences & Language"}
        </button>
      </div>

      {/* TAB 1: PERSONAL INFORMATION */}
      {activeTab === "general" && (
        <Card className="border-border bg-card text-card-foreground shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <UserIcon className="size-4 text-primary" />
              <span>Account Information</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Update your full name and primary email address used for sign in and institutional alerts.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Full Name
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Abebe Bikila"
                    className="h-9 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. name@school.edu"
                    className="h-9 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                    Institutional Role
                  </span>
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                    <Shield className="size-3.5 text-primary" />
                    <span>{profile.role === "ADMIN" ? "System Administrator" : "Classroom Teacher"}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground block">
                    {profile.role === "ADMIN"
                      ? "Full administrative rights to modify policies, SMS credentials, and rosters."
                      : "Authorized to record daily attendance and submit parent absence notifications."}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                    Assigned Classes
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {profile.assignedClasses.length > 0 ? (
                      profile.assignedClasses.map((c) => (
                        <Badge key={c} variant="outline" className="text-xs">
                          {c}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">All institutional classes</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <Button
                  type="submit"
                  disabled={isSavingProfile}
                  className="text-xs h-9 px-4 gap-1.5"
                >
                  <Save className="size-3.5" />
                  {isSavingProfile ? "Saving..." : "Save Profile Details"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: SECURITY & PASSWORD */}
      {activeTab === "security" && (
        <Card className="border-border bg-card text-card-foreground shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <KeyRound className="size-4 text-primary" />
              <span>Change Account Password</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Ensure your account is protected with a secure password. Minimum 6 characters.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Current Password
                </label>
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="h-9 text-xs pr-9"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new secure password"
                    className="h-9 text-xs pr-9"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Confirm New Password
                </label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isChangingPassword}
                  className="text-xs h-9 px-4 gap-1.5"
                >
                  <Lock className="size-3.5" />
                  {isChangingPassword ? "Updating Password..." : "Update Password"}
                </Button>
              </div>
            </form>

            <div className="p-3 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground space-y-1">
              <span className="font-semibold text-foreground block">
                Security Best Practices
              </span>
              <p>• Avoid reusing passwords from other personal or email accounts.</p>
              <p>• Passwords are encrypted server-side with 10 salt rounds of bcrypt.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: PREFERENCES */}
      {activeTab === "preferences" && (
        <Card className="border-border bg-card text-card-foreground shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Globe className="size-4 text-primary" />
              <span>Language & Interface Preferences</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Select your preferred language for the application dashboard and reports.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setLocale("en");
                  toast.success("Interface language set to English.");
                }}
                className={`p-4 rounded-xl border text-left transition-all ${
                  locale === "en"
                    ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/20"
                    : "border-border hover:border-foreground/20 bg-card text-card-foreground"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-foreground">English (US)</span>
                  {locale === "en" && <CheckCircle2 className="size-4 text-primary" />}
                </div>
                <p className="text-xs text-muted-foreground">Default institutional dashboard language.</p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLocale("am");
                  toast.success("የስርዓቱ ቋንቋ ወደ አማርኛ ተቀይሯል።");
                }}
                className={`p-4 rounded-xl border text-left transition-all ${
                  locale === "am"
                    ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/20"
                    : "border-border hover:border-foreground/20 bg-card text-card-foreground"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-foreground">አማርኛ (ኢትዮጵያ)</span>
                  {locale === "am" && <CheckCircle2 className="size-4 text-primary" />}
                </div>
                <p className="text-xs text-muted-foreground">የአማርኛ ቋንቋ ዳሽቦርድ እና ሪፖርቶች።</p>
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
