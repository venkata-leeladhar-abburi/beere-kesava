// One-off migration: copy files left in backend/uploads/ (written by the old
// local-disk storage driver) into the Cloudflare R2 bucket, keeping the exact
// same keys so the "/uploads/<folder>/<file>" paths already stored on records
// keep resolving once the R2 driver is active.
//
// Idempotent: an object already present in the bucket is skipped, so this can
// be re-run safely. Local files are left in place — delete them yourself once
// you have confirmed the migration.
//
//   node scripts/migrate-uploads-to-r2.mjs
//
import "dotenv/config";
import { readdir, readFile, stat } from "fs/promises";
import { extname, join, posix } from "path";
import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const UPLOADS_ROOT = join(process.cwd(), "uploads");

const CONTENT_TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".pdf": "application/pdf",
};

const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;
if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
  console.error("R2 is not configured — set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET.");
  process.exit(1);
}

const client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT ?? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

async function* walk(dir, prefix = "") {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    const key = prefix ? posix.join(prefix, entry.name) : entry.name;
    if (entry.isDirectory()) yield* walk(full, key);
    else yield { full, key };
  }
}

async function existsInBucket(Key) {
  try {
    await client.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key }));
    return true;
  } catch (err) {
    if (err?.$metadata?.httpStatusCode === 404 || err?.name === "NotFound") return false;
    throw err;
  }
}

let uploaded = 0;
let skipped = 0;
let bytes = 0;

for await (const { full, key } of walk(UPLOADS_ROOT)) {
  if (await existsInBucket(key)) {
    console.log(`skip    ${key} (already in bucket)`);
    skipped++;
    continue;
  }
  const body = await readFile(full);
  const { size } = await stat(full);
  await client.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: body,
    ContentType: CONTENT_TYPES[extname(key).toLowerCase()] ?? "application/octet-stream",
  }));
  // Read it back rather than trusting the write.
  if (!(await existsInBucket(key))) throw new Error(`${key} was not found in the bucket after upload`);
  console.log(`upload  ${key}  ${(size / 1024).toFixed(0)} KB`);
  uploaded++;
  bytes += size;
}

console.log(`\n${uploaded} uploaded (${(bytes / 1024 / 1024).toFixed(1)} MB), ${skipped} already present.`);
