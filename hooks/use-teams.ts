import { useState, useCallback } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";
import type { TeamWithRelations } from "@/lib/teams";

export function useTeams(userId: string | undefined) {
  const supabase = createClientComponentClient<Database>();
  const [teams, setTeams] = useState<TeamWithRelations[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<TeamWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
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
          team_permissions (
            id,
            user_id,
            permission_type,
            users (
              id,
              first_name,
              last_name
            )
          )
        `);

      if (error) throw error;

      setTeams(data);
      setFilteredTeams(data);
    } catch (error) {
      console.error("Error loading teams:", error);
      setError(error instanceof Error ? error : new Error('Failed to load teams'));
    } finally {
      setLoading(false);
    }
  }, [userId, supabase]);

  const handleSearch = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) {
      setFilteredTeams(teams);
      return;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = teams.filter((team) => 
      team.name.toLowerCase().includes(lowerSearchTerm)
    );
    setFilteredTeams(filtered);
  }, [teams]);

  return {
    teams,
    filteredTeams,
    loading,
    error,
    userRole,
    loadInitialData,
    handleSearch,
  };
}