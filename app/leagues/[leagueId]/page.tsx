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
import { formatLeagueFormat } from "../utils/format-strings";

export default function LeaguePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [league, setLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient<Database>();
  const activeTab = searchParams.get("tab") || "overview";
  const leagueId = typeof params.leagueId === "string" ? params.leagueId : "";

  useEffect(() => {
    const fetchLeague = async () => {
      if (!leagueId) return;

      try {
        const { data, error } = await supabase
          .from("leagues")
          .select(
            `
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
          `
          )
          .eq("id", leagueId)
          .single();

        if (error) throw error;
        setLeague(data as League);
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

  if (loading) {
    return <LoadingState />;
  }

  if (!league) {
    return <ErrorState message="League not found" />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{league.name}</CardTitle>
          <CardDescription>{league.description}</CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue={activeTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="standings">Standings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>League Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Season:</span>
                  <span>
                    {league.season_start && league.season_end
                      ? `${new Date(league.season_start).toLocaleDateString()} - ${new Date(
                          league.season_end
                        ).toLocaleDateString()}`
                      : "No dates set"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Game Format:</span>
                  <span>{league.game_format}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">League Format:</span>
                  <span>{league.league_format}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Teams:</span>
                  <span>{league.team_count}</span>
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
          <StandingsTab league={league} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
