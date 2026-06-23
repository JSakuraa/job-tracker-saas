import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load env
process.loadEnvFile('.env.local');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL not set');

const sql = neon(connectionString);

const migrationPath = join(process.cwd(), 'drizzle/migrations/0001_tiny_bill_hollister.sql');
const migrationSql = readFileSync(migrationPath, 'utf-8');

// Split on Drizzle's breakpoint marker
const statements = migrationSql
  .split('--> statement-breakpoint')
  .map((s) => s.trim())
  .filter(Boolean);

console.log(`Running ${statements.length} statements...\n`);

async function run() {
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i]!;
    const preview = stmt.slice(0, 80).replace(/\n/g, ' ');
    try {
      await sql(stmt);
      console.log(`  [${i + 1}/${statements.length}] OK — ${preview}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // Ignore "already exists" errors — schema was previously pushed
      if (msg.includes('already exists')) {
        console.log(`  [${i + 1}/${statements.length}] SKIP (already exists) — ${preview}`);
      } else {
        console.error(`  [${i + 1}/${statements.length}] FAILED — ${preview}`);
        console.error(`  Error: ${msg}`);
        process.exit(1);
      }
    }
  }
  console.log('\nMigration complete.');
}

run();
