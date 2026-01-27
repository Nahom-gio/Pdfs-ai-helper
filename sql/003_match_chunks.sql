-- Vector similarity search
create or replace function public.match_chunks(
  query_embedding vector(1536),
  match_count int,
  doc_id uuid
)
returns table (
  id uuid,
  document_id uuid,
  page_number int,
  content text,
  similarity float
)
language sql stable as $$
  select
    id,
    document_id,
    page_number,
    content,
    1 - (embedding <=> query_embedding) as similarity
  from public.chunks
  where document_id = doc_id
  order by embedding <=> query_embedding
  limit match_count;
$$;
