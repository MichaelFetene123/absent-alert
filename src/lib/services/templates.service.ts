export type SmsTemplate = {
  id: string;
  name: string;
  nameAm: string;
  triggerEvent: "ABSENCE" | "LATE" | "CORRECTION" | "FOLLOWUP";
  language: "en" | "am";
  body: string;
  variables: string[];
  isActive: boolean;
};

export const DEFAULT_TEMPLATES: SmsTemplate[] = [
  {
    id: "tpl-absent-en",
    name: "Student Absence Alert (English)",
    nameAm: "የተማሪ መቅረት ማሳወቂያ (እንግሊዝኛ)",
    triggerEvent: "ABSENCE",
    language: "en",
    body: "Dear Parent/Guardian, your child {student_name} was marked absent from {class_name} on {date}. Please contact the school if this is unexpected.",
    variables: ["student_name", "class_name", "date", "school_name"],
    isActive: true,
  },
  {
    id: "tpl-absent-am",
    name: "Student Absence Alert (Amharic)",
    nameAm: "የተማሪ መቅረት ማሳወቂያ (አማርኛ)",
    triggerEvent: "ABSENCE",
    language: "am",
    body: "ውድ ወላጅ/አሳዳጊ፣ {student_name} በ{date} በ{class_name} ክፍል አልተገኘም። ይህ ያልተጠበቀ ከሆነ እባክዎ ትምህርት ቤቱን ያነጋግሩ።",
    variables: ["student_name", "class_name", "date", "school_name"],
    isActive: true,
  },
  {
    id: "tpl-late-en",
    name: "Late Arrival Alert (English)",
    nameAm: "የማርፈድ ማሳወቂያ (እንግሊዝኛ)",
    triggerEvent: "LATE",
    language: "en",
    body: "Notice: {student_name} arrived late to {class_name} on {date}. The school gate recorded entry after scheduled bell.",
    variables: ["student_name", "class_name", "date", "school_name"],
    isActive: true,
  },
  {
    id: "tpl-late-am",
    name: "Late Arrival Alert (Amharic)",
    nameAm: "የማርፈድ ማሳወቂያ (አማርኛ)",
    triggerEvent: "LATE",
    language: "am",
    body: "ማስታወቂያ፡ {student_name} በ{date} ወደ {class_name} ክፍል አርፍዶ ገብቷል። እባክዎ የመግቢያ ሰዓትን ያክብሩ።",
    variables: ["student_name", "class_name", "date", "school_name"],
    isActive: true,
  },
  {
    id: "tpl-correction-en",
    name: "Attendance Correction Notice (English)",
    nameAm: "የአቴንዳንስ እርማት ማሳወቂያ (እንግሊዝኛ)",
    triggerEvent: "CORRECTION",
    language: "en",
    body: "Correction Notice: Attendance record for {student_name} on {date} has been officially updated to Present by school staff.",
    variables: ["student_name", "date", "school_name"],
    isActive: true,
  },
  {
    id: "tpl-correction-am",
    name: "Attendance Correction Notice (Amharic)",
    nameAm: "የአቴንዳንስ እርማት ማሳወቂያ (አማርኛ)",
    triggerEvent: "CORRECTION",
    language: "am",
    body: "የእርማት ማስታወቂያ፡ የ{student_name} የ{date} የአቴንዳንስ መረጃ በትምህርት ቤቱ አስተዳደር ወደ 'ተገኝቷል' ተስተካክሏል።",
    variables: ["student_name", "date", "school_name"],
    isActive: true,
  },
  {
    id: "tpl-followup-en",
    name: "Chronic Absence Follow-up (English)",
    nameAm: "ተደጋጋሚ መቅረት የክትትል ጥሪ (እንግሊዝኛ)",
    triggerEvent: "FOLLOWUP",
    language: "en",
    body: "Urgent: {student_name} has multiple unexplained absences this week. Please visit the school administration office.",
    variables: ["student_name", "school_name"],
    isActive: true,
  },
  {
    id: "tpl-followup-am",
    name: "Chronic Absence Follow-up (Amharic)",
    nameAm: "ተደጋጋሚ መቅረት የክትትል ጥሪ (አማርኛ)",
    triggerEvent: "FOLLOWUP",
    language: "am",
    body: "አስቸኳይ ጥሪ፡ {student_name} በዚህ ሳምንት ተደጋጋሚ መቅረት አስመዝግቧል። እባክዎ ወደ ት/ቤቱ አስተዳደር ቢሮ በአካል ይምጡ።",
    variables: ["student_name", "school_name"],
    isActive: true,
  },
];

export function renderSmsTemplate(
  templateBody: string,
  variables: Record<string, string>
): string {
  let res = templateBody;
  for (const [key, val] of Object.entries(variables)) {
    res = res.replace(new RegExp(`\\{${key}\\}`, "g"), val);
  }
  return res;
}
