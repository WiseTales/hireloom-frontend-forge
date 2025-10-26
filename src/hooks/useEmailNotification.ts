import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type EmailType = "job_update" | "application_status" | "new_message" | "connection_request";

export const useEmailNotification = () => {
  const { toast } = useToast();

  const sendNotification = async (
    to: string,
    subject: string,
    message: string,
    type: EmailType
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "send-notification-email",
        {
          body: { to, subject, message, type },
        }
      );

      if (error) throw error;

      toast({
        title: "Notification sent",
        description: "Email notification has been sent successfully",
      });

      return { success: true, data };
    } catch (error: any) {
      console.error("Failed to send notification:", error);
      toast({
        title: "Failed to send notification",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error };
    }
  };

  return { sendNotification };
};
