import "server-only";
import * as TemporalPolyfill from "temporal-polyfill";
if (typeof globalThis !== "undefined" && !(globalThis as any).Temporal) {
  (globalThis as any).Temporal = TemporalPolyfill.Temporal;
}

import postgres from "@prisma/orm-postgres/runtime";
import type { Contract } from "../prisma/contract.d";
import contractJson from "../prisma/contract.json" with { type: "json" };

const globalForDb = globalThis as unknown as {
  prismaDb?: ReturnType<typeof postgres<Contract>>;
};

import "dotenv/config";

export function getSanitizedDatabaseUrl(rawUrl?: string): string {
  const fallbackUrl = "postgresql://mock:mock@localhost:5432/mock?sslmode=disable";
  const url = rawUrl || process.env["DATABASE_URL"] || fallbackUrl;
  // In pg/pg-connection-string, 'sslmode=require' emits a security deprecation warning advising
  // explicit 'sslmode=verify-full' or 'uselibpqcompat=true&sslmode=require'.
  // Using 'sslmode=verify-full' preserves strong certificate validation and suppresses the warning.
  if (url.includes("sslmode=require") && !url.includes("uselibpqcompat=true")) {
    return url.replace("sslmode=require", "sslmode=verify-full");
  }
  return url;
}

export const db =
  globalForDb.prismaDb ??
  postgres<Contract>({
    contractJson,
    url: getSanitizedDatabaseUrl(),
    poolOptions: {
      connectionTimeoutMillis: 60_000,
      idleTimeoutMillis: 30_000,
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.prismaDb = db;
}

export type Database = typeof db;

/**
 * Executes a database operation with automatic retry on transient connection timeouts,
 * DNS glitches, and Neon scale-to-zero compute wakeups.
 */
export async function withDbRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      const msg = String(err?.message || "");
      const causeMsg = String(err?.cause?.message || "");
      const fullError = `${msg} ${causeMsg}`;

      const isConnectionError =
        err?.name === "SqlConnectionError" ||
        err?.transient === true ||
        fullError.includes("ENOTFOUND") ||
        fullError.includes("EAI_AGAIN") ||
        fullError.includes("getaddrinfo") ||
        fullError.includes("Connection terminated") ||
        fullError.includes("timeout") ||
        fullError.includes("ETIMEDOUT") ||
        fullError.includes("ECONNRESET") ||
        fullError.includes("ECONNREFUSED");

      if (attempt <= maxRetries && isConnectionError) {
        const delay = Math.min(1000 * Math.pow(1.5, attempt - 1), 4000);
        console.warn(`[db] Transient connection/DNS error (${msg}) on attempt ${attempt}/${maxRetries}. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
}

