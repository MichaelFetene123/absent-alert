import 'dotenv/config';
import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from './contract.d';
import contractJson from './contract.json' with { type: 'json' };

const globalForDb = globalThis as unknown as {
  prismaDb?: ReturnType<typeof postgres<Contract>>;
};

export const db =
  globalForDb.prismaDb ??
  postgres<Contract>({
    contractJson,
    url: process.env['DATABASE_URL']!,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.prismaDb = db;
}
