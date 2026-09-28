# Cambios

## 2026-09-30

Requiere ejecutar en Supabase: `20260930_performance_indexes.sql`.

- Perfil: guardar datos y foto ya no depende de `SUPABASE_SECRET_KEY` (usa la sesión del usuario con RLS); mensajes de error y éxito visibles en el menú; género normalizado.
- Base de datos: índices para claves foráneas (ventas, comisiones, clientes, pedidos por usuario, productos por categoría, pedidos digitales), listados por fecha y búsqueda por nombre (pg_trgm); políticas RLS de `profiles` con `(select auth.uid())`.

## 2026-09-28

Requiere ejecutar en Supabase: `20260927_protect_profiles_role.sql`, `20260928_digital_store.sql` y `20260929_libro_reclamaciones.sql` (ver [MIGRATION_INSTRUCTIONS.md](MIGRATION_INSTRUCTIONS.md)).

### Seguridad
- Los roles del admin se leen de `profiles.role`; antes se usaba `user_metadata`, que cualquier usuario puede editar (escalada a admin).
- Trigger que impide a un usuario cambiar su propio `role` / `is_admin`.
- Archivos digitales de pago fuera de `public/`; descarga solo con pedido confirmado y sin path traversal.
- Precios de pedidos y compras digitales calculados en el servidor con los precios de la BD.
- Eliminada la página `/debug`; `setup-admin` solo activa la cuenta de la sesión.
- `src/middleware.ts`: el middleware estaba en la raíz y Next.js no lo ejecutaba; ahora protege `/perfil`, `/favoritos` y `/admin`.
- Claves retiradas de la documentación y de `scripts/push-migrations.js` (deben rotarse: siguen en el historial de git).
- Next.js 14.2.5 → 14.2.35.

### Tienda digital
- Módulo en `/admin/digitales`: productos (plantilla, libro, curso, guía, pack, otro), archivos hasta 50 MB subidos directo a Storage, portada, vista previa, packs, pedidos, ventas manuales.
- Páginas públicas `/digital`, `/digital/[slug]` (vista previa, compartir), `/digital/pedido/[id]` (instrucciones de pago) y `/digital/descargas`.
- Compra con Yape, Plin, transferencia o WhatsApp; correo con enlace de descarga al confirmar.
- Reemplaza el proyecto Supabase separado, el admin `/digital/admin` y los links de PayPal/Culqi.

### Login
- Recuperación de contraseña: `/recuperar` y `/restablecer`; los correos de reseteo del admin también llevan a `/restablecer`.

### Rendimiento
- Catálogo público cacheado (5 min, se invalida al guardar en el admin): de ~0,8 s a ~0,3 s por página en pruebas locales.
- Imágenes de productos optimizadas (AVIF/WebP): tarjetas de ~1,8 MB a ~25 KB.
- HTML del inicio reducido a menos de la mitad.

### SEO / GEO
- Páginas de categoría reales (`/tienda/perfumes`, `maquillaje`, `cuidado-corporal`, `joyas-y-accesorios`, `packs`).
- Canonical, Open Graph e imagen para compartir; JSON-LD de Organization/OnlineStore, Product (envío y devoluciones), BreadcrumbList, FAQPage y CollectionPage.
- FAQ y página de envíos con datos reales; `robots.txt`, `sitemap.xml` y `llms.txt` actualizados.

### Diseño
- Encabezado responsive (ya no se sale del marco en 1024-1279 px; navegación en tablet; accesos en celular).
- Inicio: hero nuevo, sección de productos digitales, categorías con nombre en celular.
- Pie de página con enlaces de tienda, digitales, ayuda, legales, Libro de Reclamaciones y "By Ambar Castro".
- Favicon, íconos PWA (any + maskable) y apple-touch-icon generados desde el logo.

### Legal
- Términos y condiciones, Política de privacidad (Ley 29733), Política de cookies.
- Libro de Reclamaciones virtual (Ley 29571) con panel `/admin/reclamaciones`.

### Productos (admin)
- Editar ya no pierde la descripción; valida antes de subir imágenes; marca normalizada al editar/clonar; rechaza precio/stock no numéricos.
