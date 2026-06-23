-- Junction table: collectors assigned to collections (many-to-many)
create table if not exists collection_collectors (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid references collections on delete cascade not null,
  collector_id uuid references collectors on delete cascade not null,
  created_at timestamptz default now(),
  unique(collection_id, collector_id)
);

-- RLS
alter table collection_collectors enable row level security;

create policy "Admin manages collection collectors" on collection_collectors
  for all using (
    collection_id in (
      select c.id from collections c
      join villages v on v.id = c.village_id
      where v.admin_id = auth.uid()
    )
  );

create policy "Collector reads own assignments" on collection_collectors
  for select using (collector_id = auth.uid());

-- Index
create index if not exists idx_collection_collectors_collection on collection_collectors(collection_id);
create index if not exists idx_collection_collectors_collector on collection_collectors(collector_id);
