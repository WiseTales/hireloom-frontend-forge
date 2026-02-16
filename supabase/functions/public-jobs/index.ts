
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);

    let companySlug = url.searchParams.get("companySlug");

    if (!companySlug) {
      const publicJobsIndex = pathParts.indexOf('public-jobs');
      if (publicJobsIndex !== -1 && pathParts.length > publicJobsIndex + 1) {
        companySlug = pathParts[publicJobsIndex + 1];
      }
    }

    if (!companySlug) {
      return new Response(JSON.stringify({ error: "Company slug is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Find company by slug
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id")
      .eq("slug", companySlug)
      .single();

    if (companyError || !company) {
      return new Response(JSON.stringify({ error: "Company not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // 2. Fetch jobs by companyId and status
    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .select("*")
      .eq("company_id", company.id)
      .eq("status", "published")
      .order("created_at", { ascending: false });

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
