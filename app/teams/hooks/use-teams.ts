import { useState, useCallback, useRef } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";
import type { Team } from "../types";
import { useToast } from "@/hooks/use-toast";

export function useTeams(userId: string | undefined) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<Database["public"]["Enums"]["user_role"] | null>(null);
  const supabase = createClientComponentClient<Database>();
  const { toast } = useToast();

  // Add request tracking
  const loadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadInitialData = useCallback(async () => {
    if (!userId || loadingRef.current) {
      return;
    }

    try {
      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();
      loadingRef.current = true;

      // Get user data and teams in parallel
      const [userResponse, teamsResponse] = await Promise.all([
        supabase.from("users").select("role").eq("id", userId).single(),

        supabase
          .from("teams")
          .select(
            `
            *,
            team_permissions!left (
              id,
              user_id,
              permission_type,
              created_at,
              users!left (
                id,
                first_name,
                last_name
              )
            ),
            team_players!left (
              id,
              user_id,
              jersey_number,
              position,
              status,
              users!left (
                id,
                first_name,
                last_name
              )
            ),
            league:league_id!left (
              id,
              name
            )
          `
          )
          .order("name"),
      ]);

      if (userResponse.error) throw userResponse.error;
      if (teamsResponse.error) throw teamsResponse.error;

      setUserRole(userResponse.data?.role);

      if (!teamsResponse.data) {
        setTeams([]);
        setFilteredTeams([]);
        return;
      }

      // Transform the data with null checks
      const transformedTeams = teamsResponse.data.map((team) => ({
        ...team,
        team_permissions:
          team.team_permissions?.filter(Boolean).map((permission) => ({
            ...permission,
            users: permission.users || { first_name: null, last_name: null },
          })) || [],
        team_players:
          team.team_players?.filter(Boolean).map((player) => ({
            ...player,
            users: player.users || { first_name: null, last_name: null },
          })) || [],
        league: team.league || null,
      }));

      setTeams(transformedTeams as Team[]);
      setFilteredTeams(transformedTeams as Team[]);
    } catch (error) {
      console.error("Error loading teams:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load teams data",
      });
      setTeams([]);
      setFilteredTeams([]);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [userId, supabase, toast]);

  const handleSearch = useCallback(
    (searchTerm: string) => {
      const filtered = teams.filter((team) => team.name.toLowerCase().includes(searchTerm.toLowerCase()));
      setFilteredTeams(filtered);
    },
    [teams]
  );

  return {
    teams,
    filteredTeams,
    loading,
    userRole,
    loadInitialData,
    handleSearch,
  };
}
