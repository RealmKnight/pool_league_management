import { useState, useCallback } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";
import type { Team } from "../types";

export function useTeams(userId: string | undefined) {
  const supabase = createClientComponentClient<Database>();
  const [teams, setTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  const loadInitialData = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      // First get the user's role
      const { data: roleData, error: roleError } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();

      if (roleError) throw roleError;
      setUserRole(roleData?.role);

      // Then get teams with their permissions
      const { data, error } = await supabase.from("teams").select(`
          *,
          team_permissions!team_permissions_team_id_fkey (
            id,
            user_id,
            permission_type,
            created_at,
            users:user_id (
              first_name,
              last_name
            )
          )
        `);

      if (error) throw error;

      setTeams(data as unknown as Team[]);
      setFilteredTeams(data as unknown as Team[]);
    } catch (error) {
      console.error("Error loading teams:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase, userId]);

  const handleSearch = (searchTerm: string) => {
    const lowercasedTerm = searchTerm.toLowerCase();
    setFilteredTeams(teams.filter((team) => team.name.toLowerCase().includes(lowercasedTerm)));
  };

  return {
    teams,
    filteredTeams,
    loading,
    userRole,
    loadInitialData,
    handleSearch,
  };
}