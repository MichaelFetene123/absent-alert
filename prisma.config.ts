import 'dotenv/config';
import { definePrismaConfig } from '@prisma/cli-engine';
import { defineConfig as ormConfig } from '@prisma/orm-postgres/config';

const databaseUrl = (process.env['DATABASE_URL'] || '').replace(
  'sslmode=require',
  'sslmode=verify-full'
);

export default definePrismaConfig({
  orm: ormConfig({
    contract: "./src/prisma/contract.prisma",
    db: {
      connection: databaseUrl,
    },
  }),
});
