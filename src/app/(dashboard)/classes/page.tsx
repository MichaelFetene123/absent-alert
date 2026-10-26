import { requireUser } from "@/lib/guards";
import {
  listClassesWithDetails,
  listAvailableTeachers,
} from "@/actions/class.actions";
import { ClassesManager } from "@/components/classes-manager";


export default async function ClassesPage() {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";

  const [classes, teachers] = await Promise.all([
    listClassesWithDetails(),
    listAvailableTeachers(),
  ]);

  return (
    <ClassesManager
      initialClasses={classes}
      availableTeachers={teachers}
      isAdmin={isAdmin}
    />
  );
}
