import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { collector_id, new_pin_hash } = await req.json();

  if (!collector_id || !new_pin_hash) {
    return new Response(JSON.stringify({ error: 'Missing collector_id or new_pin_hash' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Verify admin owns this collector's village
  const { data: collector, error: collectorError } = await supabase
    .from('collectors')
    .select('id, village_id')
    .eq('id', collector_id)
    .single();

  if (collectorError || !collector) {
    return new Response(JSON.stringify({ error: 'Collector not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Verify admin owns the village
  const { data: village } = await supabase
    .from('villages')
    .select('id')
    .eq('id', collector.village_id)
    .eq('admin_id', user.id)
    .single();

  if (!village) {
    return new Response(JSON.stringify({ error: 'Not authorized for this collector' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Update PIN
  const { error: updateError } = await supabase
    .from('collectors')
    .update({ pin_hash: new_pin_hash })
    .eq('id', collector_id);

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ message: 'PIN reset successfully' }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
