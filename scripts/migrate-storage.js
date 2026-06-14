#!/usr/bin/env node
const { createClient } = require("@supabase/supabase-js");
const path = require("path");
const fs = require("fs").promises;

require("dotenv").config({ path: path.resolve(__dirname, "..", ".env.local") });

const OLD_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const OLD_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const NEW_URL = process.env.NEW_SUPABASE_URL;
const NEW_KEY = process.env.NEW_SUPABASE_SERVICE_KEY;

if (!OLD_URL || !OLD_KEY) {
  console.error("Falta configurar NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SECRET_KEY en .env.local (proyecto origen)");
  process.exit(1);
}

if (!NEW_URL || !NEW_KEY) {
  console.error("Debes crear un archivo .env.migration con:");
  console.error("  NEW_SUPABASE_URL=https://xxxxxxxxxx.supabase.co");
  console.error("  NEW_SUPABASE_SERVICE_KEY=sb_secret_...");
  process.exit(1);
}

const oldClient = createClient(OLD_URL, OLD_KEY, { auth: { persistSession: false } });
const newClient = createClient(NEW_URL, NEW_KEY, { auth: { persistSession: false } });

const BUCKETS = [
  process.env.SUPABASE_PRODUCTS_BUCKET || process.env.NEXT_PUBLIC_SUPABASE_PRODUCTS_BUCKET || "products",
  process.env.NEXT_PUBLIC_SUPABASE_PROFILE_AVATARS_BUCKET || process.env.NEXT_PUBLIC_SUPABASE_AVATARS_BUCKET || "profile-avatars",
];

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function listAllFiles(client, bucket, prefix) {
  const allFiles = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const { data, error } = await client.storage.from(bucket).list(prefix, { limit, offset, sortBy: { column: "name", order: "asc" } });
    if (error) {
      if (error.message?.includes("not found") || error.message?.includes("does not exist")) return [];
      throw error;
    }
    if (!data || data.length === 0) break;

    for (const item of data) {
      if (!item.id) continue;
      allFiles.push({ name: `${prefix ? prefix + "/" : ""}${item.name}`, size: item.metadata?.size || 0 });
    }
    offset += limit;
    if (data.length < limit) break;
  }

  return allFiles;
}

async function migrateBucket(bucketName) {
  console.log(`\n--- Bucket: ${bucketName} ---`);

  let oldFiles;
  try {
    oldFiles = await listAllFiles(oldClient, bucketName, "");
    const subdirs = ["products", "avatars", "public"];
    for (const dir of subdirs) {
      const subFiles = await listAllFiles(oldClient, bucketName, dir);
      oldFiles.push(...subFiles);
    }
    oldFiles = [...new Map(oldFiles.map((f) => [f.name, f])).values()];
  } catch (err) {
    console.error(`  Error listando ${bucketName}: ${err.message}`);
    return { ok: 0, fail: 0, skipped: 0 };
  }

  if (oldFiles.length === 0) {
    console.log(`  Vacio, se omite.`);
    return { ok: 0, fail: 0, skipped: 0 };
  }

  console.log(`  ${oldFiles.length} archivos encontrados`);

  let ok = 0, fail = 0, skipped = 0;

  for (let i = 0; i < oldFiles.length; i++) {
    const f = oldFiles[i];
    process.stdout.write(`  [${i + 1}/${oldFiles.length}] ${f.name} ... `);

    try {
      const { data: blob, error: dlError } = await oldClient.storage.from(bucketName).download(f.name);
      if (dlError) {
        console.log(`ERROR descarga: ${dlError.message}`);
        fail++;
        continue;
      }

      const buffer = Buffer.from(await blob.arrayBuffer());

      const { error: upError } = await newClient.storage.from(bucketName).upload(f.name, buffer, {
        upsert: true,
        contentType: blob.type || "image/webp",
        cacheControl: "31536000",
      });

      if (upError) {
        console.log(`ERROR subida: ${upError.message}`);
        fail++;
      } else {
        console.log(`OK (${formatBytes(buffer.length)})`);
        ok++;
      }
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
      fail++;
    }
  }

  return { ok, fail, skipped };
}

async function main() {
  console.log("MIGRACION DE STORAGE");
  console.log(`Origen:  ${OLD_URL}`);
  console.log(`Destino: ${NEW_URL}\n`);

  let totalOk = 0, totalFail = 0;

  for (const bucket of BUCKETS) {
    const r = await migrateBucket(bucket);
    totalOk += r.ok;
    totalFail += r.fail;
  }

  console.log(`\n========================================`);
  console.log(`RESUMEN: ${totalOk} migrados, ${totalFail} errores`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
