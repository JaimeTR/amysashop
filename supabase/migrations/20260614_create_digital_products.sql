-- REEMPLAZADA por 20260928_digital_store.sql.
--
-- Esta migración creaba las tablas del módulo digital en un proyecto de Supabase separado
-- (con precios en USD y links de PayPal/Culqi). El módulo ahora vive en la base principal
-- con otro esquema. Se deja vacía a propósito: si se ejecutara, crearía digital_products con
-- columnas antiguas y 20260928_digital_store.sql (que usa CREATE TABLE IF NOT EXISTS) no podría
-- crear la tabla correcta.
--
-- Para migrar pedidos del proyecto anterior: scripts/migrate-digital-legacy.js
select 1;
