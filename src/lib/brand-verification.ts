/**
 * Script para verificar qué marcas están en BD vs cuáles son hardcodeadas
 * Úsalo en admin/tienda para ver el estado actual
 */

// Marcas HARDCODEADAS en código (src/lib/brands.ts)
export const HARDCODED_BRANDS = [
  "AMYSA",
  "CYZONE", 
  "ESIKA",
  "LBEL",
  "NATURA",
  "YANBAL"
];

// Lo que el usuario DEBE hacer:
// 1. Abrir https://supabase.com → Dashboard
// 2. Ir a proyecto Ambila Accesorios
// 3. SQL Editor (o tabla `brands`)
// 4. Ejecutar: SELECT id, name FROM brands;
// 5. Ver qué marcas están realmente en BD

// OPCIÓN A: Si BD `brands` está VACÍA
// ✅ Recomendación: Registrar marcas en /admin/tienda
//    - Click en "Nueva marca"
//    - Registrar: AMYSA, CYZONE, ESIKA, LBEL, NATURA, YANBAL
//    - Esto guardará en tabla `brands` en BD

// OPCIÓN B: Si BD `brands` ya tiene datos pero diferentes
// ✅ Los nuevos filtros mostrarán SOLO lo de BD
// ✅ Las marcas hardcodeadas del código YA NO se usarán
// ✅ Los productos creados con esas marcas seguirán funcionando

// OPCIÓN C: Si BD `brands` tiene algunos datos antiguos/incorrectos
// ✅ En /admin/tienda puedes ELIMINAR marcas (ícono X)
// ✅ O puedes limpiar directamente en Supabase SQL Editor
//    DELETE FROM brands; -- Limpia todo
//    -- Luego registra nuevamente en /admin/tienda

console.log("Marcas hardcodeadas en código:", HARDCODED_BRANDS);
console.log("Para ver marcas en BD, ve a Supabase Dashboard y ejecuta:");
console.log("SELECT id, name FROM brands;");
