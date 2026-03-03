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

  if (!companySlug) {
    return new Response(
      JSON.stringify({ error: "companySlug query parameter is required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
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

  // Fetch published jobs for this company
  const { data: jobs, error: jobsError } = await supabase
    .from("jobs")
    .select("id, title, location, salary, type, category, description, created_at")
    .eq("company_id", company.id)
    .eq("is_published", true)
    .eq("visibility", "external")
    .order("created_at", { ascending: false });

  if (jobsError) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch jobs" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Map to the expected response format
  const mappedJobs = (jobs || []).map((job) => ({
    id: job.id,
    title: job.title,
    location: job.location,
    salary_range: job.salary,
    job_type: job.type,
    category: job.category,
    description: job.description,
    created_at: job.created_at,
  }));

  return new Response(
    JSON.stringify({
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
        career_site_url: company.career_site_url,
        logo_url: company.logo_url,
        description: company.description,
      },
      jobs: mappedJobs,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
