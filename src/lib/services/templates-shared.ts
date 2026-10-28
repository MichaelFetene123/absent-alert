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
    body: "AbsentAlert: {student_name} ({class_name}) was marked absent on {date}. Contact school if unexpected.",
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
    body: "ውድ ወላጅ፣ {student_name} በ{date} በ{class_name} አልተገኘም። ካልታወቀ ት/ቤቱን ያነጋግሩ።",
    variables: ["student_name", "class_name", "date", "status", "school_name"],
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

