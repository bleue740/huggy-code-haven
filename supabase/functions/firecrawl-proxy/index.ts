import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FIRECRAWL_BASE = "https://api.firecrawl.dev/v1";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Firecrawl API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    const { action, url, query, options } = body;

    if (!action) {
      return new Response(
        JSON.stringify({ success: false, error: "Action required (scrape, search, map, crawl)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let endpoint: string;
    let payload: Record<string, unknown>;

    switch (action) {
      case "scrape": {
        if (!url) {
          return new Response(
            JSON.stringify({ success: false, error: "URL required for scrape" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        let formattedUrl = url.trim();
        if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
          formattedUrl = `https://${formattedUrl}`;
        }
        endpoint = "/scrape";
        payload = {
          url: formattedUrl,
          formats: options?.formats || ["markdown"],
          onlyMainContent: options?.onlyMainContent ?? true,
          waitFor: options?.waitFor,
        };
        break;
      }

      case "search": {
        if (!query) {
          return new Response(
            JSON.stringify({ success: false, error: "Query required for search" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        endpoint = "/search";
        payload = {
          query,
          limit: options?.limit || 10,
          lang: options?.lang,
          country: options?.country,
          scrapeOptions: options?.scrapeOptions,
        };
        break;
      }

      case "map": {
        if (!url) {
          return new Response(
            JSON.stringify({ success: false, error: "URL required for map" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        let formattedUrl = url.trim();
        if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
          formattedUrl = `https://${formattedUrl}`;
        }
        endpoint = "/map";
        payload = {
          url: formattedUrl,
          search: options?.search,
          limit: options?.limit || 5000,
          includeSubdomains: options?.includeSubdomains ?? false,
        };
        break;
      }

      case "crawl": {
        if (!url) {
          return new Response(
            JSON.stringify({ success: false, error: "URL required for crawl" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        let formattedUrl = url.trim();
        if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
          formattedUrl = `https://${formattedUrl}`;
        }
        endpoint = "/crawl";
        payload = {
          url: formattedUrl,
          limit: options?.limit || 100,
          maxDepth: options?.maxDepth,
          includePaths: options?.includePaths,
          excludePaths: options?.excludePaths,
          scrapeOptions: { formats: ["markdown"] },
        };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
    }

    console.log(`[firecrawl-proxy] action=${action} endpoint=${endpoint}`);

    const resp = await fetch(`${FIRECRAWL_BASE}${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json();

    if (!resp.ok) {
      console.error(`Firecrawl API error ${resp.status}:`, data);
      return new Response(
        JSON.stringify({ success: false, error: data.error || `Firecrawl error ${resp.status}` }),
        { status: resp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("firecrawl-proxy error:", e);
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
