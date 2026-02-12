import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Accept optional code context from the request body
    let codeContext = "";
    try {
      const body = await req.json();
      if (body?.code) {
        codeContext = `\n\nThe user's current app code (first 3000 chars):\n${body.code.slice(0, 3000)}\n\nGenerate suggestions that complement or extend this existing code.`;
      }
    } catch {
      // No body or invalid JSON — use generic suggestions
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content:
                "You are a creative app feature suggestion generator. Generate 4 unique, actionable feature suggestions that a developer could add to their React app. Each suggestion should be specific and implementable. Respond in the same language as any code comments you see (default to French)." + codeContext,
            },
            {
              role: "user",
              content:
                "Generate 4 creative and actionable feature suggestions for this app. Make them diverse: mix UI components, functionality, data visualization, and interactions. Each should be buildable as a React component.",
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "return_suggestions",
                description: "Return 4 feature suggestions with icon, title, and detailed prompt.",
                parameters: {
                  type: "object",
                  properties: {
                    suggestions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          icon: {
                            type: "string",
                            enum: ["layout", "form", "chart", "button", "table"],
                            description: "Icon category",
                          },
                          title: {
                            type: "string",
                            description: "Short title (3-6 words)",
                          },
                          prompt: {
                            type: "string",
                            description: "Detailed prompt (2-3 sentences) describing what to build",
                          },
                        },
                        required: ["icon", "title", "prompt"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["suggestions"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "return_suggestions" } },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No tool call in response");
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-suggestions error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
