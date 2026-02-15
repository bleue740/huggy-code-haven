import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DAILY_CREDITS = 5;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Fetch all users whose daily credits haven't been reset today
    const { data: users, error: fetchErr } = await adminClient
      .from("users_credits")
      .select("user_id, credits, daily_credits_reset_at")
      .lt("daily_credits_reset_at", new Date().toISOString().split("T")[0] + "T00:00:00Z");

    if (fetchErr) {
      console.error("[daily-credits-cron] Fetch error:", fetchErr);
      return new Response(JSON.stringify({ error: fetchErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!users || users.length === 0) {
      console.log("[daily-credits-cron] No users need daily credit reset");
      return new Response(JSON.stringify({ processed: 0, message: "No users to update" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let granted = 0;
    let failed = 0;

    for (const user of users) {
      // Check monthly cap: free users max 30/month, pro 150/month
      // We use the DB function which handles the logic
      const { data: result, error: rpcErr } = await adminClient.rpc("grant_daily_credits", {
        p_user_id: user.user_id,
        p_amount: DAILY_CREDITS,
      });

      if (rpcErr) {
        console.error(`[daily-credits-cron] Failed for ${user.user_id}:`, rpcErr);
        failed++;
      } else {
        const res = result as any;
        if (res?.success) {
          granted++;
        } else {
          console.log(`[daily-credits-cron] Skipped ${user.user_id}: ${res?.error}`);
        }
      }
    }

    console.log(`[daily-credits-cron] Done: ${granted} granted, ${failed} failed, ${users.length} total`);

    return new Response(
      JSON.stringify({ processed: users.length, granted, failed }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[daily-credits-cron] Error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
