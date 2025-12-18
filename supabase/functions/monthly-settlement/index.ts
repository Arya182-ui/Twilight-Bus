// supabase/functions/monthly-settlement/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey',
};

serve(async (req) => {
  // Log the request method and headers
  console.log('Request method:', req.method);
  console.log('Request headers:', JSON.stringify(Object.fromEntries(req.headers.entries())));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let body = {};
  try {
    // Try to parse JSON body if present
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      try {
        body = await req.json();
        console.log('Request body:', body);
      } catch (e) {
        console.log('No JSON body or parse error:', e);
      }
    }
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Calculate start and end of current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Check if a settlement for this month already exists
    const { data: existing, error: existingError } = await supabase
      .from('settlements')
      .select('id')
      .eq('type', 'monthly_salary')
      .eq('start_date', startOfMonth.toISOString().slice(0,10))
      .eq('end_date', endOfMonth.toISOString().slice(0,10))
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ message: 'Monthly settlement already exists for this month.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 1. Create a new settlement record
    const { data: settlement, error: settlementError } = await supabase
      .from('settlements')
      .insert({
        type: 'monthly_salary',
        start_date: startOfMonth.toISOString().slice(0,10),
        end_date: endOfMonth.toISOString().slice(0,10),
        total_amount: 0
      }) // total_amount will be updated later
      .select()
      .single();

    if (settlementError) {
      console.error('Settlement insert error:', settlementError);
      return new Response(JSON.stringify({ error: settlementError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 2. Get all drivers with a salary balance > 0
    const { data: wallets, error: walletsError } = await supabase
      .from('wallets')
      .select('driver_id, salary_balance')
      .gt('salary_balance', 0);

    if (walletsError) {
      console.error('Wallets fetch error:', walletsError);
      return new Response(JSON.stringify({ error: walletsError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    if (!wallets || wallets.length === 0) {
      return new Response(JSON.stringify({ message: "No drivers to settle." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    let totalSettledAmount = 0;
    const settlementDetails = (wallets as Array<{ driver_id: string, salary_balance: number }> ).map((wallet) => {
      totalSettledAmount += wallet.salary_balance;
      return {
        settlement_id: settlement.id,
        driver_id: wallet.driver_id,
        amount: wallet.salary_balance,
      };
    });

    // 3. Create settlement items
    const { error: detailsError } = await supabase
      .from('settlement_items')
      .insert(settlementDetails);

    if (detailsError) {
      console.error('Settlement items insert error:', detailsError);
      return new Response(JSON.stringify({ error: detailsError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 4. Update the total amount in the settlement record
    const { error: updateError } = await supabase
      .from('settlements')
      .update({ total_amount: totalSettledAmount })
      .eq('id', settlement.id);

    if (updateError) {
      console.error('Settlement update error:', updateError);
      return new Response(JSON.stringify({ error: updateError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // 5. Reset salary balances
    const driverIds = (wallets as Array<{ driver_id: string }> ).map((w) => w.driver_id);
    const { error: resetError } = await supabase
      .from('wallets')
      .update({ salary_balance: 0 })
      .in('driver_id', driverIds);

    if (resetError) {
      console.error('Wallets reset error:', resetError);
      return new Response(JSON.stringify({ error: resetError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    return new Response(JSON.stringify({ message: `Monthly settlement completed for ${wallets.length} drivers.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in monthly-settlement function:', error);
    let message = 'Unknown error';
    if (error && typeof error === 'object' && 'message' in error) {
      message = (error as any).message;
    } else if (typeof error === 'string') {
      message = error;
    }
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
