import "server-only";
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
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.prismaDb = db;
}

export type Database = typeof db;
