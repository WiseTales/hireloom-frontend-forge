
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Public Jobs Edge Function
 * Logic: Fetch by company_slug and status directly.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    let companySlug = url.searchParams.get("companySlug");

    if (!companySlug) {
      // Logic for path: .../public-jobs/[companySlug]
      const publicJobsIndex = pathParts.indexOf('public-jobs');
      if (publicJobsIndex !== -1 && pathParts.length > publicJobsIndex + 1) {
        companySlug = pathParts[publicJobsIndex + 1];
      } else {
        const lastPart = pathParts[pathParts.length - 1];
        if (lastPart && lastPart !== 'public-jobs') {
          companySlug = lastPart;
        }
      }
    }

    if (!companySlug) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Direct fetch as requested
    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .select("id, title, location, type, description")
      .eq("company_slug", companySlug)
      .eq("status", "published")
      .order("created_at", { ascending: false });

    console.log("Fetched jobs:", jobs);

    if (jobsError) {
      console.error("Database error:", jobsError);
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const response = (jobs || []).map((j) => ({
      id: j.id,
      title: j.title,
      location: j.location,
      employmentType: j.type,
      shortDescription: j.description && j.description.length > 200
        ? j.description.substring(0, 200) + "..."
        : (j.description || ""),
    }));

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("Global error:", err);
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
