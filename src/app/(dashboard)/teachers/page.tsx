import { requireUser } from "@/lib/guards";
import {
  listTeachersWithDetails,
  listAvailableClassesForTeachers,
} from "@/actions/teacher.actions";
import { TeachersManager } from "@/components/teachers-manager";


export default async function TeachersPage() {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";

  const [teachers, classes] = await Promise.all([
    listTeachersWithDetails(),
    listAvailableClassesForTeachers(),
  ]);

  return (
    <TeachersManager
      initialTeachers={teachers}
      availableClasses={classes}
      isAdmin={isAdmin}
    />
  );
}
