import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify user
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { amount } = await req.json();
    const validAmounts = [10, 25, 50, 100, 250, 500];
    if (!validAmounts.includes(amount)) {
      return new Response(
        JSON.stringify({ error: "Invalid top-up amount" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Use admin client to update credits
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Get current balance
    const { data: creditRow, error: fetchErr } = await adminClient
      .from("users_credits")
      .select("credits, topup_credits")
      .eq("user_id", user.id)
      .single();

    if (fetchErr || !creditRow) {
      return new Response(
        JSON.stringify({ error: "Credit row not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const newBalance = Number(creditRow.credits) + amount;
    const newTopup = Number(creditRow.topup_credits || 0) + amount;

    // Update credits atomically
    const { error: updateErr } = await adminClient
      .from("users_credits")
      .update({
        credits: newBalance,
        topup_credits: newTopup,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (updateErr) {
      throw updateErr;
    }

    // Log transaction
    const { error: txErr } = await adminClient
      .from("credit_transactions")
      .insert({
        user_id: user.id,
        type: "topup",
        amount: amount,
        balance_after: newBalance,
        description: `Top-up: +${amount} crédits`,
        metadata: { pack_amount: amount },
      });

    if (txErr) {
      console.error("Failed to log transaction:", txErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        new_balance: newBalance,
        topup_total: newTopup,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e: any) {
    console.error("Top-up error:", e);
    return new Response(
      JSON.stringify({ error: e.message || "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
