-- Glossary terms
create table if not exists public.glossary_terms (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  term text not null,
  definition text not null,
  source_page int,
  created_at timestamptz not null default now()
);

create index if not exists glossary_terms_document_id_idx on public.glossary_terms (document_id);

alter table public.glossary_terms enable row level security;

create policy "glossary_terms_select_own" on public.glossary_terms
  for select using (
    exists (
      select 1 from public.documents d
      where d.id = glossary_terms.document_id and d.user_id = auth.uid()
    )
  );

create policy "glossary_terms_insert_own" on public.glossary_terms
  for insert with check (
    exists (
      select 1 from public.documents d
      where d.id = glossary_terms.document_id and d.user_id = auth.uid()
    )
  );

create policy "glossary_terms_update_own" on public.glossary_terms
  for update using (
    exists (
      select 1 from public.documents d
      where d.id = glossary_terms.document_id and d.user_id = auth.uid()
    )
  );

create policy "glossary_terms_delete_own" on public.glossary_terms
  for delete using (
    exists (
      select 1 from public.documents d
      where d.id = glossary_terms.document_id and d.user_id = auth.uid()
    )
  );
