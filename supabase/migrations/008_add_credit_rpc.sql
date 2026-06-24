-- RPC: Add credit balance to a collection member (for advance payments)

create or replace function add_credit(p_member_id uuid, p_amount numeric)
returns void
language plpgsql
security definer
as $$
begin
  update collection_members
  set credit_balance = credit_balance + p_amount
  where id = p_member_id;
end;
$$;
