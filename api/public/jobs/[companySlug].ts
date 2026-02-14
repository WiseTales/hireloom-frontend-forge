
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  // CORS check (Standard practice for public APIs)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Get companySlug from the dynamic route parameter [companySlug]
  const { companySlug } = req.query;

  if (!companySlug) {
    console.error("DEBUG: No companySlug provided in query");
    return res.status(200).json([]);
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("CRITICAL: Supabase environment variables missing in production");
      return res.status(200).json([]);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Find company by slug
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id")
      .eq("slug", companySlug)
      .single();

    if (companyError || !company) {
      console.warn(`Company not found: ${companySlug}`);
      return res.status(200).json([]);
    }

    // 2. Fetch published jobs
    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .select("id, title, location, type, description")
      .eq("company_id", company.id)
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (jobsError) {
      console.error("Database error fetching jobs:", jobsError);
      return res.status(200).json([]);
    }

    // 3. Map to requested schema
    const response = (jobs || []).map((j: any) => ({
      id: j.id,
      title: j.title,
      location: j.location,
      employmentType: j.type,
      shortDescription: j.description && j.description.length > 200
        ? j.description.substring(0, 200) + "..."
        : (j.description || ""),
    }));

    // Successful response
    return res.status(200).json(response);

  } catch (err) {
    console.error("Global API Error caught in handler:", err);
    // Requirement fulfill: Never return 500, return 200 with []
    return res.status(200).json([]);
  }
}
