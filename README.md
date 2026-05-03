# AMYSA Shop (Ambila Accesorio)

E-commerce **PWA** construido con **Next.js 14 (App Router)**, **Supabase** y **Zustand**. Incluye autenticación, perfil de usuario, favoritos, carrito y un panel básico de administración.

> Nota: en desarrollo el proyecto usa datos mock en el frontend. Para producción, conecta lecturas/escrituras reales a Supabase.

## Características

- PWA (offline/instalable) con `next-pwa`
- Catálogo de productos y categorías
- Búsqueda
- Carrito con Zustand
- Favoritos (protegido)
- Perfil de usuario (protegido)
- Promos / landing pages por slug
- Admin protegido por email permitido
- Checkout inicial por WhatsApp (link dinámico)
- Base lista para integrar Culqi (pendiente de llaves/flujo final)

## Stack

- Next.js 14
- TailwindCSS + componentes estilo shadcn/ui
- Zustand (carrito)
- Supabase (Auth, DB, Storage)
- `next-pwa`

## Requisitos

- Node.js (recomendado: LTS)
- Una cuenta/proyecto en Supabase

## Arranque local

1) Instala dependencias:

```bash
npm install
```

2) Crea `.env.local` usando `.env.example`.

   - Define `ADMIN_ALLOWED_EMAIL` con el único correo que puede entrar a `/admin`.

3) Levanta el proyecto:

```bash
npm run dev
```

Abre: http://localhost:3000

## Rutas

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

1) Ejecuta el SQL de `supabase/schema.sql` en **Supabase SQL Editor**.

Incluye:
- Tablas: `profiles`, `products`, `categories`, `orders`, `order_items`, `favorites`, `landing_pages`
- Trigger para crear perfil desde `auth.users`
- RLS con aislamiento por usuario y permisos admin

### 2) Auth

Habilita en **Supabase Auth**:
- Email/Password
- Google OAuth
- Magic Link (opcional)

Configura Redirect URL (local):
- `http://localhost:3000/auth/callback`

### 3) Storage

Crea un bucket para imágenes de productos, por ejemplo: `products`.

## Checkout

- Flujo inicial: WhatsApp dinámico
- Integración de Culqi lista para completar con llaves en variables de entorno

## Plantillas de correo (Supabase)

Hay plantillas listas en `supabase/email-templates/`.

- Guía: `supabase/email-templates/README.md`
- Archivos:
  - `confirm-signup-amysa.html`
  - `reset-password-amysa.html`

## Producción

- Reemplaza `productSamples` y `landingSamples` por lecturas reales desde Supabase.
- Revisa reglas RLS y permisos antes de publicar.

## Licencia

Pendiente (define una licencia si vas a publicar el repositorio).