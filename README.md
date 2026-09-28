# AMYSA SHOP

Tienda online peruana de perfumes, maquillaje, cuidado personal y accesorios de marcas de catálogo (Ésika, L'Bel, Cyzone, Yanbal…), con tienda de **productos digitales** (plantillas, libros, cursos y packs) y panel de administración.

Producción: https://amysashop.com

## Stack

- **Next.js 14** (App Router, Server Actions) + TypeScript
- **Supabase**: Postgres, Auth, Storage (RLS en todas las tablas)
- **TailwindCSS** + componentes estilo shadcn/ui, íconos `lucide-react`
- **Zustand** (carrito y favoritos en el navegador)
- **next-pwa** (instalable como app)
- **Resend** (correos transaccionales) y **nodemailer/SMTP** (formulario de contacto)
- **Groq** (asistente de chat)

## Funcionalidades

**Tienda**
- Catálogo con filtros, buscador, páginas de categoría (`/tienda/perfumes`, `/tienda/maquillaje`, …) y ficha de producto con galería y zoom
- Carrito, favoritos, cupones y checkout con Yape, Plin o transferencia; pedido por WhatsApp
- Cuenta de usuario: registro con confirmación por correo, login, recuperación de contraseña (`/recuperar` → `/restablecer`)
- Asistente de chat con IA y atención en vivo desde el admin

**Productos digitales** (`/digital`)
- Catálogo con vista previa (portada + páginas de muestra), archivos incluidos y botones para compartir
- Compra con Yape/Plin/transferencia o por WhatsApp; el admin confirma el pago y el cliente recibe el enlace de descarga por correo
- Descargas protegidas por token (`/digital/descargas`); archivos en bucket privado

**Admin** (`/admin`, acceso por rol)
- Productos, inventario, pedidos, clientes, usuarios y roles, caja, emprende (ventas y comisiones), marketing (cupones), tienda (categorías y marcas), configuración de checkout
- **Digitales**: productos, subida de archivos (hasta 50 MB), packs, pedidos y ventas manuales
- **Reclamaciones**: Libro de Reclamaciones con plazo legal y respuesta por correo

**Legal**: términos, privacidad (Ley 29733), cookies y Libro de Reclamaciones virtual (Ley 29571).

**SEO / GEO**: metadata y canonical por página, JSON-LD (Organization, Product, BreadcrumbList, FAQPage, CollectionPage), `sitemap.xml`, `robots.txt` y `llms.txt` generados automáticamente.

## Arranque local

Requisitos: Node 18+ y un proyecto de Supabase.

```bash
npm install
```

```bash
cp .env.example .env.local
```

Completa `.env.local` (ver tabla abajo) y ejecuta:

```bash
npm run dev
```

> `.env.local` apunta a la misma base de producción si usas sus claves: lo que crees o borres en local cambia la tienda real.

## Variables de entorno

Las variables `NEXT_PUBLIC_*` se incluyen en el JavaScript del navegador: **nunca** pongas claves secretas en ellas. Lista completa en [`.env.example`](.env.example).

| Variable | Uso | Obligatoria |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | Sí |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública (`sb_publishable_…`) | Sí |
| `SUPABASE_SECRET_KEY` | Clave secreta (`sb_secret_…`): admin, pedidos, digitales, reclamos | Sí |
| `ADMIN_ALLOWED_EMAIL` / `NEXT_PUBLIC_ADMIN_ALLOWED_EMAIL` | Correo del superadmin | Sí |
| `NEXT_PUBLIC_SITE_URL` | Dominio canónico (`https://amysashop.com`) | Sí |
| `RESEND_API_KEY`, `CONTACT_FROM_EMAIL` | Correos de descargas y Libro de Reclamaciones | Recomendada |
| `SMTP_*`, `CONTACT_TO_EMAIL` | Formulario de contacto | Recomendada |
| `NEXT_PUBLIC_LEGAL_NAME`, `_RUC`, `_ADDRESS`, `_EMAIL` | Datos del proveedor exigidos por ley | Sí (producción) |
| `NEXT_PUBLIC_WHATSAPP_PHONE`, `_DISPLAY_PHONE` | WhatsApp de la tienda | Recomendada |
| `NEXT_PUBLIC_YAPE_QR_URL`, `NEXT_PUBLIC_PLIN_QR_URL`, `NEXT_PUBLIC_BANK_*` | Datos de pago por defecto (editables en el admin) | Opcional |
| `GROQ_API_KEY`, `GROQ_MODEL` | Asistente de chat | Opcional |

## Base de datos (Supabase)

Guía completa en [MIGRATION_INSTRUCTIONS.md](MIGRATION_INSTRUCTIONS.md). Resumen para un proyecto nuevo, en el SQL Editor:

1. `scripts/base-schema.sql`
2. `scripts/all-migrations.sql` (migraciones hasta `20260529`)
3. `supabase/migrations/20260927_protect_profiles_role.sql`
4. `supabase/migrations/20260928_digital_store.sql`
5. `supabase/migrations/20260929_libro_reclamaciones.sql`
6. `supabase/migrations/20260930_performance_indexes.sql`
7. `supabase/migrations/20261001_orders_contact_items.sql`

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm run start` | Build y servidor de producción |
| `npm run lint` | ESLint |
| `npm run optimize-images` | Convierte logos de `public/logos` a WebP/AVIF |
| `node scripts/generate-icons.js` | Regenera favicon, íconos PWA e imagen para compartir |
| `node scripts/compress-storage-images.js` | Comprime imágenes de productos ya subidas a Storage |
| `node scripts/migrate-digital-legacy.js [--apply]` | Trae pedidos digitales del proyecto Supabase anterior |

## Estructura

```
src/
  app/            Rutas (tienda, digital, legal, admin, api)
  components/     UI por dominio (admin, digital, legal, layout, store, product…)
  lib/            Lógica: catálogo cacheado, digital-store, access-control, email, SEO
  middleware.ts   Sesión Supabase, rutas protegidas y alcance de layout
private/digital/  Archivos digitales incluidos en el proyecto (no públicos)
supabase/         Migraciones SQL y plantillas de correo de Auth
scripts/          Utilidades de mantenimiento
```

## Despliegue

Ver [DEPLOYMENT.md](DEPLOYMENT.md). Correos: [EMAIL_SETUP.md](EMAIL_SETUP.md). Historial de cambios: [CHANGELOG.md](CHANGELOG.md).
