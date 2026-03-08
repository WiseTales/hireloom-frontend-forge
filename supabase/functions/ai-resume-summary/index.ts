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

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "AI not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { full_name, email, resume_url, cover_letter, linkedin_url } = await req.json();

    const contextParts: string[] = [];
    contextParts.push(`Candidate Name: ${full_name}`);
    contextParts.push(`Email: ${email}`);
    if (linkedin_url) contextParts.push(`LinkedIn: ${linkedin_url}`);
    if (cover_letter) contextParts.push(`Cover Letter: ${cover_letter}`);
    if (resume_url && resume_url !== 'not_provided') contextParts.push(`Resume URL: ${resume_url}`);

    const prompt = `Based on the following candidate information, provide a brief professional summary (2-3 sentences) highlighting their likely experience, skills, and suitability. Be concise and factual based only on available information.

${contextParts.join('\n')}

If limited information is available, note that and provide what assessment you can based on the cover letter or other details.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are an HR assistant that provides concise candidate summaries. Be professional, factual, and brief. Never fabricate information." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const summary = aiData.choices?.[0]?.message?.content || 'Unable to generate summary.';

    return new Response(
      JSON.stringify({ summary }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("AI summary error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Summary generation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
