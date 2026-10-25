import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const instant = false;

export default async function HomePage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
