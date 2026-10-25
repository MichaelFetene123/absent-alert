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
