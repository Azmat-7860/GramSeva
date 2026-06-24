-- RPC: Start a new monthly cycle for a recurring collection
-- Handles: carry-forward of unpaid dues, credit balance offset

create or replace function start_new_cycle(p_collection_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  v_month_label text;
  v_next_month_label text;
  v_collection_type text;
  v_collection_status text;
  v_count integer;
begin
  -- Validate collection
  select type, status into v_collection_type, v_collection_status
  from collections where id = p_collection_id;

  if v_collection_type != 'recurring' then
    return json_build_object('error', 'Collection is not recurring');
  end if;

  if v_collection_status != 'active' then
    return json_build_object('error', 'Collection is not active');
  end if;

  v_month_label := to_char(now(), 'YYYY-MM');
  v_next_month_label := to_char(now() + interval '1 month', 'YYYY-MM');

  -- Idempotency: skip if already run for this month
  if exists (
    select 1 from carry_forward_dues cfd
    join collection_members cm on cm.id = cfd.collection_member_id
    where cm.collection_id = p_collection_id and cfd.from_month = v_month_label
  ) then
    return json_build_object('message', 'Cycle already started for ' || v_month_label);
  end if;

  -- Calculate unpaid per member (after deducting credit balance)
  create temp table processed on commit drop as
  with member_payments as (
    select
      cm.id as member_id,
      cm.base_amount_due,
      cm.amount_due as current_amount_due,
      cm.credit_balance,
      coalesce(sum(p.amount_paid), 0) as total_paid
    from collection_members cm
    left join payments p on p.collection_member_id = cm.id and p.month_label = v_month_label
    where cm.collection_id = p_collection_id
    group by cm.id
  )
  select
    member_id,
    greatest(current_amount_due - total_paid, 0) as unpaid,
    credit_balance,
    base_amount_due
  from member_payments;

  -- Insert carry-forward for what remains after credit
  insert into carry_forward_dues (collection_member_id, amount, from_month, to_month)
  select
    member_id,
    greatest(unpaid - credit_balance, 0),
    v_month_label,
    v_next_month_label
  from processed
  where unpaid > 0;

  -- Update amount_due = base + remaining unpaid, adjust credit
  update collection_members cm
  set
    amount_due = p.base_amount_due + greatest(p.unpaid - p.credit_balance, 0),
    credit_balance = greatest(p.credit_balance - p.unpaid, 0)
  from processed p
  where cm.id = p.member_id;

  get diagnostics v_count = row_count;

  return json_build_object(
    'message', 'Cycle started',
    'month', v_month_label,
    'members_processed', v_count
  );
end;
$$;
