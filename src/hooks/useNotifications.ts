import { supabase } from '@/integrations/supabase/client';

interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}

export const createNotification = async ({
  userId,
  type,
  title,
  message,
  link,
}: CreateNotificationParams) => {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    message,
    link,
  });

  if (error) {
    console.error('Failed to create notification:', error);
  }
};
