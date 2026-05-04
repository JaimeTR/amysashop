Guía: Configurar correo (SMTP) y verificación de dominio para AMYSA

Resumen rápido
- Objetivo: asegurar que los correos de confirmación y recuperación lleguen correctamente usando `amysashop.com`.
- Requisitos: acceso al panel DNS de tu dominio y a la consola de Supabase (o al proveedor SMTP que elijas: SendGrid, Mailgun, SES, etc.).

1) Variables y site URL
- Asegúrate de tener en `.env` (o en variables del hosting):
  - `NEXT_PUBLIC_SITE_URL=https://amysashop.com`
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`

2) Configurar `Site URL` en Supabase
- En Supabase → Authentication → Settings → Site URL, pon `https://amysashop.com`.
- Esto hace que los enlaces que Supabase genera (confirmación, restauración) usen tu dominio.

3) Configurar proveedor de correo (SMTP)
- Recomiendo SendGrid, Mailgun o Amazon SES.
- Crea una cuenta en el proveedor y genera credenciales SMTP (host, port, user, pass) o una API key.

4) Configurar SMTP en Supabase
- Supabase → Authentication → Settings → SMTP:
  - Host: tu host SMTP (ej. smtp.sendgrid.net)
  - Port: 587 o 465 (según tu proveedor)
  - User: usuario SMTP
  - Password: contraseña SMTP
  - From email: `no-reply@amysashop.com` (usa un mailbox válido o un forwarding)

5) Verificación de dominio (SPF/DKIM/DMARC)
- En tu panel DNS añade los registros que te de tu proveedor (SendGrid/Mailgun/SES). Ejemplos:
  - SPF (TXT): "v=spf1 include:sendgrid.net ~all" (ajusta al proveedor)
  - DKIM: varios registros TXT tipo `s1._domainkey` con el valor que entregue el proveedor.
  - DMARC (opcional): `_dmarc.amysashop.com TXT "v=DMARC1; p=quarantine; rua=mailto:postmaster@amysashop.com"`
- Espera la propagación y verifica en el panel del proveedor hasta que el dominio quede verificado.

6) From address y remitente verificado
- En el proveedor SMTP verifica `no-reply@amysashop.com` o configura un mailbox (ej. en tu hosting o G Suite) y crea el forward.

7) Probar envío
- En Supabase → Authentication → Templates → Email templates puedes enviar un correo de prueba.
- O usa la consola del proveedor SMTP para ver logs.

8) Plantillas y enlaces
- Las plantillas en `supabase/email-templates/` ya usan `{{ .ConfirmationURL }}`. No es necesario cambiarlas si el `Site URL` en Supabase está correcto.
- Si quieres que los correos muestren enlaces visibles al dominio, puedes dejar las plantillas (ya están bien) o añadir texto con `{{ .ConfirmationURL }}`.

9) Pasos post-configuración
- Envía un correo de prueba a una dirección externa (Gmail/Outlook).
- Revisa carpeta de spam; si cae ahí, vuelve a revisar SPF/DKIM.
- Ajusta `Return-Path`/envelope-from en proveedor si es necesario.

10) Notas de seguridad
- No pongas claves privadas en repositorio. Usa variables en tu hosting o secrets en Vercel.

11) Soporte y debugging
- Si los correos no salen: revisa logs de Supabase (Authentication → Logs) y logs del proveedor SMTP.
- Comprueba que Supabase no esté bloqueando por límites de envío.

Si quieres, puedo:
- Generar un `.env.example` con valores de ejemplo ya incluido (ya creado). 
- Probar envío con una cuenta SendGrid usando credenciales (si me las das aquí, no las subas al repo; configúralas en el hosting).
- Verificar y editar las plantillas si quieres textos distintos.
