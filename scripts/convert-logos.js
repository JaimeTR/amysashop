#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');
let sharp;
try {
  sharp = require('sharp');
} catch (err) {
  console.error('sharp no está instalado. Ejecuta: npm install sharp --workspace=web --save-dev');
  process.exit(1);
}

const LOGOS_DIR = path.resolve(__dirname, '..', 'public', 'logos');
const QUAL_WEBP = 80;
const QUAL_AVIF = 50;

async function listFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      files.push(...(await listFiles(full)));
    } else {
      files.push(full);
    }
  }
  return files;
}

function isSourceImage(name) {
  return /\.(png|jpe?g)$/i.test(name);
}

async function ensureConvert(file) {
  const ext = path.extname(file).toLowerCase();
  if (!isSourceImage(ext ? file : file)) return;
  const dir = path.dirname(file);
  const base = path.basename(file, ext);
  const outWebp = path.join(dir, `${base}.webp`);
  const outAvif = path.join(dir, `${base}.avif`);

  const srcStat = await fs.stat(file);
  async function shouldConvert(out) {
    try {
      const st = await fs.stat(out);
      return srcStat.mtimeMs > st.mtimeMs;
    } catch (e) {
      return true;
    }
  }

  if (await shouldConvert(outWebp)) {
    console.log(`Convirtiendo ${path.basename(file)} -> ${path.basename(outWebp)}`);
    await sharp(file).webp({ quality: QUAL_WEBP }).toFile(outWebp);
  }

  if (await shouldConvert(outAvif)) {
    console.log(`Convirtiendo ${path.basename(file)} -> ${path.basename(outAvif)}`);
    await sharp(file).avif({ quality: QUAL_AVIF }).toFile(outAvif);
  }
}

(async function main() {
  try {
    console.log('Buscando imágenes en', LOGOS_DIR);
    const files = await listFiles(LOGOS_DIR);
    const sources = files.filter(f => isSourceImage(f));
    if (sources.length === 0) {
      console.log('No se encontraron imágenes PNG/JPEG en public/logos. Nada que convertir.');
      return;
    }
    for (const f of sources) {
      try {
        await ensureConvert(f);
      } catch (err) {
        console.error('Error convirtiendo', f, err);
      }
    }
    console.log('Conversión finalizada. Revisa public/logos para los archivos .webp y .avif');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
