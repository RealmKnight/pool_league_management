import { useState, useCallback } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";
import type { League } from "@/app/leagues/types";
import { useToast } from "@/hooks/use-toast";

export const useLeagues = (userId: string | undefined) => {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [filteredLeagues, setFilteredLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { toast } = useToast();
  const supabase = createClientComponentClient<Database>();

  const loadInitialData = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);

      const [userResponse, leaguesResponse] = await Promise.all([
        supabase.from("users").select("role").eq("id", userId).single(),
        supabase.from("leagues").select(`
          *,
          league_permissions!league_permissions_league_id_fkey (
            id,
            user_id,
            permission_type,
            created_at,
            users!league_permissions_user_id_fkey (
              first_name,
              last_name
            )
          )
        `),
      ]);

      if (userResponse.error) throw userResponse.error;
      if (leaguesResponse.error) throw leaguesResponse.error;

      setUserRole(userResponse.data.role);
      const leaguesData = leaguesResponse.data as League[];
      setLeagues(leaguesData);
      setFilteredLeagues(leaguesData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load data",
      });
    } finally {
      setLoading(false);
    }
  }, [userId, supabase, toast]);

  const handleSearch = useCallback(
    (searchTerm: string) => {
      const filtered = leagues.filter(
        (league) =>
          league.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          league.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredLeagues(filtered);
    },
    [leagues]
  );

  return {
    leagues,
    filteredLeagues,
    loading,
    userRole,
    setFilteredLeagues,
    loadInitialData,
    handleSearch,
  };
};
