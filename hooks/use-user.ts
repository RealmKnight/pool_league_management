import { useEffect, useState, useRef } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";

type UserWithRole = Database["public"]["Tables"]["users"]["Row"] & {
  role: Database["public"]["Enums"]["user_role"];
};

type UserRole = Database["public"]["Enums"]["user_role"];

const ROLE_HIERARCHY = {
  superuser: ["league_admin", "league_secretary", "team_captain", "team_secretary", "player"],
  league_admin: ["league_secretary", "team_captain", "team_secretary", "player"],
  league_secretary: ["team_secretary", "player"],
  team_captain: ["player"],
  team_secretary: ["player"],
  player: [],
} as const;

export function useUser() {
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient<Database>();
  const fetchedRef = useRef(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user?.id || fetchedRef.current) {
          setLoading(false);
          return;
        }

        // Get user data with role in a single query
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*, role")
          .eq("id", session.user.id)
          .single();

        if (userError) throw userError;

        // Set user data
        setUser(userData as UserWithRole);

        // Calculate inherited roles
        const baseRole = userData.role as keyof typeof ROLE_HIERARCHY;
        const inheritedRoles = ROLE_HIERARCHY[baseRole] || [];
        const allRoles = [baseRole, ...inheritedRoles] as UserRole[];

        setUserRoles(allRoles);
        fetchedRef.current = true;
      } catch (error) {
        console.error("Error fetching user:", error);
        // Set default role if there's an error
        setUserRoles(["player"]);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setUserRoles([]);
        fetchedRef.current = false;
      } else if (event === "SIGNED_IN") {
        fetchUser();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return {
    user,
    userRoles,
    loading,
    isAdmin: userRoles.includes("league_admin") || userRoles.includes("superuser"),
    isSecretary: userRoles.includes("league_secretary"),
    isCaptain: userRoles.includes("team_captain"),
    isTeamSecretary: userRoles.includes("team_secretary"),
  };
}
