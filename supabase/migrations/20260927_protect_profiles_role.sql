-- Evita escalada de privilegios: un usuario autenticado puede editar su propio perfil
-- (policy profiles_update_self), pero NO sus columnas role / is_admin.
-- Solo service_role (backend) o conexiones directas (SQL editor, triggers de auth) pueden cambiarlas.

CREATE OR REPLACE FUNCTION public.protect_profiles_role()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF coalesce(auth.role(), '') IN ('authenticated', 'anon') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.role := NULL;
      NEW.is_admin := false;
    ELSE
      NEW.role := OLD.role;
      NEW.is_admin := OLD.is_admin;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profiles_role ON public.profiles;
CREATE TRIGGER protect_profiles_role
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profiles_role();
