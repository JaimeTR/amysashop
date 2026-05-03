-- ============================================================================
-- SCRIPT PARA NORMALIZAR TODOS LOS PRODUCTOS
-- Ejecutar en: Supabase SQL Editor
-- Copiar y pegar TODO este contenido en SQL Editor de Supabase
-- ============================================================================

-- PASO 1: Ver estado ACTUAL
SELECT 'ESTADO ACTUAL DE BD' as paso;

SELECT 'Géneros:' as tipo, gender as valor, COUNT(*) as cantidad 
FROM products 
WHERE gender IS NOT NULL AND gender != ''
GROUP BY gender 
ORDER BY cantidad DESC;

SELECT 'Productos sin género:' as tipo, COUNT(*) as cantidad 
FROM products 
WHERE gender IS NULL OR gender = '';

-- PASO 2: Obtener IDs necesarios (copia estos IDs)
SELECT 'IDS NECESARIOS (copiar estos valores):' as paso;
SELECT id as category_packs_id, 'Copia este ID de Packs Amysa' as instruccion FROM categories WHERE LOWER(TRIM(name)) = 'packs amysa' LIMIT 1;
SELECT id as brand_amysa_id, 'Copia este ID de AMYSA' as instruccion FROM brands WHERE LOWER(TRIM(name)) = 'amysa' LIMIT 1;

-- ============================================================================
-- PASO 3: SCRIPT DEFINITIVO (descomentar y ejecutar después de obtener IDs)
-- ============================================================================

-- OPCIÓN A: SI TIENES LOS IDS, DESCOMENTA Y REEMPLAZA:
-- BEGIN;

-- UPDATE products 
-- SET category_id = (SELECT id FROM categories WHERE LOWER(TRIM(name)) = 'packs amysa' LIMIT 1);

-- UPDATE products 
-- SET brand = 'AMYSA';

-- UPDATE products 
-- SET gender = 'Unisex';

-- COMMIT;

-- ============================================================================
-- OPCIÓN B: USANDO JOINS (MÁS SEGURO - sin necesidad de IDs)
-- Descomenta esto para ejecutar:
-- ============================================================================

-- BEGIN;

-- Actualizar categoría a "Packs Amysa"
-- UPDATE products 
-- SET category_id = (
--   SELECT id FROM categories 
--   WHERE LOWER(TRIM(name)) = 'packs amysa' 
--   LIMIT 1
-- );

-- Actualizar marca a "AMYSA"
-- UPDATE products SET brand = 'AMYSA';

-- Actualizar género a "Unisex"
-- UPDATE products SET gender = 'Unisex';

-- COMMIT;

-- ============================================================================
-- VERIFICAR DESPUÉS (ejecutar sin descomenta)
-- ============================================================================

SELECT 'DESPUÉS DE ACTUALIZAR' as paso;
SELECT 'Géneros finales:' as tipo, gender, COUNT(*) as cantidad 
FROM products 
GROUP BY gender 
ORDER BY cantidad DESC;

SELECT 'Marcas finales:' as tipo, brand, COUNT(*) as cantidad 
FROM products 
WHERE brand IS NOT NULL 
GROUP BY brand 
ORDER BY cantidad DESC;

SELECT 'Categorías finales:' as tipo, c.name as categoria, COUNT(p.id) as cantidad 
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
GROUP BY c.id, c.name
ORDER BY cantidad DESC;

SELECT COUNT(*) as total_productos, 
       COUNT(CASE WHEN brand = 'AMYSA' THEN 1 END) as con_amysa,
       COUNT(CASE WHEN gender = 'Unisex' THEN 1 END) as con_unisex
FROM products;

