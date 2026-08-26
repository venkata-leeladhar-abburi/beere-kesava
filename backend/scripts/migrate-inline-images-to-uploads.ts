// One-off migration: rewrites DesignDispatch image columns that hold inline
// `data:image/...;base64,...` strings into files under uploads/photos, leaving
// the short server-relative path in the column instead.
//
// Why: GET /design-dispatches does `SELECT *`, so three rows of ~6.5MB base64
// made the endpoint stream ~19.5MB. It took 55s and Supabase's pooler killed
// the connection first — surfacing as "Connection terminated unexpectedly".
// Same query without the two image columns returns in 41ms.
//
// Still inline elsewhere (not migrated here — their frontend read paths must be
// routed through resolveAssetUrl first, or the images will break):
//   PurchaseSareeLine.imageUrl, QcRecord.photoUrl, BatchSareeRow.receivedPhotoUrl
//
// Idempotent: rows already holding a path are skipped. Run with --dry-run first.
import "dotenv/config";
import { randomUUID } from "crypto";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { Pool } from "pg";

const TARGETS: { table: string; column: string }[] = [
  { table: "DesignDispatch", column: "colorSlipImageUrl" },
  { table: "DesignDispatch", column: "designGraphImageUrl" },
];

const UPLOADS_DIR = join(process.cwd(), "uploads", "photos");
const DRY_RUN = process.argv.includes("--dry-run");

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

function decodeDataUrl(value: string): { buffer: Buffer; extension: string } | null {
  const match = /^data:([^;,]+);base64,(.*)$/s.exec(value);
  if (!match) return null;
  const [, mime, base64] = match;
  const extension = EXTENSION_BY_MIME[mime.toLowerCase()];
  if (!extension) return null;
  return { buffer: Buffer.from(base64, "base64"), extension };
}

function formatBytes(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
}

async function main() {
  if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true });

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    // One 3MB value at a time still takes ~8s through the pooler; the default
    // timeouts are nowhere near enough for a column full of base64.
    connectionTimeoutMillis: 30_000,
    statement_timeout: 300_000,
    max: 1,
  });

  let migrated = 0;
  let bytesFreed = 0;

  for (const { table, column } of TARGETS) {
    const { rows: pending } = await pool.query<{ id: string }>(
      `SELECT id FROM "${table}" WHERE "${column}" LIKE 'data:%base64,%' ORDER BY id`,
    );
    console.log(`\n${table}.${column}: ${pending.length} inline image(s)`);

    for (const { id } of pending) {
      // Fetched one value at a time — selecting them all at once is the exact
      // query that times out.
      const { rows } = await pool.query<{ value: string }>(
        `SELECT "${column}" AS value FROM "${table}" WHERE id = $1`,
        [id],
      );
      const value = rows[0]?.value;
      if (!value) continue;

      const decoded = decodeDataUrl(value);
      if (!decoded) {
        console.warn(`  ${id}  SKIPPED — unrecognised data URL prefix`);
        continue;
      }

      const filename = `${randomUUID()}.${decoded.extension}`;
      const path = `/uploads/photos/${filename}`;
      console.log(
        `  ${id}  ${formatBytes(value.length)} base64 -> ${formatBytes(decoded.buffer.length)} ${path}`,
      );

      if (DRY_RUN) continue;

      // File first: a written-but-unreferenced file is harmless, a column
      // pointing at a file that was never written is a broken image.
      writeFileSync(join(UPLOADS_DIR, filename), decoded.buffer);
      await pool.query(`UPDATE "${table}" SET "${column}" = $1 WHERE id = $2`, [path, id]);
      migrated += 1;
      bytesFreed += value.length;
    }
  }

  console.log(
    `\n${DRY_RUN ? "[dry run] would migrate" : "migrated"} ${migrated} image(s), ` +
      `${formatBytes(bytesFreed)} out of the database.`,
  );
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
