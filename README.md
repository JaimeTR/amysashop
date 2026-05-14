# Ambila Accesorio

Ecommerce PWA construido con Next.js 14 (App Router), Supabase y Zustand.

## Stack

- Next.js 14
- TailwindCSS + componentes estilo shadcn/ui
- Zustand (carrito)
- Supabase (Auth, DB, Storage)
- next-pwa

## Arranque local

1. Instala dependencias:

```bash
npm install
```

2. Crea `.env.local` usando `.env.example`.

   Define `ADMIN_ALLOWED_EMAIL` con el unico correo que puede entrar a `/admin`.

3. Ejecuta desarrollo:

```bash
npm run dev
```

## Rutas incluidas

- `/` Home
- `/tienda`
- `/buscar`
- `/producto/[id]`
- `/carrito`
- `/perfil` (protegida)
- `/favoritos` (protegida)
- `/promo/[slug]`
- `/login`
- `/registro`
- `/admin` (protegida)

## Supabase

### 1) Base de datos

Ejecuta el SQL de `supabase/schema.sql` en Supabase SQL Editor.

Incluye:
- tablas: profiles, products, categories, orders, order_items, favorites, landing_pages
- trigger para crear perfil desde auth.users
- RLS con aislamiento por usuario y permisos admin

### 2) Auth

Habilita en Supabase Auth:
- Email/Password
- Google OAuth
- Magic Link (opcional)

Configura redirect URL:
- `http://localhost:3000/auth/callback`

### 3) Storage

Crea bucket para imágenes de productos, por ejemplo `products`.

## SEO e imágenes

- Usa `next/image` para imágenes locales y remotas compatibles.
- El avatar de perfil conserva fallback para `blob:` y `data:` mientras sube el archivo.
- Las imágenes `png` y `jpg` dentro de `public/logos` se pueden convertir a `webp` y `avif` con:

```bash
npm run optimize-images
```

- `next.config.mjs` ya habilita `image/avif` y `image/webp`, además de `Cache-Control` para imágenes y `/_next/static`.
- La ruta `producto/[id]` publica metadata Open Graph/Twitter y JSON-LD de tipo `Product`.
- `sitemap.xml` y `robots.txt` se generan automáticamente desde `src/app/sitemap.ts` y `src/app/robots.ts`.

Variables recomendadas:

- `NEXT_PUBLIC_SITE_URL`: dominio canónico del sitio.
- `NEXT_PUBLIC_VERCEL_URL`: fallback automático si despliegas en Vercel.
- `NEXT_PUBLIC_WHATSAPP_PHONE`: número para links del producto.

## Checkout

- Flujo inicial: WhatsApp dinámico
- Integración de Culqi lista para completar con llaves en variables de entorno

## Notas

- El proyecto usa datos mock en frontend para acelerar arranque.
- Cambia `productSamples` y `landingSamples` por lecturas reales desde Supabase para producción.
