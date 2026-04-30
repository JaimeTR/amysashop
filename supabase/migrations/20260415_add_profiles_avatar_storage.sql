-- Agrega avatar_url al perfil y configura bucket para avatares de usuario

alter table public.profiles
  add column if not exists avatar_url text;

comment on column public.profiles.avatar_url is 'URL publica de foto de perfil del usuario';

insert into storage.buckets (id, name, public)
values ('profile-avatars', 'profile-avatars', true)
on conflict (id) do nothing;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'profile_avatars_insert_own'
  ) THEN
    CREATE POLICY profile_avatars_insert_own
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'profile-avatars'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'profile_avatars_update_own'
  ) THEN
    CREATE POLICY profile_avatars_update_own
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'profile-avatars'
      AND (storage.foldername(name))[1] = auth.uid()::text
    )
    WITH CHECK (
      bucket_id = 'profile-avatars'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'profile_avatars_delete_own'
  ) THEN
    CREATE POLICY profile_avatars_delete_own
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'profile-avatars'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END
$$;
