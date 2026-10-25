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

export const db =
  globalForDb.prismaDb ??
  postgres<Contract>({
    contractJson,
    url: process.env["DATABASE_URL"]!,
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
 * Executes a database operation with automatic retry on transient connection timeouts
 * (e.g. Neon serverless scale-to-zero compute wakeup or high-latency handshake glitches).
 */
export async function withDbRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err: any) {
      attempt++;
      const isConnectionError =
        err?.name === "SqlConnectionError" ||
        err?.transient === true ||
        err?.message?.includes("Connection terminated") ||
        err?.message?.includes("timeout") ||
        err?.message?.includes("ECONNRESET");

      if (attempt <= maxRetries && isConnectionError) {
        console.warn(`[db] Transient connection error on attempt ${attempt}. Retrying in 1s...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }
      throw err;
    }
  }
}

