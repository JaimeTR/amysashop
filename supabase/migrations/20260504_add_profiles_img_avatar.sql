-- Agrega la columna dedicada para la imagen de avatar del perfil

alter table public.profiles
  add column if not exists img_avatar text;

comment on column public.profiles.img_avatar is 'URL publica de la imagen de avatar del perfil del usuario';

update public.profiles
set img_avatar = nullif(btrim(coalesce(img_avatar, avatar_url)), '')
where img_avatar is null
  and nullif(btrim(coalesce(img_avatar, avatar_url)), '') is not null;
