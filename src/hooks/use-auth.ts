"use client";

import { createClient } from "@/lib/supabase/client";

export function useAuth() {
  const supabase = createClient();

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",

      options: {
        redirectTo:
          `${window.location.origin}/auth/callback`,
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return {
    signInWithGoogle,
    signOut,
  };
}