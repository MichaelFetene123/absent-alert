import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "../src/prisma/db";

async function seed() {
  console.log("Seeding AbsentAlert initial database...");

  // 1. Password hashes
  const adminPasswordHash = await bcrypt.hash("admin@123", 10);
  const teacherPasswordHash = await bcrypt.hash("teacher@123", 10);

  // 2. Upsert or create Admin
  let admin = await db.orm.public.User.where({ email: "admin@gmail.com" }).first();
  if (!admin) {
    admin = await db.orm.public.User.create({
      email: "admin@gmail.com",
      name: "Admin",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    });
    console.log("Created admin user:", admin.email);
  } else {
    // Ensure password and name are updated
    await db.orm.public.User.where({ id: admin.id }).update({
      name: "Admin",
      passwordHash: adminPasswordHash,
    });
    console.log("Updated admin user:", admin.email);
  }

  // 3. Upsert or create Teacher
  let teacher = await db.orm.public.User.where({ email: "teacher@gmail.com" }).first();
  if (!teacher) {
    teacher = await db.orm.public.User.create({
      email: "teacher@gmail.com",
      name: "Teacher Abebe",
      passwordHash: teacherPasswordHash,
      role: "TEACHER",
    });
    console.log("Created teacher user:", teacher.email);
  } else {
    await db.orm.public.User.where({ id: teacher.id }).update({
      name: "Teacher Abebe",
      passwordHash: teacherPasswordHash,
    });
    console.log("Updated teacher user:", teacher.email);
  }

  // 4. Create Class ("Class 7 B")
  let cls = await db.orm.public.Class.where({ name: "Class 7 B" }).first();
  if (!cls) {
    cls = await db.orm.public.Class.create({
      name: "Class 7 B",
    });
    console.log("Created class:", cls.name);
  } else {
    console.log("Class already exists:", cls.name);
  }

  // 5. Link Teacher to Class
  const teacherClass = await db.orm.public.TeacherClass.where({
    userId: teacher.id,
    classId: cls.id,
  }).first();

  if (!teacherClass) {
    await db.orm.public.TeacherClass.create({
      userId: teacher.id,
      classId: cls.id,
    });
    console.log(`Linked teacher ${teacher.name} to ${cls.name}`);
  } else {
    console.log(`Teacher already linked to ${cls.name}`);
  }

  // 6. Create test students and guardians
  const sampleStudents = [
    { name: "Almaz Kebede", adm: "ADM-001", guardian: "Kebede Tessema", phone: "0911223344" },
    { name: "Dawit Haile", adm: "ADM-002", guardian: "Haile Wolde", phone: "0922334455" },
    { name: "Sara Mohammed", adm: "ADM-003", guardian: "Mohammed Ali", phone: "0933445566" },
    { name: "Yared Bekele", adm: "ADM-004", guardian: "Bekele Megersa", phone: "0944556677" },
    { name: "Hanna Girma", adm: "ADM-005", guardian: "Girma Assefa", phone: "0955667788" },
  ];

  for (const s of sampleStudents) {
    let student = await db.orm.public.Student.where({ admissionNo: s.adm }).first();
    if (!student) {
      student = await db.orm.public.Student.create({
        fullName: s.name,
        admissionNo: s.adm,
        classId: cls.id,
        active: true,
      });

      await db.orm.public.Guardian.create({
        studentId: student.id,
        name: s.guardian,
        phone: s.phone,
        isPrimary: true,
      });
      console.log(`Created student ${s.name} (${s.adm}) with guardian ${s.guardian}`);
    }
  }

  console.log("Database seeding completed successfully!");
  await db.close();
}

seed().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});
