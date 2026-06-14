#!/usr/bin/env node
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const DB_URL = "postgresql://postgres:Tarazona1309.%20@db.unsgnjrojkyfuhgzhwzp.supabase.co:5432/postgres";
const MIGRATIONS_DIR = path.resolve(__dirname, "..", "supabase", "migrations");

async function runMigrations() {
  console.log("Conectando a la base de datos nueva...\n");

  const client = new Client({
    connectionString: DB_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  try {
    await client.connect();
    console.log("Conectado.\n");

    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    console.log(`${files.length} migraciones encontradas.\n`);

    for (const file of files) {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8").trim();
      if (!sql) continue;

      process.stdout.write(`Ejecutando ${file} ... `);
      try {
        await client.query(sql);
        console.log("OK");
      } catch (err) {
        console.log(`ERROR: ${err.message}`);
        console.log("  (puede ser normal si la migracion ya se aplico o si es condicional)");
      }
    }

    console.log("\nVerificando tablas creadas...");
    const { rows } = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' ORDER BY table_name
    `);
    console.log(`Tablas en public: ${rows.map((r) => r.table_name).join(", ")}`);

    await client.end();
    console.log("\nMigraciones completadas.");
  } catch (err) {
    console.error("Error de conexion:", err.message);
    process.exit(1);
  }
}

runMigrations();
