"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { League } from "../types";
import { useSearchParams } from "next/navigation";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { TeamsTab } from "@/components/league/teams-tab";
import { ScheduleTab } from "@/components/league/schedule-tab";
import { StandingsTab } from "@/components/league/standings-tab";
import { SeasonsTab } from "@/components/league/seasons-tab";
import { formatLeagueFormat } from "../utils/format-strings";

export default function LeaguePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [league, setLeague] = useState<League | null>(null);
  const [standings, setStandings] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const supabase = createClientComponentClient<Database>();
  const activeTab = searchParams.get("tab") || "overview";
  const leagueId = typeof params.leagueId === "string" ? params.leagueId : "";

  useEffect(() => {
    const fetchLeague = async () => {
      if (!leagueId) return;

      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setUserRole(null);
          return;
        }

        // Fetch league with permissions in a single query
        const { data, error } = await supabase
          .from("leagues")
          .select(`
            *,
            league_permissions!league_permissions_league_id_fkey (
              permission_type
            )
          `)
          .eq("id", leagueId)
          .single();

        if (error) throw error;

        // Find user's permission for this league
        const userPermission = data.league_permissions?.find(
          (p: any) => p.user_id === user.id
        );

        setUserRole(userPermission?.permission_type || null);
        setLeague(data);
      } catch (error) {
        console.error("Error fetching league:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load league details",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLeague();
  }, [leagueId, supabase, toast]);

  useEffect(() => {
    const fetchStandings = async () => {
      if (!leagueId) {
        console.log("No league ID available for standings fetch");
        return;
      }

      try {
        // First get the active season for this league
        const { data: activeSeason, error: seasonError } = await supabase
          .from("seasons")
          .select("id")
          .eq("league_id", leagueId)
          .eq("status", "active")
          .single();

        if (seasonError) {
          console.error("Error fetching active season:", seasonError);
          return;
        }

        const { data: stats, error: statsError } = await supabase
          .from("team_statistics")
          .select(
            `
            *,
            team:team_id (
              name
            )
          `
          )
          .eq("league_id", leagueId)
          .eq("season_id", activeSeason.id)
          .order("points", { ascending: false });

        if (statsError) throw statsError;

        const formattedStandings = stats.map(stat => ({
          team: stat.team?.name || "Unknown Team",
          played: stat.matches_played || 0,
          won: stat.wins || 0,
          lost: stat.losses || 0,
          points: stat.points || 0
        }));

        setStandings(formattedStandings);
      } catch (error) {
        console.error("Error fetching standings:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load standings",
        });
      }
    };

    if (leagueId) {
      fetchStandings();
    }
  }, [leagueId, supabase, toast]);

  if (loading) {
    return <LoadingState />;
  }

  if (!league) {
    return <ErrorState message="League not found" />;
  }

  return (
    <div className="container mx-auto py-6">
      <div>
        <h1 className="text-2xl font-bold">{league.name}</h1>
        <p className="text-muted-foreground">{league.description}</p>
      </div>

      <Tabs defaultValue={activeTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="standings">Standings</TabsTrigger>
          <TabsTrigger value="seasons">Seasons</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>League Details</CardTitle>
              <CardDescription>View and manage league information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Format</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatLeagueFormat(league.league_format)}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Game Format</h3>
                  <p className="text-sm text-muted-foreground">{league.game_format}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams">
          <TeamsTab league={league} />
        </TabsContent>

        <TabsContent value="schedule">
          <ScheduleTab league={league} />
        </TabsContent>

        <TabsContent value="standings">
          <StandingsTab leagueId={leagueId} />
        </TabsContent>

        <TabsContent value="seasons">
          <SeasonsTab league={league} userRole={userRole} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
