-- Agrega genero al perfil para personalizar mensajes de asesor/asesora

alter table public.profiles
  add column if not exists gender text;

alter table public.profiles
  drop constraint if exists profiles_gender_check;

alter table public.profiles
  add constraint profiles_gender_check
  check (
    gender is null
    or lower(gender) in ('male', 'female', 'masculino', 'femenino', 'hombre', 'mujer')
  );

comment on column public.profiles.gender is 'Genero para personalizacion de mensajes: male/female (o equivalentes en es).';
