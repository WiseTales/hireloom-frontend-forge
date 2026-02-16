
import { createClient } from '@supabase/supabase-js';

interface JobsRequest {
  method: string;
  headers: { authorization?: string };
  body: {
    title: string;
    location: string;
    description: string;
    salary: string;
    jobType: string;
    category: string;
  };
}

interface JobsResponse {
  status: (code: number) => JobsResponse;
  json: (data: unknown) => JobsResponse;
}

/**
 * POST /api/jobs
 * Handles job creation for HR users.
 */
export default async function handler(req: JobsRequest, res: JobsResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Missing authorization header" });
  }

  const token = authHeader.replace('Bearer ', '');

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("CRITICAL: Supabase keys missing");
    return res.status(500).json({ error: "Internal server error" });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized - invalid token" });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.company_id) {
      return res.status(401).json({
        error: "Unauthorized – user not linked to any company"
      });
    }

    const { title, location, description, salary, jobType, category } = req.body;

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert([{
        title,
        location,
        description,
        salary,
        type: jobType,
        category,
        status: "published",
        company_id: profile.company_id,
        posted_by: user.id
      }])
      .select()
      .single();

    if (jobError) {
      console.error("Job Creation Error:", jobError);
      return res.status(400).json({ error: jobError.message });
    }

    return res.status(201).json(job);

  } catch (err) {
    console.error("API Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
