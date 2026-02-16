
import { createClient } from '@supabase/supabase-js';

/**
 * Public Jobs API Route
 * Path: /api/public/jobs/[companySlug]
 * Handles fetching published jobs for a specific company slug directly.
 */
export default async function handler(req: any, res: any) {
  // CORS check
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Extract companySlug from params (req.query in Vercel)
  const { companySlug } = req.query;

  if (!companySlug) {
    console.error("DEBUG: No companySlug provided in request");
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

    // Filter by company_slug and status directly as requested
    // This avoids relational issues if the company table link is broken
    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .select("id, title, location, type, description, company_slug, status")
      .eq("company_slug", companySlug)
      .eq("status", "published")
      .order("created_at", { ascending: false });

    // Temporary debugging as requested
    console.log("Fetched jobs for slug:", companySlug, jobs);

    if (jobsError) {
      console.error("Database error fetching jobs:", jobsError);
      return res.status(200).json([]);
    }

    // Map to requested schema
    const response = (jobs || []).map((j: any) => ({
      id: j.id,
      title: j.title,
      location: j.location,
      employmentType: j.type,
      shortDescription: j.description && j.description.length > 200
        ? j.description.substring(0, 200) + "..."
        : (j.description || ""),
    }));

    return res.status(200).json(response);

  } catch (err) {
    console.error("Global API Error caught in handler:", err);
    // Standard fail-safe: return 200 with empty array
    return res.status(200).json([]);
  }
}
