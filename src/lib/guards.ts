import "server-only";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: "ADMIN" | "TEACHER";
};

export class AuthError extends Error {
  code: "UNAUTHENTICATED" | "FORBIDDEN";

  constructor(message: string, code: "UNAUTHENTICATED" | "FORBIDDEN") {
    super(message);
    this.name = "AuthError";
    this.code = code;
  }
}

/**
 * Returns current authenticated user or null. Never throws.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  const u = session?.user;
  if (!u?.id || !u.role) {
    return null;
  }
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as "ADMIN" | "TEACHER",
  };
}

/**
 * Ensures user is authenticated. Throws UNAUTHENTICATED error otherwise.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new AuthError("You must be logged in to access this resource", "UNAUTHENTICATED");
  }
  return user;
}

/**
 * Ensures user has ADMIN role. Throws FORBIDDEN otherwise.
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    throw new AuthError("Access denied: Administrator privileges required", "FORBIDDEN");
  }
  return user;
}

/**
 * Ensures user is either ADMIN or a TEACHER assigned to the given class.
 */
export async function requireClassAccess(classId: string): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role === "ADMIN") {
    return user;
  }

  // Teacher role check: verify teacherClass link
  const link = await db.orm.public.TeacherClass.where({
    userId: user.id,
    classId,
  }).first();

  if (!link) {
    throw new AuthError("Access denied: You are not assigned to this class", "FORBIDDEN");
  }

  return user;
}
