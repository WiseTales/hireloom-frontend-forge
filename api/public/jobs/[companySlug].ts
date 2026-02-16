
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("CRITICAL: Supabase environment variables missing");
      return res.status(200).json([]);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // TEMPORARY: Remove all filtering to confirm DB contains data
    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false });

    console.log("DEBUG: All Jobs in DB:", jobs);

    if (jobsError) {
      console.error("Database error:", jobsError);
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
      // Adding extra debug info to see what's in the DB
      _debug_company_slug: j.company_slug,
      _debug_status: j.status
    }));

    return res.status(200).json(response);

  } catch (err) {
    console.error("Global API Error:", err);
    return res.status(200).json([]);
  }
}
