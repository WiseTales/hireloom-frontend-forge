import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const companySlug = url.searchParams.get("companySlug");
  const jobId = url.searchParams.get("jobId");

  if (!companySlug) {
    return new Response(
      JSON.stringify({ error: "companySlug query parameter is required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Find company by slug
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id, name, slug, career_site_url, logo_url, description")
    .eq("slug", companySlug)
    .maybeSingle();

  if (companyError || !company) {
    return new Response(
      JSON.stringify({ error: "Company not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // If specific jobId requested, return single job detail
  if (jobId) {
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, title, department, location, location_type, salary, type, category, experience_level, experience_required, description, responsibilities, requirements, benefits, skills_required, application_deadline, hiring_manager_name, created_at")
      .eq("id", jobId)
      .eq("company_id", company.id)
      .eq("status", "published")
      .eq("visibility", "external")
      .maybeSingle();

    if (jobError || !job) {
      return new Response(
        JSON.stringify({ error: "Job not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ company: { id: company.id, name: company.name, slug: company.slug, logo_url: company.logo_url, description: company.description }, job }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Fetch all published external jobs
  const { data: jobs, error: jobsError } = await supabase
    .from("jobs")
    .select("id, title, department, location, location_type, salary, type, category, experience_level, description, created_at")
    .eq("company_id", company.id)
    .eq("status", "published")
    .eq("visibility", "external")
    .order("created_at", { ascending: false });

  if (jobsError) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch jobs" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({
      company: { id: company.id, name: company.name, slug: company.slug, logo_url: company.logo_url, description: company.description },
      jobs: jobs || [],
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
