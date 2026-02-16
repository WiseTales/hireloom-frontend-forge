
import { createClient } from '@supabase/supabase-js';

// Minimal types to avoid 'any'
interface VercelRequest {
  method: string;
  query: {
    companySlug?: string;
  };
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (data: unknown) => VercelResponse;
  end: () => void;
}

/**
 * Public Jobs API Route
 * Path: /api/public/jobs/[companySlug]
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS check
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { companySlug } = req.query;

  if (!companySlug) {
    return res.status(400).json({ error: "Company slug is required" });
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("Supabase environment variables missing");
      return res.status(500).json({ error: "Internal server error" });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Find company by slug
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id")
      .eq("slug", companySlug)
      .single();

    if (companyError || !company) {
      return res.status(404).json({ error: "Company not found" });
    }

    // 2. Fetch jobs by companyId and status
    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .select("id, title, location, type, description")
      .eq("company_id", company.id)
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (jobsError) {
      console.error("Database error:", jobsError);
      return res.status(200).json([]);
    }

    // 3. Map to requested schema
    const response = (jobs || []).map((j) => ({
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
    return res.status(200).json([]);
  }
}
