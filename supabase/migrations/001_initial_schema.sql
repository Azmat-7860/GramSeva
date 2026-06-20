-- GramSeva Initial Schema
-- Run this in Supabase SQL Editor

-- Villages
create table if not exists villages (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users not null,
  name text not null,
  daily_sms_cap integer default 50,
  created_at timestamptz default now()
);

-- Villagers
create table if not exists villagers (
  id uuid primary key default gen_random_uuid(),
  village_id uuid references villages on delete cascade not null,
  name text not null,
  phone text not null,
  created_at timestamptz default now()
);

-- Collectors
create table if not exists collectors (
  id uuid primary key default gen_random_uuid(),
  village_id uuid references villages on delete cascade not null,
  name text not null,
  phone text not null,
  pin_hash text,
  created_at timestamptz default now()
);

-- Collections
create table if not exists collections (
  id uuid primary key default gen_random_uuid(),
  village_id uuid references villages on delete cascade not null,
  name text not null,
  type text check (type in ('recurring', 'one_time')) not null,
  status text check (status in ('active', 'closed')) default 'active',
  created_at timestamptz default now()
);

-- Collection Members
create table if not exists collection_members (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid references collections on delete cascade not null,
  villager_id uuid references villagers on delete cascade not null,
  collector_id uuid references collectors on delete set null,
  amount_due numeric not null,
  reminder_date integer,
  created_at timestamptz default now()
);

-- Payments
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  collection_member_id uuid references collection_members on delete cascade not null,
  amount_paid numeric not null,
  payment_type text check (payment_type in ('partial', 'full', 'extra')) not null,
  month_label text,
  note text,
  paid_at timestamptz default now(),
  recorded_by uuid references collectors
);

-- Carry Forward Dues
create table if not exists carry_forward_dues (
  id uuid primary key default gen_random_uuid(),
  collection_member_id uuid references collection_members on delete cascade not null,
  amount numeric not null,
  from_month text,
  to_month text,
  created_at timestamptz default now()
);

-- SMS Logs
create table if not exists sms_logs (
  id uuid primary key default gen_random_uuid(),
  village_id uuid references villages on delete cascade not null,
  collection_member_id uuid references collection_members on delete set null,
  phone text not null,
  message text not null,
  status text check (status in ('sent', 'failed')) not null,
  sent_at timestamptz default now()
);

-- Indexes
create index if not exists idx_villagers_village on villagers(village_id);
create index if not exists idx_collectors_village on collectors(village_id);
create index if not exists idx_collections_village on collections(village_id);
create index if not exists idx_collection_members_collection on collection_members(collection_id);
create index if not exists idx_collection_members_collector on collection_members(collector_id);
create index if not exists idx_payments_member on payments(collection_member_id);
create index if not exists idx_payments_month on payments(month_label);
create index if not exists idx_carry_forward_member on carry_forward_dues(collection_member_id);
create index if not exists idx_sms_logs_village on sms_logs(village_id);

-- Row Level Security
alter table villages enable row level security;
alter table villagers enable row level security;
alter table collectors enable row level security;
alter table collections enable row level security;
alter table collection_members enable row level security;
alter table payments enable row level security;
alter table carry_forward_dues enable row level security;
alter table sms_logs enable row level security;

-- Village policies: admin owns their village
create policy "Admin sees own village" on villages
  for all using (admin_id = auth.uid());

-- Villager policies: admin sees their village's villagers
create policy "Admin manages villagers" on villagers
  for all using (
    village_id in (
      select id from villages where admin_id = auth.uid()
    )
  );

-- Collector policies: admin manages their collectors
create policy "Admin manages collectors" on collectors
  for all using (
    village_id in (
      select id from villages where admin_id = auth.uid()
    )
  );

-- Collection policies
create policy "Admin manages collections" on collections
  for all using (
    village_id in (
      select id from villages where admin_id = auth.uid()
    )
  );

-- Collection member policies
create policy "Admin manages collection members" on collection_members
  for all using (
    collection_id in (
      select c.id from collections c
      join villages v on v.id = c.village_id
      where v.admin_id = auth.uid()
    )
  );

-- Payment policies
create policy "Admin manages payments" on payments
  for all using (
    collection_member_id in (
      select cm.id from collection_members cm
      join collections c on c.id = cm.collection_id
      join villages v on v.id = c.village_id
      where v.admin_id = auth.uid()
    )
  );

-- Carry forward policies
create policy "Admin manages carry forward" on carry_forward_dues
  for all using (
    collection_member_id in (
      select cm.id from collection_members cm
      join collections c on c.id = cm.collection_id
      join villages v on v.id = c.village_id
      where v.admin_id = auth.uid()
    )
  );

-- Collector access: collectors can read their assigned members and record payments
create policy "Collector reads assigned members" on collection_members
  for select using (collector_id = auth.uid());

create policy "Collector inserts payments" on payments
  for insert with check (
    collection_member_id in (
      select id from collection_members where collector_id = auth.uid()
    )
  );

-- Public aggregate access (unauthenticated, read-only totals)
create policy "Public read aggregate" on collections
  for select using (status = 'active');
