
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Public Jobs API for Hireloom
 * Handles: GET /api/public/jobs/[companySlug]
 * Returns status 200 with [] even on failure to prevent downstream 500s.
 */
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    // 1. Identify companySlug from path or query
    let companySlug = url.searchParams.get("companySlug");

    if (!companySlug) {
      // Logic for path: .../public-jobs/[companySlug]
      const publicJobsIndex = pathParts.indexOf('public-jobs');
      if (publicJobsIndex !== -1 && pathParts.length > publicJobsIndex + 1) {
        companySlug = pathParts[publicJobsIndex + 1];
      } else {
        // Fallback: check if the last part of the path is the slug if not 'public-jobs'
        const lastPart = pathParts[pathParts.length - 1];
        if (lastPart && lastPart !== 'public-jobs') {
          companySlug = lastPart;
        }
      }
    }

    if (!companySlug) {
      console.error("DEBUG: No companySlug found in path or query");
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      console.error("CRITICAL: Supabase environment variables missing");
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Resolve company ID from slug
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id")
      .eq("slug", companySlug)
      .single();

    if (companyError || !company) {
      console.warn(`Company not found for slug: ${companySlug}`);
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 3. Fetch published jobs
    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .select("id, title, location, type, description")
      .eq("company_id", company.id)
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (jobsError) {
      console.error("Database error fetching jobs:", jobsError);
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 4. Transform to requested schema
    const response = (jobs || []).map((j) => ({
      id: j.id,
      title: j.title,
      location: j.location,
      employmentType: j.type, // Map 'type' to 'employmentType'
      shortDescription: j.description && j.description.length > 200
        ? j.description.substring(0, 200) + "..."
        : (j.description || ""),
    }));

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("Global API Error caught in try/catch:", err);
    // Requirement fulfill: Return 200 and [] on failure
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
