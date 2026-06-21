import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const url = new URL(req.url);
  const villageId = url.searchParams.get('village_id');
  const collectionId = url.searchParams.get('collection_id');

  if (!villageId || !collectionId) {
    return new Response(JSON.stringify({ error: 'Missing village_id or collection_id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get collection (for target_amount)
  const { data: collection } = await supabase
    .from('collections')
    .select('target_amount')
    .eq('id', collectionId)
    .single();

  // Get collection members
  const { data: members, error: membersError } = await supabase
    .from('collection_members')
    .select('id, amount_due')
    .eq('collection_id', collectionId);

  if (membersError) {
    return new Response(JSON.stringify({ error: membersError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!members?.length) {
    return new Response(
      JSON.stringify({ total_due: 0, total_collected: 0, member_count: 0 }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  const memberIds = members.map((m) => m.id);
  const totalDue = collection?.target_amount ?? members.reduce((sum, m) => sum + Number(m.amount_due), 0);

  // Get payments for these members
  const { data: payments } = await supabase
    .from('payments')
    .select('amount_paid')
    .in('collection_member_id', memberIds);

  const totalCollected = payments?.reduce((sum, p) => sum + Number(p.amount_paid), 0) || 0;

  return new Response(
    JSON.stringify({
      total_due: totalDue,
      total_collected: totalCollected,
      member_count: members.length,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
