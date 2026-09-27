#!/usr/bin/env node
// Genera favicon, íconos PWA, apple-touch-icon e imagen Open Graph a partir del logo.
// Uso: node scripts/generate-icons.js
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.resolve(__dirname, "..");
const SOURCE = path.join(ROOT, "public", "logos", "amysa shop.png"); // logo blanco sobre café, 1001x1001
const OUT = path.join(ROOT, "public", "icons");
const BROWN = { r: 0x4f, g: 0x35, b: 0x26, alpha: 1 };

// Región de la "A" con estrella dentro del logo (monograma legible a 16-48 px).
const MONOGRAM = { left: 62, top: 330, width: 176, height: 196 };

async function logoOnBrown(size, scale) {
  const inner = Math.round(size * scale);
  const logo = await sharp(SOURCE).resize(inner, inner, { fit: "contain", background: BROWN }).toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: BROWN } })
    .composite([{ input: logo, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

async function monogram(size) {
  const inner = Math.round(size * 0.82);
  // Los trazos del logo son muy finos: se engrosan (blur + umbral) para que se lean a 16-32 px.
  const thick = await sharp(SOURCE)
    .extract(MONOGRAM)
    .greyscale()
    .blur(5)
    .linear(3.4, -200)
    .toBuffer();
  const alpha = await sharp(thick).resize(inner, inner, { fit: "contain", background: "#000" }).toColourspace("b-w").raw().toBuffer();
  const letter = await sharp({ create: { width: inner, height: inner, channels: 3, background: "#ffffff" } })
    .joinChannel(alpha, { raw: { width: inner, height: inner, channels: 1 } })
    .png()
    .toBuffer();
  const radius = Math.round(size * 0.18);
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="#fff"/></svg>`
  );
  return sharp({ create: { width: size, height: size, channels: 4, background: BROWN } })
    .composite([{ input: letter, gravity: "center" }, { input: mask, blend: "dest-in" }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

// ICO con entradas PNG (soportado por todos los navegadores actuales).
function buildIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  const entries = [];
  let offset = 6 + 16 * pngs.length;
  for (const { size, data } of pngs) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    entries.push(entry);
  }
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const write = (name, data) => {
    fs.writeFileSync(path.join(OUT, name), data);
    console.log(`public/icons/${name}  ${(data.length / 1024).toFixed(1)} KB`);
  };

  // Íconos PWA "any": logo completo.
  write("icon-192.png", await logoOnBrown(192, 1));
  write("icon-512.png", await logoOnBrown(512, 1));
  // Maskable: Android recorta en círculo/forma; el logo debe quedar en la zona segura (80%).
  write("maskable-192.png", await logoOnBrown(192, 0.72));
  write("maskable-512.png", await logoOnBrown(512, 0.72));
  // iOS (pantalla de inicio): sin transparencia.
  write("apple-touch-icon.png", await logoOnBrown(180, 1));

  // Favicon: monograma.
  const fav = {};
  for (const size of [16, 32, 48]) fav[size] = await monogram(size);
  write("favicon-32.png", fav[32]);
  const ico = buildIco([16, 32, 48].map((size) => ({ size, data: fav[size] })));
  fs.writeFileSync(path.join(ROOT, "public", "favicon.ico"), ico);
  console.log(`public/favicon.ico  ${(ico.length / 1024).toFixed(1)} KB`);

  // Imagen para compartir en redes / WhatsApp (1200x630).
  const logo = await sharp(SOURCE).resize(560, 560).toBuffer();
  const og = await sharp({ create: { width: 1200, height: 630, channels: 4, background: BROWN } })
    .composite([{ input: logo, gravity: "center" }])
    .png({ compressionLevel: 9 })
    .toBuffer();
  write("og-image.png", og);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
