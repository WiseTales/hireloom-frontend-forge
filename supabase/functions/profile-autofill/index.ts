import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ExtractedProfile {
  full_name: string | null;
  professional_headline: string | null;
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
    graduation_year: number | null;
  }[] | null;
  skills_technical: string[] | null;
  skills_soft: string[] | null;
  tools_and_technologies: string[] | null;
  certifications: string[] | null;
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

  // Try to find JSON in markdown code blocks
  const fencedJson = text.match(/```json\s*([\s\S]*?)```/i);
  if (fencedJson?.[1]) return fencedJson[1].trim();

  const fenced = text.match(/```\s*([\s\S]*?)```/);
  if (fenced?.[1]) return fenced[1].trim();

  // Try to find raw JSON object
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
        error: 'Resume text is required and must contain meaningful content (at least 50 characters).'
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

    // Limit total context to avoid token limits
    const maxLength = 20000;
    const truncatedContext = mergedContext.length > maxLength
      ? mergedContext.substring(0, maxLength) + '...[truncated]'
      : mergedContext;

    console.log('Context length:', truncatedContext.length);

    // Use Lovable AI Gateway (pre-configured, no API key needed from user)
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return jsonResponse({ success: false, error: 'AI service not configured. Please contact support.' });
    }

    const systemPrompt = `You are a precise, expert resume-to-LinkedIn profile parser. Extract ONLY information that is explicitly present in the resume text. Never hallucinate, invent, assume, or add details not stated. If a field is missing or unclear, output null or empty string "" / empty array [] as appropriate.

CRITICAL RULES - MUST FOLLOW EXACTLY:
1. Output ONLY valid JSON. No explanations, no markdown fences, no introductory text, no trailing commas, nothing before or after the JSON object.
2. Resume is the primary source of truth. LinkedIn is secondary and should only fill missing data.
3. CLEAN UP OCR NOISE: Remove random single letters, fix words broken by line breaks, and ignore weird symbols.
4. Use the EXACT JSON schema structure provided. Do not add, remove, rename, or reorder keys.`;

    const userPrompt = `Extract the following candidate profile fields. Return a valid JSON object with EXACTLY this structure:

{
  "full_name": "string | null",
  "professional_headline": "string (professional title / current role summary) | null",
  "email": "string | null",
  "phone": "string | null",
  "location": "string (e.g. 'Bangalore, Karnataka, India') | null",
  "total_experience_years": "number | null",
  "summary": "string (3-6 sentences professional overview, concise and impactful) | null",
  "experience": [
    {
      "role": "string",
      "company": "string",
      "location": "string | null",
      "start_date": "YYYY-MM or YYYY or null",
      "end_date": "YYYY-MM or YYYY or 'Present' or null",
      "currently_working": "boolean",
      "responsibilities": ["array of strings, 4-8 concise lines max, start each with action verb"]
    }
  ],
  "education": [
    {
      "degree": "string (e.g. 'Bachelor of Technology')",
      "institution": "string",
      "field": "string | null",
      "graduation_year": "number | null"
    }
  ],
  "skills_technical": ["array of strings (exact skill names as written, lowercase, unique, 8-15 max)"],
  "skills_soft": ["array of strings"],
  "tools_and_technologies": ["array of strings"],
  "certifications": ["array of strings"],
  "projects": [
    {
      "title": "string",
      "description": "string",
      "technologies": ["array of strings"],
      "url": "string | null"
    }
  ],
  "portfolio_links": ["array of URLs"],
  "languages": ["array of strings (e.g. 'English (Native)', 'Hindi (Professional)')"]
}

Resume/LinkedIn data to parse (may contain OCR artifacts - clean and interpret logically but do NOT fabricate):
${truncatedContext}`;

    console.log('Calling Lovable AI Gateway...');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return jsonResponse({
          success: false,
          error: 'AI service is temporarily busy. Please try again in a moment.',
        });
      }
      if (aiResponse.status === 402) {
        return jsonResponse({
          success: false,
          error: 'AI service quota exceeded. Please contact support.',
        });
      }
      
      return jsonResponse({
        success: false,
        error: 'AI extraction failed. Please try again or fill the form manually.',
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      console.error('AI returned empty content');
      return jsonResponse({ success: false, error: 'AI returned empty response. Please try again.' });
    }

    console.log('AI response received, parsing JSON...');

    // Parse the JSON from the AI response
    let extractedData: ExtractedProfile;
    try {
      const jsonStr = extractJsonFromModelText(content);
      if (!jsonStr) {
        console.error('No JSON found in response:', content.substring(0, 500));
        throw new Error('No JSON object found in AI response');
      }
      extractedData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content.substring(0, 1000));
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
      error: error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
    });
  }
});
