-- Add base_amount_due and credit_balance to collection_members

alter table collection_members
  add column if not exists base_amount_due numeric,
  add column if not exists credit_balance numeric default 0;

-- Backfill base_amount_due from amount_due for existing records
update collection_members set base_amount_due = amount_due where base_amount_due is null;

-- Make base_amount_due not null after backfill
alter table collection_members alter column base_amount_due set not null;
