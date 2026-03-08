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

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: {
    job_id: string;
    company_slug: string;
    full_name: string;
    email: string;
    phone?: string;
    resume_url: string;
    cover_letter?: string;
    linkedin_url?: string;
    portfolio_url?: string;
  };

  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!body.job_id || !body.company_slug || !body.full_name || !body.email || !body.resume_url) {
    return new Response(
      JSON.stringify({ error: "Missing required fields" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(body.email)) {
    return new Response(
      JSON.stringify({ error: "Invalid email format" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id")
    .eq("slug", body.company_slug)
    .maybeSingle();

  if (companyError || !company) {
    return new Response(
      JSON.stringify({ error: "Company not found" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("id, company_id, status")
    .eq("id", body.job_id)
    .eq("company_id", company.id)
    .eq("status", "published")
    .maybeSingle();

  if (jobError || !job) {
    return new Response(
      JSON.stringify({ error: "Job not found or not published" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { data: application, error: insertError } = await supabase
    .from("public_applications")
    .insert({
      job_id: body.job_id,
      full_name: body.full_name,
      email: body.email,
      phone: body.phone || null,
      resume_url: body.resume_url,
      cover_letter: body.cover_letter || null,
      linkedin_url: body.linkedin_url || null,
      portfolio_url: body.portfolio_url || null,
      source: "external_careers",
      status: "new",
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("Insert error:", insertError);
    return new Response(
      JSON.stringify({ error: "Failed to submit application" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, message: "Application submitted successfully", application_id: application.id }),
    { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
