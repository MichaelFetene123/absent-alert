import "server-only";
import { db } from "@/lib/db";

export type GuardianDetail = {
  id: string;
  name: string;
  phone: string;
  carrier: "Ethio Telecom" | "Safaricom" | "Unknown";
  creditCost: number; // 1 for Ethio, 2 for Safaricom
  isPrimary: boolean;
  studentId: string;
  studentName: string;
  studentAdmissionNo: string;
  className: string;
  preferredLanguage: "en" | "am";
  isVerified: boolean;
  smsReceivedCount: number;
};

import { detectCarrier } from "@/lib/carrier";
import { cacheTag, CACHE_TAGS } from "@/components/cacheTag";
export { detectCarrier };

export async function getGuardiansList(): Promise<{
  guardians: GuardianDetail[];
  totalGuardians: number;
  ethioCount: number;
  safaricomCount: number;
  unverifiedCount: number;
}> {
  "use cache";
  cacheTag(CACHE_TAGS.GUARDIANS, CACHE_TAGS.STUDENTS);

  const [allGuardians, allStudents, allClasses, allNotifs] = await Promise.all([
    db.orm.public.Guardian.all(),
    db.orm.public.Student.all(),
    db.orm.public.Class.all(),
    db.orm.public.Notification.all(),
  ]);

  const studentMap = new Map(allStudents.map((s) => [s.id, s]));
  const classMap = new Map(allClasses.map((c) => [c.id, c.name]));

  // Notification count per guardian phone
  const notifCountMap = new Map<string, number>();
  for (const n of allNotifs) {
    const clean = n.guardianPhone.replace(/[^0-9]/g, "");
    notifCountMap.set(clean, (notifCountMap.get(clean) || 0) + 1);
  }

  let ethioCount = 0;
  let safaricomCount = 0;

  const guardians: GuardianDetail[] = allGuardians.map((g) => {
    const student = studentMap.get(g.studentId);
    const className = student ? classMap.get(student.classId) || "Unassigned" : "Unassigned";
    const { carrier, creditCost } = detectCarrier(g.phone);

    if (carrier === "Ethio Telecom") ethioCount++;
    if (carrier === "Safaricom") safaricomCount++;

    const cleanPhone = g.phone.replace(/[^0-9]/g, "");
    const smsReceivedCount = notifCountMap.get(cleanPhone) || 0;

    return {
      id: g.id,
      name: g.name,
      phone: g.phone,
      carrier,
      creditCost,
      isPrimary: g.isPrimary,
      studentId: g.studentId,
      studentName: student ? student.fullName : "Unknown",
      studentAdmissionNo: student ? student.admissionNo : "N/A",
      className,
      preferredLanguage: "am", // Default for Ethiopian schools
      isVerified: true,
      smsReceivedCount,
    };
  });

  return {
    guardians,
    totalGuardians: guardians.length,
    ethioCount,
    safaricomCount,
    unverifiedCount: 0,
  };
}
