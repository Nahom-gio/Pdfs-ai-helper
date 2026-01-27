-- Enable extensions
create extension if not exists vector;
create extension if not exists pgcrypto;

-- Documents
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  file_path text not null,
  page_count int not null default 0,
  summary text,
  created_at timestamptz not null default now()
);

-- Per-page text + summaries
create table if not exists public.document_pages (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  page_number int not null,
  text text not null,
  summary text,
  created_at timestamptz not null default now()
);

-- Chunks for RAG
create table if not exists public.chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  page_number int not null,
  content text not null,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

-- Flashcards
create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  front text not null,
  back text not null,
  source_page int,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists document_pages_document_id_idx on public.document_pages (document_id);
create index if not exists chunks_document_id_idx on public.chunks (document_id);
create index if not exists flashcards_document_id_idx on public.flashcards (document_id);
create index if not exists chunks_embedding_idx on public.chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- RLS
alter table public.documents enable row level security;
alter table public.document_pages enable row level security;
alter table public.chunks enable row level security;
alter table public.flashcards enable row level security;

-- Documents policies
create policy "documents_select_own" on public.documents
  for select using (auth.uid() = user_id);

create policy "documents_insert_own" on public.documents
  for insert with check (auth.uid() = user_id);

create policy "documents_update_own" on public.documents
  for update using (auth.uid() = user_id);

create policy "documents_delete_own" on public.documents
  for delete using (auth.uid() = user_id);

-- Child table policies (ownership via documents)
create policy "document_pages_select_own" on public.document_pages
  for select using (
    exists (
      select 1 from public.documents d
      where d.id = document_pages.document_id and d.user_id = auth.uid()
    )
  );

create policy "document_pages_insert_own" on public.document_pages
  for insert with check (
    exists (
      select 1 from public.documents d
      where d.id = document_pages.document_id and d.user_id = auth.uid()
    )
  );

create policy "document_pages_update_own" on public.document_pages
  for update using (
    exists (
      select 1 from public.documents d
      where d.id = document_pages.document_id and d.user_id = auth.uid()
    )
  );

create policy "document_pages_delete_own" on public.document_pages
  for delete using (
    exists (
      select 1 from public.documents d
      where d.id = document_pages.document_id and d.user_id = auth.uid()
    )
  );

create policy "chunks_select_own" on public.chunks
  for select using (
    exists (
      select 1 from public.documents d
      where d.id = chunks.document_id and d.user_id = auth.uid()
    )
  );

create policy "chunks_insert_own" on public.chunks
  for insert with check (
    exists (
      select 1 from public.documents d
      where d.id = chunks.document_id and d.user_id = auth.uid()
    )
  );

create policy "chunks_update_own" on public.chunks
  for update using (
    exists (
      select 1 from public.documents d
      where d.id = chunks.document_id and d.user_id = auth.uid()
    )
  );

create policy "chunks_delete_own" on public.chunks
  for delete using (
    exists (
      select 1 from public.documents d
      where d.id = chunks.document_id and d.user_id = auth.uid()
    )
  );

create policy "flashcards_select_own" on public.flashcards
  for select using (
    exists (
      select 1 from public.documents d
      where d.id = flashcards.document_id and d.user_id = auth.uid()
    )
  );

create policy "flashcards_insert_own" on public.flashcards
  for insert with check (
    exists (
      select 1 from public.documents d
      where d.id = flashcards.document_id and d.user_id = auth.uid()
    )
  );

create policy "flashcards_update_own" on public.flashcards
  for update using (
    exists (
      select 1 from public.documents d
      where d.id = flashcards.document_id and d.user_id = auth.uid()
    )
  );

create policy "flashcards_delete_own" on public.flashcards
  for delete using (
    exists (
      select 1 from public.documents d
      where d.id = flashcards.document_id and d.user_id = auth.uid()
    )
  );