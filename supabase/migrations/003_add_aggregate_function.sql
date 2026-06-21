-- RPC function for public aggregate totals
create or replace function get_aggregate_totals(p_village_id uuid, p_collection_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  result json;
begin
  with member_stats as (
    select
      count(cm.id) as member_count,
      coalesce(sum(cm.amount_due), 0) as total_due
    from collection_members cm
    join collections c on c.id = cm.collection_id
    where c.id = p_collection_id and c.village_id = p_village_id
  ),
  payment_stats as (
    select coalesce(sum(p.amount_paid), 0) as total_collected
    from payments p
    where p.collection_member_id in (
      select cm.id from collection_members cm
      where cm.collection_id = p_collection_id
    )
  )
  select json_build_object(
    'total_due', ms.total_due,
    'total_collected', ps.total_collected,
    'member_count', ms.member_count
  ) into result
  from member_stats ms, payment_stats ps;

  return result;
end;
$$;
