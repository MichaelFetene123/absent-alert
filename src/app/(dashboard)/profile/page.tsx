import { requireUser } from "@/lib/guards";
import { getUserProfileAction } from "@/actions/profile.actions";
import { ProfileView } from "@/components/profile-view";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const user = await requireUser();
  const res = await getUserProfileAction();

  if (!res.ok || !res.profile) {
    redirect("/login");
  }

  return <ProfileView initialProfile={res.profile} />;
}
