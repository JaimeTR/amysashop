#!/usr/bin/env node
const { createClient } = require("@supabase/supabase-js");
const path = require("path");
let sharp;
try {
  sharp = require("sharp");
} catch {
  console.error("sharp no instalado. Ejecuta: npm install sharp");
  process.exit(1);
}

require("dotenv").config({ path: require("path").resolve(__dirname, "..", ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SECRET_KEY");
  process.exit(1);
}

const BUCKET = process.env.SUPABASE_PRODUCTS_BUCKET || process.env.NEXT_PUBLIC_SUPABASE_PRODUCTS_BUCKET || "products";
const MAX_WIDTH = 1200;
const MAX_HEIGHT = 1200;
const QUALITY = 80;
const MIN_SIZE_BYTES = 30 * 1024;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

async function downloadFile(filePath) {
  const { data, error } = await supabase.storage.from(BUCKET).download(filePath);
  if (error) throw error;
  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function compressBuffer(buffer) {
  const image = sharp(buffer);
  const metadata = await image.metadata();

  let pipeline = image;

  if (metadata.width && metadata.height) {
    if (metadata.width > MAX_WIDTH || metadata.height > MAX_HEIGHT) {
      pipeline = pipeline.resize(MAX_WIDTH, MAX_HEIGHT, {
        fit: "inside",
        withoutEnlargement: true,
      });
    }
  }

  return pipeline.webp({ quality: QUALITY }).toBuffer();
}

function isImageFile(name) {
  const ext = path.extname(name).toLowerCase();
  return /\.(png|jpe?g|webp|avif|gif|svg|bmp)$/i.test(ext);
}

async function main() {
  console.log(`Bucket: ${BUCKET}`);
  console.log("Listando archivos...\n");

  const allFiles = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const { data, error } = await supabase.storage.from(BUCKET).list("products", {
      limit,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) {
      console.error("Error listando archivos:", error.message);
      process.exit(1);
    }
    if (!data || data.length === 0) break;

    for (const item of data) {
      if (!item.id) continue;
      const filePath = `products/${item.name}`;
      const metadata = item.metadata || {};
      const size = metadata.size || item.metadata?.size || 0;
      allFiles.push({ name: item.name, path: filePath, size });
    }
    offset += limit;
    if (data.length < limit) break;
  }

  const images = allFiles.filter((f) => isImageFile(f.name));
  console.log(`Encontradas ${images.length} imagenes en products/`);

  let totalOriginal = 0;
  let totalCompressed = 0;
  let processed = 0;
  let skipped = 0;
  let errors = 0;

  for (const img of images) {
    try {
      console.log(`\n[${processed + skipped + errors + 1}/${images.length}] ${img.name}`);
      console.log(`  Tamano original: ${formatBytes(img.size)}`);

      const original = await downloadFile(img.path);
      const compressed = await compressBuffer(original);

      if (compressed.length >= original.length && original.length > MIN_SIZE_BYTES) {
        console.log(`  Ya esta optimizada, se omite.`);
        skipped++;
        continue;
      }

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(img.path, compressed, {
          upsert: true,
          contentType: "image/webp",
          cacheControl: "31536000",
        });

      if (uploadError) {
        console.error(`  Error al subir: ${uploadError.message}`);
        errors++;
        continue;
      }

      const reduction = ((1 - compressed.length / original.length) * 100).toFixed(0);
      console.log(`  Comprimido: ${formatBytes(compressed.length)} (-${reduction}%)`);
      totalOriginal += original.length;
      totalCompressed += compressed.length;
      processed++;
    } catch (err) {
      console.error(`  Error: ${err.message}`);
      errors++;
    }
  }

  console.log("\n========================================");
  console.log("RESUMEN");
  console.log("========================================");
  console.log(`Procesadas:  ${processed}`);
  console.log(`Omitidas:    ${skipped}`);
  console.log(`Errores:     ${errors}`);
  if (processed > 0) {
    const reduction = ((1 - totalCompressed / totalOriginal) * 100).toFixed(0);
    console.log(`Original:    ${formatBytes(totalOriginal)}`);
    console.log(`Comprimido:  ${formatBytes(totalCompressed)}`);
    console.log(`Ahorro:      ${reduction}%`);
  }
  console.log("\nLas URLs de las imagenes no cambian. Todo sigue funcionando igual.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
