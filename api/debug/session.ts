
import { createClient } from '@supabase/supabase-js';

interface DebugRequest {
  method: string;
  headers: { authorization?: string };
}

interface DebugResponse {
  status: (code: number) => DebugResponse;
  json: (data: unknown) => DebugResponse;
}

/**
 * GET /api/debug/session
 * Verifies if the session user has a valid companyId.
 */
export default async function handler(req: DebugRequest, res: DebugResponse) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Missing authorization header", hint: "Ensure you are logged in and sending Bearer token" });
  }

  const token = authHeader.replace('Bearer ', '');

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: "Supabase keys missing" });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*, companies(*)')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error("Profile fetch error:", profileError);
    }

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: profile?.full_name,
        companyId: profile?.company_id,
        company: profile?.companies
      },
      _raw_supabase_user: user,
      _raw_profile: profile
    });

  } catch (err: unknown) {
    const error = err as Error;
    return res.status(500).json({ error: error.message });
  }
}
