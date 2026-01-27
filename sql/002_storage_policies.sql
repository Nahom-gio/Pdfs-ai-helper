-- Storage policies for bucket: pdfs
-- Convention: object name starts with user id folder, e.g. "<user_id>/<document_id>.pdf"

create policy "pdfs_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'pdfs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "pdfs_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'pdfs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "pdfs_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'pdfs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "pdfs_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'pdfs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );