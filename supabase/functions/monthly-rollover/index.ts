import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

serve(async (_req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const currentMonth = new Date();
  const monthLabel = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
  const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  const nextMonthLabel = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;

  // Get all active recurring collections
  const { data: collections } = await supabase
    .from('collections')
    .select('id')
    .eq('type', 'recurring')
    .eq('status', 'active');

  if (!collections?.length) {
    return new Response(JSON.stringify({ message: 'No active recurring collections' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const collectionIds = collections.map((c) => c.id);

  // Get collection members for these collections
  const { data: members } = await supabase
    .from('collection_members')
    .select('id, amount_due')
    .in('collection_id', collectionIds);

  if (!members?.length) {
    return new Response(JSON.stringify({ message: 'No members found' }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const memberIds = members.map((m) => m.id);

  // Get payments for current month for these members
  const { data: payments } = await supabase
    .from('payments')
    .select('collection_member_id, amount_paid')
    .in('collection_member_id', memberIds)
    .eq('month_label', monthLabel);

  const paidMap = new Map<string, number>();
  payments?.forEach((p) => {
    paidMap.set(p.collection_member_id, (paidMap.get(p.collection_member_id) || 0) + Number(p.amount_paid));
  });

  // Create carry-forward dues for unpaid amounts
  const carryForwards: {
    collection_member_id: string;
    amount: number;
    from_month: string;
    to_month: string;
  }[] = [];

  for (const member of members) {
    const paid = paidMap.get(member.id) || 0;
    const unpaid = Number(member.amount_due) - paid;
    if (unpaid > 0) {
      carryForwards.push({
        collection_member_id: member.id,
        amount: unpaid,
        from_month: monthLabel,
        to_month: nextMonthLabel,
      });
    }
  }

  if (carryForwards.length > 0) {
    const { error } = await supabase.from('carry_forward_dues').insert(carryForwards);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response(
    JSON.stringify({
      message: `Processed ${carryForwards.length} carry-forward entries`,
      month: monthLabel,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
