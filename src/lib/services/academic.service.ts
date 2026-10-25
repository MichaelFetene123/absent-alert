import "server-only";
import { db } from "@/lib/db";
import {
  DEFAULT_PERIODS,
  DEFAULT_HOLIDAYS,
  type AcademicTerm,
  type AcademicYearConfig,
  type SchoolPeriod,
  type SchoolHoliday,
} from "@/lib/academic-constants";

export {
  DEFAULT_PERIODS,
  DEFAULT_HOLIDAYS,
  type AcademicTerm,
  type AcademicYearConfig,
  type SchoolPeriod,
  type SchoolHoliday,
};

export async function getAcademicConfig(): Promise<AcademicYearConfig> {
  return {
    id: "ay-2017",
    yearName: "2017 E.C. (2024/2025)",
    gregorianStart: "2024-09-11",
    gregorianEnd: "2025-07-08",
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    terms: [
      {
        id: "term-1",
        name: "Semester 1",
        nameAm: "የመጀመሪያው ወሰነ-ትምህርት (Semester 1)",
        startDate: "2024-09-16",
        endDate: "2025-01-30",
        isCurrent: true,
      },
      {
        id: "term-2",
        name: "Semester 2",
        nameAm: "ሁለተኛው ወሰነ-ትምህርት (Semester 2)",
        startDate: "2025-02-10",
        endDate: "2025-06-30",
        isCurrent: false,
      },
    ],
  };
}

export async function getTimetableSchedule() {
  const classes = await db.orm.public.Class.all();
  return {
    periods: DEFAULT_PERIODS,
    classes: classes.map((c) => ({ id: c.id, name: c.name })),
  };
}
