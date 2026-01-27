-- Processing status fields
alter table public.documents
  add column if not exists processing_status text not null default 'ready',
  add column if not exists processing_stage text,
  add column if not exists processing_error text,
  add column if not exists processed_at timestamptz;

create index if not exists documents_processing_status_idx on public.documents (processing_status);
