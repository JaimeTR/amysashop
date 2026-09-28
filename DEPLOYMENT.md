# Despliegue de AMYSA SHOP

Producción: **https://amysashop.com** · Hosting: **Hostinger** (aplicación Node.js) · Base de datos: **Supabase**

> ⚠️ **Nunca escribas claves ni contraseñas en archivos del repositorio** (tampoco en esta guía). Van solo en las variables de entorno del hosting y en tu `.env.local`, que git ignora.

## Flujo de despliegue

- `main` → producción (Hostinger se redespliega automáticamente al recibir un push).
- `dev` → rama de trabajo; se mantiene igual o por delante de `main`.

Antes de subir:

```bash
npm run lint
```

```bash
npm run build
```

Si el build termina sin errores, haz push a `dev` y luego a `main`.

Si un cambio incluye archivos nuevos en `supabase/migrations/`, **ejecuta el SQL en Supabase antes o justo después del deploy** (ver [MIGRATION_INSTRUCTIONS.md](MIGRATION_INSTRUCTIONS.md)).

## 1. Variables de entorno (Hostinger)

Panel de Hostinger → tu aplicación Node.js → **Variables de entorno**. Plantilla completa en [`.env.example`](.env.example).

**Supabase** (Supabase → Project Settings → API Keys del proyecto de producción)

```
NEXT_PUBLIC_SUPABASE_URL=https://<proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
```

`SUPABASE_SECRET_KEY` debe ser una clave **activa del mismo proyecto**. Si el admin muestra "Unregistered API key", la clave fue borrada/rotada o es de otro proyecto: genera una nueva y actualízala.

**Sitio, admin y WhatsApp**

```
NEXT_PUBLIC_SITE_URL=https://amysashop.com
ADMIN_ALLOWED_EMAIL=<correo del superadmin>
NEXT_PUBLIC_ADMIN_ALLOWED_EMAIL=<correo del superadmin>
NEXT_PUBLIC_WHATSAPP_PHONE=51965312386
NEXT_PUBLIC_WHATSAPP_DISPLAY_PHONE=965 312 386
NEXT_PUBLIC_INSTAGRAM_URL=https://www.instagram.com/amysa.shop/
NEXT_PUBLIC_TIKTOK_URL=https://www.tiktok.com/@amysa.shop
```

**Datos legales** (se muestran en el Libro de Reclamaciones, términos y privacidad; exigidos por ley)

```
NEXT_PUBLIC_LEGAL_NAME=<razón social>
NEXT_PUBLIC_LEGAL_RUC=<RUC>
NEXT_PUBLIC_LEGAL_ADDRESS=<domicilio>
NEXT_PUBLIC_LEGAL_EMAIL=<correo de atención>
```

**Correos** (detalle en [EMAIL_SETUP.md](EMAIL_SETUP.md))

```
RESEND_API_KEY=re_...
CONTACT_FROM_EMAIL=contacto@amysashop.com
CONTACT_TO_EMAIL=contacto@amysashop.com
SMTP_HOST=smtp.titan.email
SMTP_PORT=465
SMTP_USER=contacto@amysashop.com
SMTP_PASS=<contraseña del buzón>
```

**Opcionales**: `GROQ_API_KEY`, `GROQ_MODEL` (asistente), `NEXT_PUBLIC_YAPE_QR_URL`, `NEXT_PUBLIC_PLIN_QR_URL`, `NEXT_PUBLIC_BANK_*` (valores por defecto; se editan en *Admin → Configuración*).

Después de cambiar variables, vuelve a desplegar (las `NEXT_PUBLIC_*` se incrustan en el build).

## 2. Supabase

1. **SQL**: ejecuta las migraciones pendientes ([MIGRATION_INSTRUCTIONS.md](MIGRATION_INSTRUCTIONS.md)).
2. **Authentication → URL Configuration**
   - Site URL: `https://amysashop.com`
   - Redirect URLs:
     - `https://amysashop.com/auth/callback`
     - `https://amysashop.com/restablecer`
     - `http://localhost:3000/auth/callback` y `http://localhost:3000/restablecer` (desarrollo)
3. **Authentication → Email Templates**: usa las plantillas de `supabase/email-templates/`.
4. **Storage** (se crean con las migraciones): `products` (público), `profile-avatars`, `digital-files` (**privado**, 50 MB) y `digital-public` (portadas y vistas previas).

## 3. Archivos que deben desplegarse

Además del build, el servidor necesita la carpeta **`private/digital/files`**: contiene los archivos de las plantillas iniciales, que se sirven solo por `/api/digital/download` a compradores confirmados. No la muevas a `public/`.

## 4. DNS y dominio (Hostinger)

- Registro A del dominio (y `www`) apuntando a Hostinger (lo configura el panel).
- Correo Titan: `TXT @ v=spf1 include:titan.email ~all` y el DKIM que entregue Hostinger.
- Si usas Resend, agrega también sus registros SPF/DKIM (ver [EMAIL_SETUP.md](EMAIL_SETUP.md)).

## 5. Verificación después de cada deploy

- [ ] `https://amysashop.com` carga sin la pantalla de mantenimiento
- [ ] `/tienda` y `/tienda/perfumes` muestran productos con imágenes
- [ ] `/digital` muestra los productos digitales
- [ ] `/login` → iniciar sesión; `/recuperar` envía el correo y el enlace abre `/restablecer`
- [ ] `/admin` entra con el superadmin; `/admin/digitales` y `/admin/productos` cargan sin errores
- [ ] Pedido de prueba en `/checkout`: el total coincide en *Admin → Pedidos*
- [ ] Compra digital de prueba → confirmar en *Admin → Digitales → Pedidos* → llega el correo y la descarga funciona
- [ ] `/libro-de-reclamaciones` muestra razón social y RUC
- [ ] `/digital/files/...` responde 404 (los archivos de pago no son públicos)
- [ ] `/sitemap.xml`, `/robots.txt` y `/llms.txt` responden

## 6. Solución de problemas

| Síntoma | Causa probable |
|---|---|
| Pantalla "Estamos en mantenimiento" | Supabase no responde o superó su cuota; revisa el proyecto en Supabase |
| "Falta configurar SUPABASE_SECRET_KEY" / "Unregistered API key" | Variable ausente o clave inválida (ver sección 1) |
| El admin no refleja cambios en la tienda | El catálogo se cachea 5 min; guardar en el admin lo invalida al instante |
| No llegan correos de descarga / reclamos | Falta `RESEND_API_KEY` o el dominio remitente no está verificado en Resend |
| "Error al enviar" en contacto | Credenciales `SMTP_*` incorrectas o el buzón no existe |
| El enlace de recuperación no abre `/restablecer` | Falta la Redirect URL en Supabase (sección 2) |
| Descarga "file_not_found" en plantillas iniciales | No se desplegó `private/digital/files` |

## 7. Volver a una versión anterior

En Hostinger puedes redeplegar un deploy anterior, o desde git:

```bash
git revert <commit>
```

Luego haz push a `main`. Las migraciones SQL no se revierten solas; todas son aditivas.
