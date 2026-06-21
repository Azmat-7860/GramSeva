-- Add RLS policies for sms_logs table
create policy "Admin manages sms_logs" on sms_logs
  for all using (
    village_id in (
      select id from villages where admin_id = auth.uid()
    )
  );

create policy "Collector inserts sms_logs" on sms_logs
  for insert with check (
    village_id in (
      select v.id from villages v
      join collectors c on c.village_id = v.id
      where c.id = auth.uid()
    )
  );

-- RPC function to verify collector PIN
create or replace function verify_collector_pin(p_collector_id uuid, p_pin text)
returns boolean
language plpgsql
security definer
as $$
declare
  stored_pin text;
begin
  select pin_hash into stored_pin
  from collectors
  where id = p_collector_id;
  return stored_pin = p_pin;
end;
$$;
