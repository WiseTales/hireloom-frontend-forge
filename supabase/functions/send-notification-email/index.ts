import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  message: string;
  type: "job_update" | "application_status" | "new_message" | "connection_request";
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, message, type }: EmailRequest = await req.json();

    if (!to || !subject || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // In a real implementation, you would send the email using Resend
    // For now, we'll just log the request and return success
    console.log("Email notification:", { to, subject, message, type });

    // Note: To use Resend, you need to add RESEND_API_KEY secret
    // const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    // const emailResponse = await resend.emails.send({...});

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Email notification queued (configure RESEND_API_KEY to send actual emails)"
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error processing email notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
