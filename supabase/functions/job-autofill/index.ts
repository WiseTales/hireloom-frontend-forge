import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ExtractedJob {
  job_title: string | null;
  company_name: string | null;
  employment_type: string | null;
  job_description: string | null;
  responsibilities: string[] | null;
  required_skills: string[] | null;
  experience_level: string | null;
  education_requirements: string | null;
  salary: string | null;
  location: string | null;
  application_deadline: string | null;
  apply_url: string | null;
}

type JobAutofillResponse =
  | { success: true; data: ExtractedJob }
  | { success: false; error: string };

function jsonResponse(payload: JobAutofillResponse, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function cleanHtmlToText(html: string): string {
  // Remove script and style tags with their content
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '');
  // Drop common non-content containers
  text = text.replace(/<(header|footer|nav|aside)[^>]*>[\s\S]*?<\/(header|footer|nav|aside)>/gi, '');
  
  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, '');
  
  // Replace common block elements with newlines
  text = text.replace(/<(br)\s*\/?\s*>/gi, '\n');
  text = text.replace(/<(p|div|h[1-6]|li|tr|section|article)[^>]*>/gi, '\n');
  
  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  
  // Decode HTML entities
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
  
  // Normalize whitespace while preserving newlines
  text = text.replace(/\r\n/g, '\n');
  text = text.replace(/[\t\f\v ]+/g, ' ');
  text = text.replace(/\n[ \t]+/g, '\n');
  text = text.replace(/\n{3,}/g, '\n\n');
  text = text.replace(/\s+\n/g, '\n');
  
  return text.trim();
}

function extractJsonFromModelText(raw: string): string | null {
  const text = raw.trim();

  // 1) ```json ... ```
  const fencedJson = text.match(/```json\s*([\s\S]*?)```/i);
  if (fencedJson?.[1]) return fencedJson[1].trim();

  // 2) ``` ... ```
  const fenced = text.match(/```\s*([\s\S]*?)```/);
  if (fenced?.[1]) return fenced[1].trim();

  // 3) first {...} block (best-effort)
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
    const { url } = await req.json();

    if (!url) {
      return jsonResponse({ success: false, error: 'URL is required' });
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return jsonResponse({
        success: false,
        error: 'Invalid URL format. Please provide a valid HTTP/HTTPS URL.',
      });
    }

    console.log('Fetching job posting from:', url);

    // Fetch the job posting page
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    let htmlContent: string;
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return jsonResponse({
          success: false,
          error: `Failed to fetch job page: ${response.status} ${response.statusText}`,
        });
      }

      htmlContent = await response.text();
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('Fetch error:', fetchError);
      const details = fetchError instanceof Error ? fetchError.message : String(fetchError);
      return jsonResponse({
        success: false,
        error: `Failed to fetch the job page. The page may be behind a login, blocking automated access, or the URL may be invalid. Details: ${details}`,
      });
    }

    // Clean HTML to text
    const cleanedText = cleanHtmlToText(htmlContent);
    
    // Limit text length to avoid token limits
    const maxLength = 15000;
    const truncatedText = cleanedText.length > maxLength 
      ? cleanedText.substring(0, maxLength) + '...[truncated]'
      : cleanedText;

    if (truncatedText.length < 100) {
      return jsonResponse({
        success: false,
        error: 'Could not extract meaningful content from the page. The page may require JavaScript to load or is blocking access.',
      });
    }

    console.log('Extracted text length:', truncatedText.length);

    // Call Gemini API via Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return jsonResponse({ success: false, error: 'AI service not configured' });
    }

    const systemPrompt = `You are an expert HR data extractor. Given raw job posting text scraped from a website, extract structured job details.

Rules:
- If a field is missing or cannot be determined, return null.
- Do not hallucinate.
- Output MUST be a single JSON object only. No markdown, no code fences, no explanations.`;

    const userPrompt = `Extract the following fields from this job posting text and return as JSON:

- job_title: The job position title
- company_name: The company/organization name
- employment_type: Type like "Full-time", "Part-time", "Internship", "Contract"
- job_description: A brief summary of the role
- responsibilities: Array of key responsibilities
- required_skills: Array of required skills
- experience_level: Experience requirement like "2+ years", "Entry level", "Senior"
- education_requirements: Education requirements
- salary: Salary range or amount if mentioned
- location: Job location (city, country, or "Remote", "Hybrid")
- application_deadline: Application deadline if mentioned
- apply_url: Application URL if different from the page URL

Job Posting Text:
${truncatedText}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
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
    let extractedData: ExtractedJob;
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

    // Use provided URL as fallback for apply_url
    if (!extractedData.apply_url) {
      extractedData.apply_url = url;
    }

    console.log('Successfully extracted job data');

    return jsonResponse({ success: true, data: extractedData });

  } catch (error) {
    console.error('Job autofill error:', error);
    return jsonResponse({
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    });
  }
});
