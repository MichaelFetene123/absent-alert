export type AcademicTerm = {
  id: string;
  name: string;
  nameAm: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
};

export type AcademicYearConfig = {
  id: string;
  yearName: string; // e.g. "2017 E.C. (2024/2025)"
  gregorianStart: string;
  gregorianEnd: string;
  terms: AcademicTerm[];
  workingDays: string[];
};

export type SchoolPeriod = {
  id: string;
  periodNumber: number;
  name: string;
  nameAm: string;
  startTime: string; // "08:30"
  endTime: string;   // "09:15"
  isBreak?: boolean;
};

export type SchoolHoliday = {
  id: string;
  name: string;
  nameAm: string;
  date: string; // YYYY-MM-DD
  ethiopianDate: string;
  type: "NATIONAL" | "RELIGIOUS" | "TERM_BREAK";
};

// Default Ethiopian School Timetable Periods
export const DEFAULT_PERIODS: SchoolPeriod[] = [
  { id: "p1", periodNumber: 1, name: "Period 1", nameAm: "ክፍለ-ጊዜ 1", startTime: "08:30", endTime: "09:15" },
  { id: "p2", periodNumber: 2, name: "Period 2", nameAm: "ክፍለ-ጊዜ 2", startTime: "09:20", endTime: "10:05" },
  { id: "p3", periodNumber: 3, name: "Period 3", nameAm: "ክፍለ-ጊዜ 3", startTime: "10:10", endTime: "10:55" },
  { id: "b1", periodNumber: 0, name: "Morning Break", nameAm: "የዕረፍት ሰዓት", startTime: "10:55", endTime: "11:20", isBreak: true },
  { id: "p4", periodNumber: 4, name: "Period 4", nameAm: "ክፍለ-ጊዜ 4", startTime: "11:20", endTime: "12:05" },
  { id: "p5", periodNumber: 5, name: "Period 5", nameAm: "ክፍለ-ጊዜ 5", startTime: "12:10", endTime: "12:55" },
  { id: "b2", periodNumber: 0, name: "Lunch & Midday Break", nameAm: "የምሳ ሰዓት", startTime: "12:55", endTime: "14:00", isBreak: true },
  { id: "p6", periodNumber: 6, name: "Period 6", nameAm: "ክፍለ-ጊዜ 6", startTime: "14:00", endTime: "14:45" },
  { id: "p7", periodNumber: 7, name: "Period 7", nameAm: "ክፍለ-ጊዜ 7", startTime: "14:50", endTime: "15:35" },
];

// Major Ethiopian Official & School Holidays (2017 E.C. / 2024-2025)
export const DEFAULT_HOLIDAYS: SchoolHoliday[] = [
  { id: "h1", name: "Enkutatash (Ethiopian New Year)", nameAm: "እንቁጣጣሽ (አዲስ ዓመት)", date: "2024-09-11", ethiopianDate: "መስከረም 1, 2017", type: "NATIONAL" },
  { id: "h2", name: "Meskel (Finding of True Cross)", nameAm: "መስቀል", date: "2024-09-27", ethiopianDate: "መስከረም 17, 2017", type: "RELIGIOUS" },
  { id: "h3", name: "Genna (Ethiopian Christmas)", nameAm: "ገና (የገና በዓል)", date: "2025-01-07", ethiopianDate: "ታኅሣሥ 29, 2017", type: "RELIGIOUS" },
  { id: "h4", name: "Timkat (Epiphany)", nameAm: "ጥምቀት", date: "2025-01-19", ethiopianDate: "ጥር 11, 2017", type: "RELIGIOUS" },
  { id: "h5", name: "Adwa Victory Day", nameAm: "የዓድዋ ድል በዓል", date: "2025-03-02", ethiopianDate: "የካቲት 23, 2017", type: "NATIONAL" },
  { id: "h6", name: "Siklet (Good Friday)", nameAm: "ስቅለት", date: "2025-04-18", ethiopianDate: "ሚያዝያ 10, 2017", type: "RELIGIOUS" },
  { id: "h7", name: "Fasika (Ethiopian Easter)", nameAm: "ፋሲካ", date: "2025-04-20", ethiopianDate: "ሚያዝያ 12, 2017", type: "RELIGIOUS" },
  { id: "h8", name: "Eid al-Fitr", nameAm: "ዒድ አል ፈጥር", date: "2025-03-31", ethiopianDate: "መጋቢት 22, 2017", type: "RELIGIOUS" },
  { id: "h9", name: "Patriots Victory Day", nameAm: "የአርበኞች ድል በዓል", date: "2025-05-05", ethiopianDate: "ሚያዝያ 27, 2017", type: "NATIONAL" },
];
