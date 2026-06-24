-- Track monthly cycles for recurring collections

create table if not exists collection_cycles (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid references collections on delete cascade not null,
  month_label text not null,
  total_due numeric not null default 0,
  member_snapshots jsonb,
  status text check (status in ('active', 'closed')) default 'active',
  started_at timestamptz default now(),
  closed_at timestamptz,
  unique(collection_id, month_label)
);

alter table collection_cycles enable row level security;

create policy "Admin manages cycles" on collection_cycles
  for all using (
    collection_id in (
      select c.id from collections c
      join villages v on v.id = c.village_id
      where v.admin_id = auth.uid()
    )
  );
