/**
 * Ethiopian Calendar (Ge'ez Calendar) Helper Utility
 * 
 * Provides robust conversion between Gregorian and Ethiopian calendars,
 * Ethiopian date formatting in English and Amharic, and school calendar term boundaries.
 */

export type EthiopianDate = {
  year: number;
  month: number; // 1 to 13
  day: number;   // 1 to 30 (or 1 to 6 in Pagume)
  monthNameEn: string;
  monthNameAm: string;
};

export const ETHIOPIAN_MONTHS = [
  { id: 1, en: "Meskerem", am: "መስከረም" },
  { id: 2, en: "Tikimt", am: "ጥቅምት" },
  { id: 3, en: "Hidar", am: "ኅዳር" },
  { id: 4, en: "Tahsas", am: "ታኅሣሥ" },
  { id: 5, en: "Tir", am: "ጥር" },
  { id: 6, en: "Yakatit", am: "የካቲት" },
  { id: 7, en: "Megabit", am: "መጋቢት" },
  { id: 8, en: "Miazia", am: "ሚያዝያ" },
  { id: 9, en: "Ginbot", am: "ግንቦት" },
  { id: 10, en: "Sene", am: "ሰኔ" },
  { id: 11, en: "Hamle", am: "ሐምሌ" },
  { id: 12, en: "Nehase", am: "ነሐሴ" },
  { id: 13, en: "Pagume", am: "ጳጉሜ" },
];

/**
 * Converts a Gregorian Date object or YYYY-MM-DD string into an EthiopianDate.
 * Uses the proven astronomical Julian Day Number algorithm for Ethiopian calendar conversion.
 */
export function toEthiopianDate(gregorian: Date | string): EthiopianDate {
  const d = typeof gregorian === "string" ? new Date(gregorian + "T00:00:00Z") : gregorian;
  
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();

  // Julian Day Number calculation
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  
  const jdn =
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;

  // Ethiopian epoch in JDN = 1723856 (August 29, 8 CE)
  const r = (jdn - 1723856) % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);
  
  const ethYear =
    4 * Math.floor((jdn - 1723856) / 1461) +
    Math.floor(r / 365) -
    Math.floor(r / 1460);
  const ethMonth = Math.floor(n / 30) + 1;
  const ethDay = (n % 30) + 1;

  const monthMeta = ETHIOPIAN_MONTHS[ethMonth - 1] || ETHIOPIAN_MONTHS[0];

  return {
    year: ethYear,
    month: ethMonth,
    day: ethDay,
    monthNameEn: monthMeta.en,
    monthNameAm: monthMeta.am,
  };
}

/**
 * Format an Ethiopian date in either Amharic or English display:
 * Amharic: "ጥቅምት 15, 2017 ዓ.ም"
 * English: "Tikimt 15, 2017 E.C."
 */
export function formatEthiopianDate(
  gregorian: Date | string,
  locale: "en" | "am" = "en"
): string {
  const eth = toEthiopianDate(gregorian);
  if (locale === "am") {
    return `${eth.monthNameAm} ${eth.day}, ${eth.year} ዓ.ም`;
  }
  return `${eth.monthNameEn} ${eth.day}, ${eth.year} E.C.`;
}

/**
 * Dual date badge string: "Oct 25, 2024 · ጥቅምት 15, 2017 ዓ.ም"
 */
export function formatDualDate(gregorian: Date | string, locale: "en" | "am" = "en"): string {
  const d = typeof gregorian === "string" ? new Date(gregorian + "T00:00:00Z") : gregorian;
  const gregStr = d.toLocaleDateString(locale === "am" ? "am-ET" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  const ethStr = formatEthiopianDate(d, locale);
  return `${gregStr} (${ethStr})`;
}
