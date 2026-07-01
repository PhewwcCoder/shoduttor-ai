-- Shoduttor.ai — Supabase schema. Run this in the Supabase SQL editor once.

-- Enable pgvector (lets Postgres store + search embedding vectors).
create extension if not exists vector;

-- FAQ chunks table (stores embedded FAQ entries).
create table if not exists faq_chunks (
  id uuid primary key default gen_random_uuid(),
  business_id text not null,
  content text not null,
  embedding vector(1536),
  created_at timestamptz default now()
);

-- Tag each chunk with the file it came from, so a single source can be
-- deleted or replaced. (Safe to run on an existing table.)
alter table faq_chunks add column if not exists source_file text;

-- Vector similarity search index.
create index if not exists faq_chunks_embedding_idx on faq_chunks
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Tickets table (stores all incoming support queries).
create table if not exists tickets (
  id uuid primary key default gen_random_uuid(),
  business_id text not null,
  original_message text not null,
  intent text,
  location text,
  sentiment text,
  english_translation text,
  resolution text,
  resolved boolean default false,
  department text,
  created_at timestamptz default now()
);

-- FAQ upload log — one row per uploaded document, so the dashboard can show
-- which .txt files make up each business's knowledge base. Optional: the app
-- still works without it (upload logging just no-ops if this table is missing).
create table if not exists faq_uploads (
  id uuid primary key default gen_random_uuid(),
  business_id text not null,
  source_file text,
  chunk_count int,
  created_at timestamptz default now()
);

-- Vector similarity search function used by retrieval.js.
create or replace function match_faq(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_business_id text
)
returns table (content text, similarity float)
language sql stable
as $$
  select content, 1 - (embedding <=> query_embedding) as similarity
  from faq_chunks
  where business_id = p_business_id
    and 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- Per-business daily usage counter (abuse / cost cap). One row per business/day.
create table if not exists usage_daily (
  business_id text not null,
  day date not null,
  count int not null default 0,
  primary key (business_id, day)
);

-- Atomically consume 1 unit of a business's daily quota. Returns whether it was
-- allowed and the resulting count. Row-locked (FOR UPDATE) so concurrent
-- requests can't race past the limit.
create or replace function consume_quota(p_business_id text, p_day date, p_limit int)
returns table(allowed boolean, count int)
language plpgsql
as $$
declare cur int;
begin
  insert into usage_daily(business_id, day, count) values (p_business_id, p_day, 0)
    on conflict (business_id, day) do nothing;
  select usage_daily.count into cur from usage_daily
    where business_id = p_business_id and day = p_day for update;
  if cur >= p_limit then
    return query select false, cur;
  else
    update usage_daily set count = count + 1
      where business_id = p_business_id and day = p_day;
    return query select true, cur + 1;
  end if;
end;
$$;
