
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://nexacore128.vercel.app",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    // We expect /jobs/:companySlug
    // In Supabase, the path might be /functions/v1/jobs/:companySlug
    const jobsIndex = pathParts.indexOf('jobs');
    const companySlug = (jobsIndex !== -1 && pathParts.length > jobsIndex + 1) ? pathParts[jobsIndex + 1] : null;

    if (!companySlug) {
      return new Response(
        JSON.stringify({ error: "companySlug is required in URL path" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // First find company to get its ID
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id")
      .eq("slug", companySlug)
      .single();

    if (companyError || !company) {
      return new Response(
        JSON.stringify({ error: "Company not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch published jobs for this company
    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .select("id, title, location, type, description")
      .eq("company_id", company.id)
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (jobsError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch jobs" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const publicJobs = (jobs || []).map((j) => ({
      id: j.id,
      title: j.title,
      location: j.location,
      employmentType: j.type,
      shortDescription: j.description.length > 200 ? j.description.substring(0, 200) + "..." : j.description,
    }));

    return new Response(
      JSON.stringify(publicJobs),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error", details: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
