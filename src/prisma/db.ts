import "dotenv/config";
import * as TemporalPolyfill from "temporal-polyfill";
if (typeof globalThis !== "undefined" && !(globalThis as any).Temporal) {
  (globalThis as any).Temporal = TemporalPolyfill.Temporal;
}

import postgres from "@prisma/orm-postgres/runtime";
import type { Contract } from "./contract.d";
import contractJson from "./contract.json" with { type: "json" };

const globalForDb = globalThis as unknown as {
  prismaDb?: ReturnType<typeof postgres<Contract>>;
};

export function getSanitizedDatabaseUrl(rawUrl?: string): string {
  const url = rawUrl || process.env["DATABASE_URL"] || "";
  if (!url) return "";
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
