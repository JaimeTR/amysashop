# Plantillas de correo - AMYSA

## Confirmacion de registro

Archivo HTML:
- confirm-signup-amysa.html

## Restablecimiento de contraseña

Archivo HTML:
- reset-password-amysa.html

## Como activarla en Supabase

1. Entra a tu proyecto en Supabase.
2. Ve a Authentication -> Email Templates.
3. Abre la plantilla "Confirm signup".
4. Subject sugerido: `Confirma tu cuenta en AMYSA`.
5. Reemplaza el HTML por el contenido de `confirm-signup-amysa.html`.
6. Guarda cambios y prueba con un registro nuevo.

## Como activar el de contraseña

1. Entra a Authentication -> Email Templates.
2. Abre la plantilla "Reset Password".
3. Subject sugerido: `Restablece tu contraseña en AMYSA`.
4. Reemplaza el HTML por el contenido de `reset-password-amysa.html`.
5. Guarda cambios y prueba el flujo de recuperacion.

## Variables importantes

- `{{ .ConfirmationURL }}`: enlace unico de confirmacion (obligatorio).

Si no incluyes `{{ .ConfirmationURL }}`, el correo no podra confirmar la cuenta.
