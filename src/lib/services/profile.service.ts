import "server-only";
import { cacheTag, cacheLife, CACHE_TAGS, CACHE_PROFILES } from "@/components/cacheTag";
import { db } from "@/lib/db";
import type { UserProfileData } from "@/actions/profile.actions";

export async function fetchUserProfileData(userId: string): Promise<UserProfileData | null> {
  "use cache";
  cacheLife(CACHE_PROFILES.STRUCTURE);
  cacheTag(CACHE_TAGS.PROFILE(userId));

  const user = await db.orm.public.User.where({ id: userId }).first();
  if (!user) {
    return null;
  }

  // Get assigned classes
  const teacherClasses = await db.orm.public.TeacherClass.where({
    userId: user.id,
  }).all();

  const classNames: string[] = [];
  for (const tc of teacherClasses) {
    const c = await db.orm.public.Class.where({ id: tc.classId }).first();
    if (c) classNames.push(c.name);
  }

  // Get attendance records marked
  const markedRecords = await db.orm.public.AttendanceRecord.where({
    markedById: user.id,
  }).all();

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    assignedClasses: classNames,
    totalMarkedCount: markedRecords.length,
  };
}
