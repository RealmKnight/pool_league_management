import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "./database.types";

// Define the role type explicitly since it's not in the generated types yet
type UserRole = "superuser" | "league_admin" | "league_secretary" | "team_captain" | "team_secretary" | "player";

export const authService = {
  async signUp(email: string, password: string) {
    try {
      console.log("Attempting signup...");
      const supabase = createClientComponentClient<Database>();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        console.error("Auth signup error:", authError);
        return { data: null, error: authError };
      }

      if (!authData.user) {
        return {
          data: null,
          error: new Error("User creation failed"),
        };
      }

      try {
        // Create the public profile with the default role
        const { error: profileError } = await supabase.from("users").upsert(
          {
            id: authData.user.id,
            email: email,
            full_name: email.split("@")[0],
            role: "player" as UserRole,
            created_at: new Date().toISOString(),
          },
          {
            onConflict: "id",
          }
        );

        if (profileError) {
          console.error("Profile creation error:", profileError);
          return {
            data: authData,
            error: new Error("Account created but profile setup failed"),
          };
        }

        return { data: authData, error: null };
      } catch (profileErr) {
        console.error("Profile creation exception:", profileErr);
        return {
          data: authData,
          error: new Error("Account created but profile setup failed"),
        };
      }
    } catch (err) {
      console.error("Signup exception:", err);
      return {
        data: null,
        error: new Error("Unable to connect to authentication service"),
      };
    }
  },

  async signIn(email: string, password: string) {
    try {
      const supabase = createClientComponentClient<Database>();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Signin error:", error);
      }

      return { data, error };
    } catch (err) {
      console.error("Signin exception:", err);
      return {
        data: null,
        error: new Error("Failed to connect to authentication service"),
      };
    }
  },

  async signOut() {
    const supabase = createClientComponentClient<Database>();
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async resetPassword(email: string) {
    const supabase = createClientComponentClient<Database>();
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { data, error };
  },

  async updatePassword(newPassword: string) {
    const supabase = createClientComponentClient<Database>();
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { data, error };
  },
};
