
/**
 * Note: This project uses Supabase Auth via the AuthContext.
 * NextAuth patterns are simulated below for compatibility with your requests.
 * The real session data is managed in src/contexts/AuthContext.tsx.
 */

import { supabase } from '@/integrations/supabase/client';

export const authOptions = {
  callbacks: {
    // This logic is implemented in AuthContext.tsx's fetchUserProfile
    async session({ session, user }: any) {
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();

        session.user.id = user.id;
        session.user.companyId = data?.company_id;
      }
      return session;
    }
  }
};
