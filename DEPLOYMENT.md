Guía breve para desplegar AMYSA SHOP (producción)

1) Dominio y DNS
- Apunta tu dominio `amysashop.com` al hosting (A/AAAA o CNAME según proveedor).
- Añade registro `www` que apunte al mismo host.

2) Hosting recomendado
- Vercel/Netlify/Render forman buen match con Next.js. Para hosting propio, configura Node 18+ y HTTPS.

3) Variables de entorno
- Copia `.env.example` a `.env` y completa los valores: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`, etc.

4) Supabase (Auth / Emails)
- En Supabase → Auth → Configura el `Site URL` a `https://amysashop.com`.
- Para envío confiable de correos, configura SMTP en Supabase (Settings → Email → SMTP) o verifica el dominio de envío en tu proveedor de correo (SPF/DKIM).
- Verifica plantillas en `supabase/email-templates/` y personaliza remitente.

5) Verificación de correos y dominio
- Añade registros DNS recomendados por tu proveedor de correo para SPF y DKIM.
- Si usas servicios como SendGrid/Mailgun/SES, sigue su guía para verificar `amysashop.com`.

6) Build y deploy
- Instala dependencias: `npm ci`
- Build: `npm run build`
- Start: `npm run start` o usa el proceso de despliegue del hosting.

7) HTTPS y seguridad
- Asegura que el hosting provea certificado SSL (Let’s Encrypt o similar).
- Habilita cabeceras de seguridad (CSP, HSTS) si tu host lo permite.

8) Post-deploy (comprobaciones)
- Accede a la web y prueba registro, login y recuperación de contraseña.
- Envía un correo de prueba desde Supabase para validar entrega.
- Verifica que el carrito y favoritos persisten entre recargas.
