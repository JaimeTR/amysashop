Configuración práctica: SendGrid y Mailgun para amysashop.com

Resumen: aquí tienes ejemplos concretos de registros DNS y valores SMTP. NO pegues los valores de ejemplo tal cual: reemplaza los placeholders por los que te entregue el proveedor (token/selector únicos).

1) Requisitos previos
- Accede al panel DNS de `amysashop.com`.
- Crea cuenta en SendGrid (https://sendgrid.com) o Mailgun (https://mailgun.com).

2) SendGrid — pasos rápidos
- En SendGrid: Marketing → Sender Authentication → Authenticate Your Domain → sigue el wizard.

Registros DNS típicos (ejemplo, REEMPLAZAR los RHS por los que te muestre SendGrid):
- TXT (SPF)
  - Host/Name: @
  - Type: TXT
  - Value: "v=spf1 include:sendgrid.net ~all"

- CNAME (DKIM) — SendGrid pide varios CNAME con nombres tipo `s1._domainkey` y `s2._domainkey`:
  - Host/Name: s1._domainkey.amysashop.com
  - Type: CNAME
  - Value/Target: s1.domainkey.u123456.wl.sendgrid.net  <-- EJEMPLO, sustituir por el objetivo real

  - Host/Name: s2._domainkey.amysashop.com
  - Type: CNAME
  - Value/Target: s2.domainkey.u123456.wl.sendgrid.net  <-- EJEMPLO

- CNAME (tracking / link branding) — si activas link branding te dará 2-3 CNAME adicionales con nombres como `em1234`.

SendGrid — SMTP (para Supabase o apps):
- Host: smtp.sendgrid.net
- Port: 587 (TLS) o 465 (SSL)
- User: apikey
- Password: <TU_SENDGRID_API_KEY>
- From sugerido: no-reply@amysashop.com (o info@amysashop.com si verificas el mailbox)

3) Mailgun — pasos rápidos
- En Mailgun: Domains → Add New Domain → introduce `mg.amysashop.com` o `amysashop.com` según prefieras.

Registros DNS típicos (ejemplo, REEMPLAZAR RHS por los valores que te muestre Mailgun):
- TXT (SPF)
  - Host/Name: @
  - Type: TXT
  - Value: "v=spf1 include:mailgun.org ~all"

- TXT (DKIM) — Mailgun suele pedir un registro TXT con selector `default._domainkey` o similar:
  - Host/Name: default._domainkey.amysashop.com
  - Type: TXT
  - Value: "k=rsa; p=MIIBIjANB..."  <-- cadena `p=` completa que Mailgun te dará

- MX (si quieres recibir correos vía Mailgun)
  - Host/Name: @
  - Type: MX
  - Priority: 10
  - Value: mxa.mailgun.org

  - Host/Name: @
  - Type: MX
  - Priority: 10
  - Value: mxb.mailgun.org

Mailgun — SMTP (para Supabase o apps):
- Host: smtp.mailgun.org
- Port: 587 (TLS)
- User: postmaster@YOUR_MAILGUN_DOMAIN (ej. postmaster@mg.amysashop.com)
- Password: <MAILGUN_SMTP_PASSWORD>
- From sugerido: no-reply@amysashop.com o postmaster@mg.amysashop.com

4) Ejemplo de registros concretos (plantilla - reemplaza valores):

- SPF (DNS TXT)
  - Name: @
  - Value (SendGrid): "v=spf1 include:sendgrid.net ~all"
  - Value (Mailgun):  "v=spf1 include:mailgun.org ~all"

- DKIM (ejemplo SendGrid con CNAME)
  - Name: s1._domainkey
  - Type: CNAME
  - Target: s1.domainkey.u123456.wl.sendgrid.net

- DKIM (ejemplo Mailgun con TXT)
  - Name: default._domainkey
  - Type: TXT
  - Value: "k=rsa; p=<TU_CLAVE_PUB_DKIM>"

- DMARC (recomendado opcional)
  - Name: _dmarc
  - Type: TXT
  - Value: "v=DMARC1; p=quarantine; rua=mailto:postmaster@amysashop.com; ruf=mailto:postmaster@amysashop.com; pct=100"

5) Configurar SMTP en Supabase
- Ve a Supabase → Authentication → Settings → SMTP and fill:
  - Host: (ej. smtp.sendgrid.net o smtp.mailgun.org)
  - Port: 587
  - User: (sendgrid: `apikey` / mailgun: `postmaster@...`)
  - Password: (la clave o API key)
  - From email: no-reply@amysashop.com

6) Probar envío desde Supabase
- En Supabase → Authentication → Templates → selecciona plantilla (Confirm Signup) → Send test email.
- Revisa logs y la bandeja de destino (Gmail/Outlook). Si cae en spam, revisa SPF/DKIM y que el `From` esté verificado.

7) Notas y consejos
- Algunos registradores tardan hasta 48 h en propagar DKIM/SPF. En general suele ser < 1 hora.
- Para SendGrid es común usar CNAME DKIM; para Mailgun DKIM suele ser TXT con clave pública.
- No subas tus claves al repo. Usa variables de entorno en tu hosting o secrets en Vercel.

8) Valores .env de ejemplo (no commitear secretos)
- `SMTP_HOST=smtp.sendgrid.net`
- `SMTP_PORT=587`
- `SMTP_USER=apikey`
- `SMTP_PASS=<SENDGRID_API_KEY>`
- `SMTP_FROM=no-reply@amysashop.com`

9) ¿Quieres que lo haga por ti?
- Puedo generar los registros DNS listos para copiar si me dices: SendGrid o Mailgun y si usarás el dominio raíz (`amysashop.com`) o un subdominio (`mg.amysashop.com`).

*** Fin
