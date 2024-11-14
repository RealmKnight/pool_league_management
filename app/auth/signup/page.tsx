"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/lib/database.types";

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClientComponentClient<Database>();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData(event.currentTarget);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      const firstName = formData.get("firstName") as string;
      const lastName = formData.get("lastName") as string;

      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // 2. Create user profile using RPC function with 'player' role
        const { error: profileError } = await supabase.rpc("create_user_profile", {
          user_id: authData.user.id,
          first_name: firstName,
          last_name: lastName,
          email: email,
          user_role: "player",
        });

        if (profileError) throw profileError;

        toast({
          title: "Success",
          description: "Account created successfully. Please check your email for verification.",
        });

        router.push("/auth/verify");
      }
    } catch (error: any) {
      console.error("Signup error details:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create account",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ... rest of the component
}
