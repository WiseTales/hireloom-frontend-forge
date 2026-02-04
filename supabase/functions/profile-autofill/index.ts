import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ExtractedProfile {
  full_name: string | null;
  headline: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  total_experience_years: number | null;
  summary: string | null;
  experience: {
    role: string;
    company: string;
    location?: string;
    start_date: string | null;
    end_date: string | null;
    currently_working: boolean;
    responsibilities: string[];
  }[] | null;
  education: {
    degree: string;
    institution: string;
    field: string | null;
    start_date: string | null;
    end_date: string | null;
  }[] | null;
  skills_technical: string[] | null;
  skills_soft: string[] | null;
  certifications: {
    name: string;
    issuing_organization: string;
    issue_date: string | null;
  }[] | null;
  projects: {
    title: string;
    description: string;
    technologies: string[];
    url: string | null;
  }[] | null;
  portfolio_links: string[] | null;
  languages: string[] | null;
}

type ProfileAutofillResponse =
  | { success: true; data: ExtractedProfile }
  | { success: false; error: string };

function jsonResponse(payload: ProfileAutofillResponse, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function cleanHtmlToText(html: string): string {
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');
  text = text.replace(/<(header|footer|nav|aside)[^>]*>[\s\S]*?<\/(header|footer|nav|aside)>/gi, '');
  text = text.replace(/<!--[\s\S]*?-->/g, '');
  text = text.replace(/<(br)\s*\/?\s*>/gi, '\n');
  text = text.replace(/<(p|div|h[1-6]|li|tr|section|article)[^>]*>/gi, '\n');
  text = text.replace(/<[^>]+>/g, ' ');
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&rsquo;/g, "'");
  text = text.replace(/&lsquo;/g, "'");
  text = text.replace(/&rdquo;/g, '"');
  text = text.replace(/&ldquo;/g, '"');
  text = text.replace(/&mdash;/g, '—');
  text = text.replace(/&ndash;/g, '–');
  text = text.replace(/\r\n/g, '\n');
  text = text.replace(/[\t\f\v ]+/g, ' ');
  text = text.replace(/\n[ \t]+/g, '\n');
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.replace(/\s+\n/g, '\n');
  return text.trim();
}

function extractJsonFromModelText(raw: string): string | null {
  const text = raw.trim();

  const fencedJson = text.match(/```json\s*([\s\S]*?)```/i);
  if (fencedJson?.[1]) return fencedJson[1].trim();

  const fenced = text.match(/```\s*([\s\S]*?)```/);
  if (fenced?.[1]) return fenced[1].trim();

  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return text.slice(firstBrace, lastBrace + 1).trim();
  }

  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeText, linkedinUrl } = await req.json();

    if (!resumeText || resumeText.trim().length < 50) {
      return jsonResponse({
        success: false,
        error: 'Resume text is required and must contain meaningful content.'
      });
    }

    let mergedContext = `=== RESUME (PRIMARY SOURCE) ===\n${resumeText}\n`;

    // Optionally fetch LinkedIn profile
    if (linkedinUrl && linkedinUrl.trim()) {
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(linkedinUrl);
        if (!parsedUrl.hostname.includes('linkedin.com')) {
          console.log('Invalid LinkedIn URL, skipping:', linkedinUrl);
        } else {
          console.log('Fetching LinkedIn profile:', linkedinUrl);

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          try {
            const response = await fetch(linkedinUrl, {
              signal: controller.signal,
              redirect: 'follow',
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
              },
            });
            clearTimeout(timeoutId);

            if (response.ok) {
              const htmlContent = await response.text();

              // Try to find large JSON blobs in script tags (common in LinkedIn public profiles)
              const scriptData = htmlContent.match(/<script type="application\/json"[^>]*>([\s\S]*?)<\/script>/gi);
              let combinedData = '';
              if (scriptData) {
                scriptData.forEach(s => {
                  if (s.length > 500) combinedData += s.replace(/<[^>]+>/g, ' ') + '\n';
                });
              }

              const linkedinText = cleanHtmlToText(htmlContent) + '\n' + combinedData;

              if (linkedinText.length > 100) {
                const truncatedLinkedin = linkedinText.length > 8000
                  ? linkedinText.substring(0, 8000) + '...[truncated]'
                  : linkedinText;
                console.log(`LinkedIn data extracted (${linkedinText.length} chars)`);
                mergedContext += `\n=== LINKEDIN PROFILE (SECONDARY SOURCE) ===\n${truncatedLinkedin}\n`;
              } else {
                console.log('LinkedIn fetch returned empty or login wall content.');
              }
            }
          } catch (fetchError) {
            clearTimeout(timeoutId);
            console.log('LinkedIn fetch failed, continuing with resume only:', fetchError);
          }
        }
      } catch {
        console.log('Invalid LinkedIn URL format, skipping');
      }
    }

    // Limit total context
    const maxLength = 20000;
    const truncatedContext = mergedContext.length > maxLength
      ? mergedContext.substring(0, maxLength) + '...[truncated]'
      : mergedContext;

    console.log('Context length:', truncatedContext.length);
    console.log('Preview of extracted text (first 200 chars):', truncatedContext.substring(0, 200));

    // Call Gemini API
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return jsonResponse({ success: false, error: 'AI service not configured' });
    }

    const systemPrompt = `You are the world's most precise resume parsing AI.
Your goal is to extract EVERY possible detail from the provided Resume (primary) and LinkedIn (secondary) text.

SCHEMA REQUIREMENTS:
- full_name: string (Required)
- headline: string (Current role or professional title)
- email: string (Valid email format)
- phone: string
- location: string (City, Country)
- total_experience_years: number (Sum of all relevant experience)
- summary: string (Professional bio/summary)
- experience: array of { role, company, location, start_date (YYYY-MM), end_date (YYYY-MM or null), currently_working (boolean), responsibilities (array of strings) }
- education: array of { degree, institution, field, start_date (YYYY-MM), end_date (YYYY-MM) }
- skills_technical: array of strings (e.g., React, Python)
- skills_soft: array of strings (e.g., Leadership, Communication)
- certifications: array of { name, issuing_organization, issue_date (YYYY-MM) }
- projects: array of { title, description, technologies (array), url }
- portfolio_links: array of strings (GitHub, Portfolio, LinkedIn)
- languages: array of strings

STRICT RULES:
1. Prefer Resume data over LinkedIn for conflicts.
2. If the input text is messy/unstructured (common in PDF extractions), look for patterns like 'Name:', 'Experience', dates (e.g., '2020-2022' or 'Jan 20 onwards').
3. CLEAN UP OCR NOISE: Remove random single letters, fix words that seem broken by line breaks, and ignore CID characters or weird symbols from the PDF stream.
4. DO NOT hallucinate. If a field is missing, return null.
5. CLEAN TITLES: Standardize 'SDE 2' to 'Software Development Engineer II' if context allows, or keep as is if unsure.
6. You MUST return valid JSON.`;

    const userPrompt = `Systematically parse the following candidate data. Be extremely precise and thorough. Find as much info as possible even if hidden in raw text.

DATA TO PARSE:
${truncatedContext}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-1.5-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0,
        response_format: { type: 'json_object' }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);

      if (aiResponse.status === 429) {
        return jsonResponse({
          success: false,
          error: 'AI service rate limit exceeded. Please try again in a moment.',
        });
      }
      if (aiResponse.status === 402) {
        return jsonResponse({
          success: false,
          error: 'AI service credits exhausted. Please contact support.',
        });
      }

      return jsonResponse({
        success: false,
        error: 'AI extraction failed. Please try again.',
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      return jsonResponse({ success: false, error: 'AI returned empty response' });
    }

    // Parse the JSON from the AI response
    let extractedData: ExtractedProfile;
    try {
      const jsonStr = extractJsonFromModelText(content);
      if (!jsonStr) throw new Error('No JSON object found in model output');
      extractedData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      const details = parseError instanceof Error ? parseError.message : String(parseError);
      return jsonResponse({
        success: false,
        error: `Failed to parse AI response. Please try again. Details: ${details}`,
      });
    }

    console.log('Successfully extracted profile data');

    return jsonResponse({ success: true, data: extractedData });

  } catch (error) {
    console.error('Profile autofill error:', error);
    return jsonResponse({
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    });
  }
});
