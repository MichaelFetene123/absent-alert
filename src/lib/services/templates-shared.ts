export type TemplateTriggerEvent = "ABSENCE" | "LATE" | "CORRECTION" | "FOLLOWUP";
export type TemplateLanguage = "en" | "am";

export type SmsTemplate = {
  id: string;
  key: string;
  name: string;
  nameAm: string;
  triggerEvent: TemplateTriggerEvent;
  language: TemplateLanguage;
  body: string;
  variables: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export const AVAILABLE_PLACEHOLDERS = [
  { key: "student_name", label: "Student Name", sample: "Almaz Kebede" },
  { key: "class_name", label: "Class / Section", sample: "Class 7 B" },
  { key: "date", label: "Date", sample: "Oct 28" },
  { key: "status", label: "Attendance Status", sample: "Absent" },
  { key: "admission_no", label: "Admission No", sample: "ADM-001" },
  { key: "school_name", label: "School Name", sample: "Addis Academy" },
  { key: "time", label: "Recorded Time", sample: "08:30 AM" },
];

export const DEFAULT_TEMPLATES: SmsTemplate[] = [
  {
    id: "tpl-absent-en",
    key: "tpl-absent-en",
    name: "Student Absence Alert (English)",
    nameAm: "የተማሪ መቅረት ማሳወቂያ (እንግሊዝኛ)",
    triggerEvent: "ABSENCE",
    language: "en",
    body: "Dear Parent/Guardian, your child {student_name} was marked absent from {class_name} on {date}. Please contact the school if this is unexpected.",
    variables: ["student_name", "class_name", "date", "status", "school_name"],
    isActive: true,
  },
  {
    id: "tpl-absent-am",
    key: "tpl-absent-am",
    name: "Student Absence Alert (Amharic)",
    nameAm: "የተማሪ መቅረት ማሳወቂያ (አማርኛ)",
    triggerEvent: "ABSENCE",
    language: "am",
    body: "ውድ ወላጅ/አሳዳጊ፣ {student_name} በ{date} በ{class_name} ክፍል አልተገኘም። ይህ ያልተጠበቀ ከሆነ እባክዎ ትምህርት ቤቱን ያነጋግሩ።",
    variables: ["student_name", "class_name", "date", "status", "school_name"],
    isActive: true,
  },
  {
    id: "tpl-late-en",
    key: "tpl-late-en",
    name: "Late Arrival Alert (English)",
    nameAm: "የማርፈድ ማሳወቂያ (እንግሊዝኛ)",
    triggerEvent: "LATE",
    language: "en",
    body: "Notice: {student_name} arrived late to {class_name} on {date}. The school gate recorded entry after scheduled bell.",
    variables: ["student_name", "class_name", "date", "time", "school_name"],
    isActive: true,
  },
  {
    id: "tpl-late-am",
    key: "tpl-late-am",
    name: "Late Arrival Alert (Amharic)",
    nameAm: "የማርፈድ ማሳወቂያ (አማርኛ)",
    triggerEvent: "LATE",
    language: "am",
    body: "ማስታወቂያ፡ {student_name} በ{date} ወደ {class_name} ክፍል አርፍዶ ገብቷል። እባክዎ የመግቢያ ሰዓትን ያክብሩ።",
    variables: ["student_name", "class_name", "date", "time", "school_name"],
    isActive: true,
  },
  {
    id: "tpl-correction-en",
    key: "tpl-correction-en",
    name: "Attendance Correction Notice (English)",
    nameAm: "የአቴንዳንስ እርማት ማሳወቂያ (እንግሊዝኛ)",
    triggerEvent: "CORRECTION",
    language: "en",
    body: "Correction Notice: Attendance record for {student_name} on {date} has been officially updated to {status} by school staff.",
    variables: ["student_name", "date", "status", "class_name", "school_name"],
    isActive: true,
  },
  {
    id: "tpl-correction-am",
    key: "tpl-correction-am",
    name: "Attendance Correction Notice (Amharic)",
    nameAm: "የአቴንዳንስ እርማት ማሳወቂያ (አማርኛ)",
    triggerEvent: "CORRECTION",
    language: "am",
    body: "የእርማት ማስታወቂያ፡ የ{student_name} የ{date} የአቴንዳንስ መረጃ በትምህርት ቤቱ አስተዳደር ወደ '{status}' ተስተካክሏል።",
    variables: ["student_name", "date", "status", "class_name", "school_name"],
    isActive: true,
  },
  {
    id: "tpl-followup-en",
    key: "tpl-followup-en",
    name: "Chronic Absence Follow-up (English)",
    nameAm: "ተደጋጋሚ መቅረት የክትትል ጥሪ (እንግሊዝኛ)",
    triggerEvent: "FOLLOWUP",
    language: "en",
    body: "Urgent: {student_name} has multiple unexplained absences this week. Please visit the {school_name} administration office.",
    variables: ["student_name", "school_name", "class_name"],
    isActive: true,
  },
  {
    id: "tpl-followup-am",
    key: "tpl-followup-am",
    name: "Chronic Absence Follow-up (Amharic)",
    nameAm: "ተደጋጋሚ መቅረት የክትትል ጥሪ (አማርኛ)",
    triggerEvent: "FOLLOWUP",
    language: "am",
    body: "አስቸኳይ ጥሪ፡ {student_name} በዚህ ሳምንት ተደጋጋሚ መቅረት አስመዝግቧል። እባክዎ ወደ {school_name} አስተዳደር ቢሮ በአካል ይምጡ።",
    variables: ["student_name", "school_name", "class_name"],
    isActive: true,
  },
];

export type TemplateContext = {
  student_name?: string;
  studentName?: string;
  class_name?: string;
  className?: string;
  date?: string;
  status?: string;
  admission_no?: string;
  admissionNo?: string;
  school_name?: string;
  schoolName?: string;
  time?: string;
  [key: string]: string | undefined;
};

export function renderSmsTemplate(
  templateBody: string,
  variables: TemplateContext
): string {
  if (!templateBody) return "";

  const map: Record<string, string> = {
    student_name: variables.student_name ?? variables.studentName ?? "Student",
    studentname: variables.student_name ?? variables.studentName ?? "Student",
    class_name: variables.class_name ?? variables.className ?? "Class",
    classname: variables.class_name ?? variables.className ?? "Class",
    date: variables.date ?? new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    status: variables.status ?? "Absent",
    admission_no: variables.admission_no ?? variables.admissionNo ?? "",
    admissionno: variables.admission_no ?? variables.admissionNo ?? "",
    school_name: variables.school_name ?? variables.schoolName ?? "Addis Academy",
    schoolname: variables.school_name ?? variables.schoolName ?? "Addis Academy",
    time: variables.time ?? "",
  };

  for (const [k, v] of Object.entries(variables)) {
    if (v !== undefined) {
      map[k.toLowerCase()] = String(v);
    }
  }

  return templateBody.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
    const lookup = map[key.toLowerCase()];
    return lookup !== undefined ? lookup : match;
  });
}

