"use server";

import { requireUser } from "@/lib/guards";
import { db } from "@/lib/db";
import { updateTag, CACHE_TAGS } from "@/components/cacheTag";
import { fetchUserProfileData } from "@/lib/services/profile.service";
import bcrypt from "bcryptjs";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, "Current password must be at least 6 characters"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export type UserProfileData = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "TEACHER";
  assignedClasses: string[];
  totalMarkedCount: number;
};

export async function getUserProfileAction(): Promise<{
  ok: boolean;
  profile?: UserProfileData;
  error?: string;
}> {
  try {
    const sessionUser = await requireUser();
    const profile = await fetchUserProfileData(sessionUser.id);

    if (!profile) {
      return { ok: false, error: "User not found." };
    }

    return {
      ok: true,
      profile,
    };
  } catch (err: any) {
    return { ok: false, error: err.message || "Failed to load profile." };
  }
}

export async function updateProfileDetailsAction(data: {
  name: string;
  email: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const sessionUser = await requireUser();
    const parsed = updateProfileSchema.safeParse(data);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message || "Invalid input." };
    }

    const { name, email } = parsed.data;

    // Check if email taken by another user
    const existing = await db.orm.public.User.where({ email }).first();
    if (existing && existing.id !== sessionUser.id) {
      return { ok: false, error: "This email address is already in use." };
    }

    await db.orm.public.User.where({ id: sessionUser.id }).update({
      name,
      email,
    });

    try {
      updateTag(CACHE_TAGS.PROFILE(sessionUser.id));
      updateTag(CACHE_TAGS.TEACHERS);
      updateTag(CACHE_TAGS.DASHBOARD);
    } catch {}

    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "Failed to update profile." };
  }
}

export async function changePasswordAction(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const sessionUser = await requireUser();
    const parsed = changePasswordSchema.safeParse(data);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message || "Invalid password input." };
    }

    const { currentPassword, newPassword } = parsed.data;

    const user = await db.orm.public.User.where({ id: sessionUser.id }).first();
    if (!user || !user.passwordHash) {
      return { ok: false, error: "User record not found." };
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return { ok: false, error: "The current password you entered is incorrect." };
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.orm.public.User.where({ id: sessionUser.id }).update({
      passwordHash: newHash,
    });

    try {
      updateTag(CACHE_TAGS.PROFILE(sessionUser.id));
    } catch {}

    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "Failed to change password." };
  }
}
