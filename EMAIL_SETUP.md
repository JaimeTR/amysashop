# Correos de AMYSA SHOP

La web envía correos por tres vías distintas:

| Correo | Servicio | Configuración |
|---|---|---|
| Confirmación de cuenta y recuperación de contraseña | **Supabase Auth** (SMTP propio) | Supabase → Authentication → SMTP y Email Templates |
| Descarga de productos digitales y Libro de Reclamaciones | **Resend** | `RESEND_API_KEY`, `CONTACT_FROM_EMAIL` |
| Formulario de contacto (`/ayuda/contacto`) | **SMTP** (Titan de Hostinger) vía nodemailer | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `CONTACT_TO_EMAIL` |

> Las contraseñas y API keys van solo en las variables de entorno del hosting y en `.env.local`. Nunca en archivos del repositorio.

## 1. Supabase Auth

1. Authentication → URL Configuration: Site URL `https://amysashop.com` y las Redirect URLs de [DEPLOYMENT.md](DEPLOYMENT.md#2-supabase).
2. Authentication → SMTP Settings → activa SMTP propio (el de Supabase tiene límite muy bajo de envíos):
   - Titan: host `smtp.titan.email`, puerto `465`, usuario `contacto@amysashop.com`, contraseña del buzón.
   - O Resend SMTP: host `smtp.resend.com`, puerto `465`, usuario `resend`, contraseña = tu API key.
   - Remitente: `contacto@amysashop.com`, nombre `AMYSA SHOP`.
3. Authentication → Email Templates: copia las plantillas de `supabase/email-templates/` (confirmación y restablecer contraseña).

## 2. Resend (descargas y reclamos)

1. Crea una cuenta en https://resend.com y agrega el dominio `amysashop.com`.
2. Agrega en el DNS de Hostinger los registros que muestra Resend (SPF/`TXT`, DKIM y, si lo pide, `MX` del subdominio de envío) y espera a que el dominio figure como *Verified*.
3. Crea una API key y configúrala:

```
RESEND_API_KEY=re_...
CONTACT_FROM_EMAIL=contacto@amysashop.com
```

Sin `RESEND_API_KEY` la web sigue funcionando: los pedidos y reclamos se guardan igual y el admin muestra el aviso "no se pudo enviar el correo" con la opción de copiar el enlace de descarga para enviarlo por WhatsApp.

## 3. SMTP del formulario de contacto

```
SMTP_HOST=smtp.titan.email
SMTP_PORT=465
SMTP_USER=contacto@amysashop.com
SMTP_PASS=<contraseña del buzón>
CONTACT_TO_EMAIL=contacto@amysashop.com
```

## 4. DNS recomendado para `amysashop.com`

- SPF (un solo registro TXT en `@` que combine los servicios que uses), por ejemplo: `v=spf1 include:titan.email include:amazonses.com ~all` (Resend envía mediante Amazon SES; usa exactamente lo que indique Resend).
- DKIM: el de Titan (Hostinger) y el de Resend.
- DMARC (opcional, recomendado): `TXT _dmarc` → `v=DMARC1; p=none; rua=mailto:contacto@amysashop.com`.

## 5. Prueba

- Registro de un correo nuevo → llega la confirmación.
- `/recuperar` → llega el enlace y abre `/restablecer`.
- Compra digital de prueba → confirmar en *Admin → Digitales → Pedidos* → llega el correo con la descarga.
- `/libro-de-reclamaciones` → llega la copia del reclamo.
- `/ayuda/contacto` → llega el mensaje a `CONTACT_TO_EMAIL`.

Si un correo no llega: revisa spam, los logs de Resend / Supabase (Authentication → Logs) y que el dominio esté verificado.
