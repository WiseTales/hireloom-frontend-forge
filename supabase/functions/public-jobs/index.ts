import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://nexacore128.vercel.app",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Look up company by slug
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, name, logo_url, description, website")
      .eq("slug", companySlug)
      .single();

    if (companyError || !company) {
      return new Response(
        JSON.stringify({ error: "Company not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch published external jobs for this company
    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .select("id, title, description, location, type, category, salary, is_remote, location_type, work_type, experience_level, created_at")
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

    // Map to public-safe schema
    const publicJobs = (jobs || []).map((j) => ({
      jobId: j.id,
      title: j.title,
      description: j.description,
      location: j.location,
      employmentType: j.type,
      category: j.category,
      salary: j.salary,
      isRemote: j.is_remote,
      locationType: j.location_type,
      workType: j.work_type,
      experienceLevel: j.experience_level,
      postedAt: j.created_at,
    }));

    return new Response(
      JSON.stringify({
        company: {
          name: company.name,
          logo: company.logo_url,
          description: company.description,
          website: company.website,
        },
        jobs: publicJobs,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
