/**
 * Backfill script: ensures every job_application has a linked company.
 *
 * For each application with a NULL company_id:
 *  - Normalizes the company_name (lowercase + trim)
 *  - Finds an existing company for that user with that name, or creates one
 *  - Sets company_id on the application row
 */

import { neon } from '@neondatabase/serverless';

process.loadEnvFile('.env.local');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL not set');

const sql = neon(connectionString);

async function run() {
  // Fetch all applications without a linked company
  const unlinked = await sql<{ id: string; user_id: string; company_name: string }[]>`
    SELECT id, user_id, company_name
    FROM job_applications
    WHERE company_id IS NULL
    ORDER BY user_id, company_name
  `;

  console.log(`Found ${unlinked.length} application(s) without a linked company.\n`);

  if (unlinked.length === 0) {
    console.log('Nothing to do.');
    return;
  }

  let created = 0;
  let linked = 0;

  for (const app of unlinked) {
    const normalized = app.company_name.toLowerCase().trim();

    // Find or create company for this user
    const existing = await sql<{ id: string }[]>`
      SELECT id FROM companies
      WHERE user_id = ${app.user_id}
        AND name = ${normalized}
      LIMIT 1
    `;

    let companyId: string;

    if (existing.length > 0) {
      companyId = existing[0]!.id;
    } else {
      const inserted = await sql<{ id: string }[]>`
        INSERT INTO companies (user_id, name, source)
        VALUES (${app.user_id}, ${normalized}, 'application')
        ON CONFLICT (user_id, name) DO UPDATE SET updated_at = now()
        RETURNING id
      `;
      companyId = inserted[0]!.id;
      created++;
      console.log(`  Created company "${normalized}" for user ${app.user_id}`);
    }

    await sql`
      UPDATE job_applications
      SET company_id = ${companyId}, updated_at = now()
      WHERE id = ${app.id}
    `;

    linked++;
  }

  console.log(`\nDone. ${created} new company record(s) created, ${linked} application(s) linked.`);
}

run().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
