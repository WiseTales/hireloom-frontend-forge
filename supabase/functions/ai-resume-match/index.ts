import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resume_base64, job_title, job_description, job_requirements, job_skills, job_responsibilities } = await req.json();

    if (!resume_base64) {
      return new Response(JSON.stringify({ error: "Resume PDF is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const jobContext = [
      `Job Title: ${job_title || "N/A"}`,
      job_description ? `Description: ${job_description}` : "",
      job_requirements?.length ? `Requirements: ${job_requirements.join(", ")}` : "",
      job_skills?.length ? `Required Skills: ${job_skills.join(", ")}` : "",
      job_responsibilities?.length ? `Responsibilities: ${job_responsibilities.join(", ")}` : "",
    ].filter(Boolean).join("\n");

    const systemPrompt = `You are an expert recruitment analyst. You will receive a candidate's resume (PDF) and a job description. Analyze how well the candidate matches the job and provide a structured assessment.`;

    const userPrompt = `Analyze this resume against the following job posting and provide a match assessment.

JOB POSTING:
${jobContext}

Please analyze the attached resume PDF and provide your assessment.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              {
                type: "image_url",
                image_url: { url: `data:application/pdf;base64,${resume_base64}` },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "resume_match_analysis",
              description: "Return structured resume-job match analysis",
              parameters: {
                type: "object",
                properties: {
                  match_score: {
                    type: "number",
                    description: "Overall match percentage 0-100",
                  },
                  summary: {
                    type: "string",
                    description: "2-3 sentence overall assessment",
                  },
                  strengths: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 key strengths that match the job",
                  },
                  gaps: {
                    type: "array",
                    items: { type: "string" },
                    description: "2-4 gaps or missing qualifications",
                  },
                  recommendation: {
                    type: "string",
                    enum: ["strong_match", "good_match", "partial_match", "weak_match"],
                    description: "Overall recommendation",
                  },
                },
                required: ["match_score", "summary", "strengths", "gaps", "recommendation"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "resume_match_analysis" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "AI service is busy. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      let analysis;
      try {
        analysis = typeof toolCall.function.arguments === "string"
          ? JSON.parse(toolCall.function.arguments)
          : toolCall.function.arguments;
      } catch {
        return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ analysis }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: return raw content if tool calling didn't work
    const content = aiData.choices?.[0]?.message?.content || "Analysis unavailable";
    return new Response(JSON.stringify({
      analysis: {
        match_score: 50,
        summary: content.slice(0, 300),
        strengths: ["Unable to parse structured analysis"],
        gaps: ["Please review the full AI response"],
        recommendation: "partial_match",
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Resume match error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
