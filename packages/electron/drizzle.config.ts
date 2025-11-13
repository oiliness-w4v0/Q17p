import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/main/db/schema/index.ts',
  out: './src/main/db/migrations',
  dialect: 'sqlite',
  verbose: true,
  strict: true,
});
