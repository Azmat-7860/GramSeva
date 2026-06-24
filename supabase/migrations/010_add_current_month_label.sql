-- Track which month is currently active for a collection

alter table collections add column if not exists current_month_label text;
