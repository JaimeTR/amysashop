# Migraciones de base de datos (Supabase)

Todas las migraciones están en `supabase/migrations/` y se ejecutan **a mano** en Supabase → **SQL Editor** (copiar el contenido del archivo y ejecutar). Están pensadas para poder ejecutarse más de una vez sin romper nada (`IF NOT EXISTS`, `ON CONFLICT`, `DROP … IF EXISTS`).

## Proyecto existente (producción)

Ejecuta solo las migraciones que aún no hayas aplicado, **en orden por fecha**. Las más recientes:

| Archivo | Qué hace |
|---|---|
| `20260927_protect_profiles_role.sql` | Impide que un usuario cambie su propio `role` / `is_admin` en `profiles` (seguridad) |
| `20260928_digital_store.sql` | Tienda digital: `digital_products`, `digital_product_files`, `digital_pack_items`, `digital_orders`, buckets `digital-files` (privado) y `digital-public`, y las 3 plantillas iniciales |
| `20260929_libro_reclamaciones.sql` | Libro de Reclamaciones: tabla `complaints` con número correlativo |
| `20260930_performance_indexes.sql` | Índices para claves foráneas, listados por fecha y búsqueda por nombre; RLS de `profiles` optimizada |

Para comprobar si una migración ya está aplicada, busca en *Table Editor* la tabla que crea (por ejemplo `digital_orders` o `complaints`).

## Proyecto nuevo (desde cero)

1. `scripts/base-schema.sql` — tablas base (`profiles`, `products`, `categories`, `orders`, …), trigger de perfiles y RLS.
2. `scripts/all-migrations.sql` — todas las migraciones hasta `20260529_create_app_settings.sql` en un solo archivo.
3. `supabase/migrations/20260927_protect_profiles_role.sql`
4. `supabase/migrations/20260928_digital_store.sql`
5. `supabase/migrations/20260929_libro_reclamaciones.sql`
6. `supabase/migrations/20260930_performance_indexes.sql`

`20260614_create_digital_products.sql` está vacía a propósito: pertenecía al proyecto Supabase separado que usaba antes el módulo digital y fue reemplazada por `20260928_digital_store.sql`.

## Después de migrar

- **Superadmin**: el correo de `ADMIN_ALLOWED_EMAIL` siempre es superadmin. El resto de roles se asignan en *Admin → Usuarios* (se guardan en `profiles.role`).
- **Pedidos digitales antiguos** (proyecto anterior): configura en `.env.local` `NEXT_PUBLIC_DIGITAL_SUPABASE_URL` y `DIGITAL_SUPABASE_SECRET_KEY` del proyecto viejo, y ejecuta:

```bash
node scripts/migrate-digital-legacy.js
```

  Revisa el resumen y, si está bien, aplica:

```bash
node scripts/migrate-digital-legacy.js --apply
```

  Se conserva el `download_token` de cada pedido, así los enlaces que ya recibieron los clientes siguen funcionando.

## Crear una migración nueva

1. Crea `supabase/migrations/AAAAMMDD_descripcion.sql` (fecha de hoy, en minúsculas y con guiones bajos).
2. Hazla idempotente (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `DROP POLICY IF EXISTS` antes de `CREATE POLICY`).
3. Activa RLS en toda tabla nueva y define políticas explícitas. Lo que solo usa el servidor no necesita políticas (se accede con `SUPABASE_SECRET_KEY`).
4. Agrégala a la tabla de este documento y avisa en el commit que hay SQL por ejecutar.
