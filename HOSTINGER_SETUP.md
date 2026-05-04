# Checklist: Configuración en Hostinger para Producción

## ✅ Paso 1: Instalar dependencias localmente

```bash
cd web
npm install
```

Esto instala `nodemailer` que es necesario para enviar correos.

---

## ✅ Paso 2: Configurar variables de entorno en Hostinger

En el panel de **Hostinger**, ve a:
- **Aplicaciones** → Tu proyecto Next.js → **Variables de entorno**

Configura estas variables **exactamente**:

### Supabase (Base de datos y Auth)
```
NEXT_PUBLIC_SUPABASE_URL=https://rzsgflwlbbxzjvyegshs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_-P5iQR7NtmAX3g2vyqOJWQ_UPRTQx2f
SUPABASE_SECRET_KEY=sb_secret_-sRENkw_uUgbMprFCI9k3w_V876rAxl
```

### WhatsApp (Ya configurado, no toques)
```
NEXT_PUBLIC_WHATSAPP_PHONE=51965312386
NEXT_PUBLIC_WHATSAPP_DISPLAY_PHONE=965 312 386
```

### Sitio y Admin
```
NEXT_PUBLIC_SITE_URL=https://amysashop.com
NEXT_PUBLIC_ADMIN_ALLOWED_EMAIL=jaimetr1309@gmail.com
```

### Correo (SMTP Titan de Hostinger)
```
SMTP_HOST=smtp.titan.email
SMTP_PORT=465
SMTP_USER=contacto@amysashop.com
SMTP_PASS=Tarazona1309
CONTACT_TO_EMAIL=contacto@amysashop.com
CONTACT_FROM_EMAIL=contacto@amysashop.com
```

### Redes sociales (opcional, usa defaults si está vacío)
```
NEXT_PUBLIC_INSTAGRAM_URL=https://www.instagram.com/amysa.shop/
NEXT_PUBLIC_TIKTOK_URL=https://www.tiktok.com/@amysa.shop
```

### Otros (si los usas, déjalos vacíos si no)
```
NEXT_PUBLIC_CULQI_PUBLIC_KEY=
CULQI_SECRET_KEY=
GEMINI_API_KEY=
```

---

## ✅ Paso 3: Verificar DNS del dominio

En tu panel de dominio en Hostinger, **verifica estos registros DNS**:

### DNS Básicos (para que el dominio apunte a Hostinger)
- Tipo A: apuntando a la IP de Hostinger (Hostinger lo configura automáticamente)

### SPF (Para validación de correo)
```
Tipo: TXT
Nombre: @
Valor: v=spf1 include:titan.email ~all
```

### DKIM (Para autenticación de correo) - Solicita a Hostinger
```
Crea registros TXT tipo:
default._domainkey.amysashop.com  → valor que Hostinger proporcione
```

---

## ✅ Paso 4: Verificar DNS en Supabase

En **Supabase** → tu proyecto:
1. Ve a **Settings** → **General**
2. Verifica que el **Site URL** sea: `https://amysashop.com`
3. Ve a **Authentication** → **Providers** → verifica que esté habilitado

---

## ✅ Paso 5: Build y deploy en Hostinger

Desde tu terminal local:

```bash
cd web
npm run build
```

Si no hay errores:
- Haz push al repositorio (Git)
- Hostinger se redesplegará automáticamente

---

## ✅ Paso 6: Pruebas funcionales

### Prueba 1: Formulario de contacto
1. Ve a `https://amysashop.com/ayuda/contacto`
2. Completa el formulario y envía
3. Verifica que recibas correo en `contacto@amysashop.com` y `jaimetr1309@gmail.com`

**Si falla:**
- Revisa los logs en Hostinger
- Verifica que `SMTP_PASS` esté correcta
- Comprueba que `contacto@amysashop.com` exista en Hostinger

### Prueba 2: WhatsApp
1. Haz clic en cualquier botón de WhatsApp del sitio
2. Debe abrir WhatsApp con el mensaje preformato al número `+51 965 312 386`

**Si falla:**
- Verifica que `NEXT_PUBLIC_WHATSAPP_PHONE` sea exacto

### Prueba 3: Autenticación (Supabase)
1. Ve a `https://amysashop.com/registro`
2. Intenta registrarte
3. Deberías recibir un correo de confirmación

**Si falla:**
- Verifica en Supabase → Authentication → Logs si hay errores
- Comprueba que el dominio en Supabase esté configurado

### Prueba 4: Admin
1. Inicia sesión con `jaimetr1309@gmail.com`
2. Intenta acceder a `https://amysashop.com/admin`
3. Deberías poder ver el dashboard

---

## 🔧 Solución de problemas

### "Error al enviar, intenta nuevamente" (Formulario de contacto)
✅ **Solución:**
1. Verifica que `SMTP_PASS` sea exactamente: `Tarazona1309`
2. Verifica que `SMTP_USER` sea: `contacto@amysashop.com`
3. Asegúrate de que la cuenta `contacto@amysashop.com` existe en Hostinger
4. Revisa los logs en Hostinger para ver el error exacto

### "No llegan correos de Supabase"
✅ **Solución:**
1. Verifica el **Site URL** en Supabase sea `https://amysashop.com`
2. En Supabase → Settings → Email, activa la verificación de dominio
3. Agrega los registros SPF/DKIM que Supabase te pida
4. Comprueba logs de Supabase

### WhatsApp no funciona
✅ **Solución:**
1. Verifica que `NEXT_PUBLIC_WHATSAPP_PHONE=51965312386` (sin espacios)
2. Limpia caché del navegador (Ctrl+Shift+Delete)
3. Abre `https://amysashop.com/ayuda/contacto` e intenta de nuevo

---

## 📋 Resumen

| Componente | Estado | Configuración |
|---|---|---|
| WhatsApp | ✅ Listo | +51 965 312 386 |
| Correo (Formulario) | ⏳ Requiere SMTP_PASS en Hostinger | SMTP Titan |
| Supabase (Auth) | ✅ Configurado | rzsgflwlbbxzjvyegshs |
| Dominio | ✅ Listo | amysashop.com |
| Admin | ✅ Listo | jaimetr1309@gmail.com |

---

## 🚀 Una vez que todo funcione

1. **Haz git push** de tus cambios
2. **Verifica en Hostinger** que el build no tenga errores
3. **Prueba todas las funciones** desde navegador
4. **Monitorea los logs** durante los primeros días
