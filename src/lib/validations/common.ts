import { z } from "zod";

/**
 * Normalise Ethiopian numbers to E.164 (+251...).
 * Handles inputs with spaces, dashes, parentheses, leading zeros, or country code.
 *
 * Supported formats:
 * - 0911223344 -> +251911223344
 * - 0711223344 -> +251711223344
 * - +251911223344 -> +251911223344
 * - 251911223344 -> +251911223344
 * - 911223344 -> +251911223344
 */
export function normalizePhone(input: string): string {
  if (typeof input !== "string") {
    throw new Error("Invalid phone number: input must be a string");
  }

  const cleaned = input.replace(/[\s()\-.]/g, "");

  if (/^\+251[79]\d{8}$/.test(cleaned)) {
    return cleaned;
  }
  if (/^251[79]\d{8}$/.test(cleaned)) {
    return `+${cleaned}`;
  }
  if (/^0[79]\d{8}$/.test(cleaned)) {
    return `+251${cleaned.slice(1)}`;
  }
  if (/^[79]\d{8}$/.test(cleaned)) {
    return `+251${cleaned}`;
  }

  throw new Error("Invalid Ethiopian phone number. Must be a 9- or 10-digit mobile number starting with 09/07 or +251.");
}

/**
 * Zod schema validating and transforming Ethiopian phone numbers to E.164.
 */
export const phoneSchema = z
  .string({ message: "Phone number is required" })
  .trim()
  .min(1, "Phone number is required")
  .refine(
    (val) => {
      try {
        normalizePhone(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Enter a valid Ethiopian phone number (e.g., 0911223344 or +251911223344)" }
  )
  .transform((val) => normalizePhone(val));

/**
 * Helper to check whether a string is a valid calendar date in YYYY-MM-DD format.
 */
export function isValidDateString(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;

  const [year, month, day] = dateStr.split("-").map(Number);
  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;

  const daysInMonth = new Date(year, month, 0).getDate();
  return day >= 1 && day <= daysInMonth;
}

/**
 * General date schema (YYYY-MM-DD) verifying calendar validity.
 */
export const dateSchema = z
  .string({ message: "Date is required" })
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must follow YYYY-MM-DD format")
  .refine((val) => isValidDateString(val), { message: "Invalid calendar date" });

/**
 * Attendance date schema that ensures the date is neither invalid nor in the future.
 */
export const pastOrTodayDateSchema = dateSchema.refine(
  (val) => {
    const today = new Date();
    // Get YYYY-MM-DD for today in local/school time
    const todayStr = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-");

    return val <= todayStr;
  },
  { message: "Attendance date cannot be in the future" }
);

/**
 * Generic ID validation schema.
 */
export const idSchema = z
  .string({ message: "Identifier is required" })
  .trim()
  .min(1, "Identifier is required");
