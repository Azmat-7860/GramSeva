-- Add target_amount to collections
alter table collections
  add column target_amount numeric(12,2);
