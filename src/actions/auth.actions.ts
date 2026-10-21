"use server";

import { signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";

export type AuthActionResult = {
  ok: boolean;
  error?: string;
};

export async function loginAction(
  prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = (formData.get("redirectTo") as string) || "/dashboard";

  if (!email || !password) {
    return {
      ok: false,
      error: "Please enter both email and password.",
    };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo,
    });

    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return {
            ok: false,
            error: "Invalid email or password. Please try again.",
          };
        default:
          return {
            ok: false,
            error: "An unexpected authentication error occurred.",
          };
      }
    }
    // Next.js redirect errors are thrown to perform the redirect, so re-throw them
    throw error;
  }
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
