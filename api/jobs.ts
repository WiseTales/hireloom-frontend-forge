
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/jobs
 * Handles job creation for HR users.
 * Translates NextAuth patterns to Supabase architecture.
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 1. Get auth token from headers
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
    // 2. Verify User
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized - invalid token" });
    }

    // 3. Get companyId from profile (Equivalent to session.user.companyId)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.company_id) {
      return res.status(401).json({ error: "Unauthorized - no company found for this user" });
    }

    const { title, location, description, salary, jobType, category } = req.body;

    // 4. Create Job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert([{
        title,
        location,
        description,
        salary,
        type: jobType, // mapping jobType to 'type' column in Supabase
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
