-- Storage buckets for the two places the app accepts image uploads:
-- user avatars (self-service) and lesson/question media (admin-only, via
-- the admin panel's image uploader — docs/01-features.md).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152, array['image/png', 'image/jpeg', 'image/webp']),
  ('lesson-media', 'lesson-media', true, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
on conflict (id) do nothing;

-- Avatar uploads: each user may only read/write inside a folder named after
-- their own uid (e.g. `avatars/<uid>/profile.png`), enforced via
-- storage.foldername(name), Supabase's helper for splitting an object path.
create policy "avatars_select_public" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars_insert_own_folder" on storage.objects
  for insert with check (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_update_own_folder" on storage.objects
  for update using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_delete_own_folder" on storage.objects
  for delete using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Lesson media: publicly readable (it's rendered inline in published lesson
-- content), admin-only write.
create policy "lesson_media_select_public" on storage.objects
  for select using (bucket_id = 'lesson-media');

create policy "lesson_media_write_admin_only" on storage.objects
  for all using (bucket_id = 'lesson-media' and is_admin())
  with check (bucket_id = 'lesson-media' and is_admin());
