import { requireUser } from "@/lib/guards";
import { listStudents, listClasses } from "@/actions/student.actions";
import { StudentsManager } from "@/components/students-manager";


export default async function StudentsPage() {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";

  const [students, classes] = await Promise.all([
    listStudents({ showInactive: true }),
    listClasses(),
  ]);

  return (
    <StudentsManager
      initialStudents={students}
      classes={classes}
      isAdmin={isAdmin}
    />
  );
}
