import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";

export function useUser() {
  const supabase = createClientComponentClient<Database>();
  const [user, setUser] = useState<any>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserAndRoles() {
      try {
        // Get current user
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();

        if (!currentUser) {
          setLoading(false);
          return;
        }

        // Fetch user permissions from league_permissions table
        const { data: leaguePermissions, error: leagueError } = await supabase
          .from("league_permissions")
          .select("permission_type")
          .eq("user_id", currentUser.id);

        if (leagueError) throw leagueError;

        // Convert permissions to roles
        const roles = leaguePermissions?.map((p) => p.permission_type) || [];

        // Add superuser if user has the role in their metadata
        if (currentUser.user_metadata?.role === "superuser") {
          roles.push("superuser");
        }

        setUser(currentUser);
        setUserRoles(roles);
      } catch (error) {
        console.error("Error fetching user and roles:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserAndRoles();
  }, [supabase]);

  return { user, userRoles, loading };
}
