-- Normaliza valores antiguos de genero y restringe a masculino/femenino

update public.profiles
set gender = case
  when gender is null then null
  when lower(trim(gender)) in ('f', 'female', 'femenino', 'femenina', 'mujer', 'woman') then 'femenino'
  when lower(trim(gender)) in ('m', 'male', 'masculino', 'hombre', 'man') then 'masculino'
  when trim(gender) = '' then null
  else null
end;

alter table public.profiles
  drop constraint if exists profiles_gender_check;

alter table public.profiles
  add constraint profiles_gender_check
  check (
    gender is null
    or lower(gender) in ('masculino', 'femenino')
  );

comment on column public.profiles.gender is 'Genero normalizado del usuario: masculino o femenino';
