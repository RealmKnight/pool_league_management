"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "@/lib/database.types";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  League, 
  LeagueFormat, 
  LeagueSchedule, 
  LeagueScheduleType, 
  TimeDisplayFormat, 
  WeekDay 
} from "../types";
import { useSearchParams } from "next/navigation";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { TeamsTab } from "@/components/league/teams-tab";
import { ScheduleTab } from "@/components/league/schedule-tab";
import { StandingsTab } from "@/components/league/standings-tab";
import { SeasonsTab } from "@/components/league/seasons-tab";
import { ManagementTab } from "@/components/league/management-tab";
import { formatLeagueFormat } from "../utils/format-strings";
import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

export default function LeaguePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [league, setLeague] = useState<League | null>(null);
  const [standings, setStandings] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const [leagueRole, setLeagueRole] = useState<string | null>(null);
  const supabase = createClientComponentClient<Database>();
  const activeTab = searchParams.get("tab") || "overview";
  const leagueId = typeof params.leagueId === "string" ? params.leagueId : "";
  const { userRoles } = useUser();

  useEffect(() => {
    const fetchLeague = async () => {
      if (!leagueId) return;

      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setLeagueRole(null);
          return;
        }

        // Fetch league with permissions in a single query
        const { data, error } = await supabase
          .from("leagues")
          .select(`
            *,
            league_permissions!league_permissions_league_id_fkey (
              permission_type,
              users (
                first_name,
                last_name
              )
            )
          `)
          .eq("id", leagueId)
          .single();

        if (error) throw error;

        // Find user's permission for this league
        const userPermission = data.league_permissions?.find(
          (p: any) => p.user_id === user.id
        );

        setLeagueRole(userPermission?.permission_type || null);
        
        // Transform the data to match the League type
        const transformedLeague: League = {
          ...data,
          format: data.league_format as LeagueFormat,
          schedule: {
            type: (data.schedule as any)?.type || LeagueScheduleType.single_day,
            days: Array.isArray((data.schedule as any)?.days) 
              ? (data.schedule as any).days.map((day: any) => ({
                  day: day.day?.toUpperCase() as WeekDay || WeekDay.MONDAY,
                  startTime: day.startTime || "19:00"
                }))
              : [{ 
                  day: WeekDay.MONDAY,
                  startTime: "19:00" 
                }],
            displayFormat: (data.schedule as any)?.displayFormat || TimeDisplayFormat["12Hour"],
            isHandicapped: (data.schedule as any)?.isHandicapped || false
          },
          league_permissions: data.league_permissions.map((p: any) => ({
            ...p,
            users: {
              first_name: p.users?.first_name || null,
              last_name: p.users?.last_name || null
            }
          })),
          // Keep the original timestamp strings
          season_start: data.season_start,
          season_end: data.season_end
        };

        // Validate the dates
        if (transformedLeague.season_start && transformedLeague.season_end) {
          const startDate = new Date(transformedLeague.season_start);
          const endDate = new Date(transformedLeague.season_end);
          
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.error("Invalid dates in league data:", { 
              season_start: transformedLeague.season_start, 
              season_end: transformedLeague.season_end 
            });
            
            // Set default dates if the dates are invalid
            const today = new Date();
            const ninetyDaysFromNow = new Date(today);
            ninetyDaysFromNow.setDate(today.getDate() + 90);
            
            transformedLeague.season_start = today.toISOString();
            transformedLeague.season_end = ninetyDaysFromNow.toISOString();
          }
        } else {
          // Set default dates if no dates are provided
          const today = new Date();
          const ninetyDaysFromNow = new Date(today);
          ninetyDaysFromNow.setDate(today.getDate() + 90);
          
          transformedLeague.season_start = today.toISOString();
          transformedLeague.season_end = ninetyDaysFromNow.toISOString();
        }

        setLeague(transformedLeague);
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
        const { data: activeSeasons, error: seasonError } = await supabase
          .from("seasons")
          .select("id")
          .eq("league_id", leagueId)
          .eq("status", "active");

        if (seasonError) {
          console.error("Error fetching active season:", seasonError);
          return;
        }

        // If there's no active season, just return empty standings
        if (!activeSeasons || activeSeasons.length === 0) {
          setStandings([]);
          return;
        }

        const activeSeason = activeSeasons[0]; // Use the first active season

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

  const canManageLeague = userRoles.includes("superuser") || 
    (leagueRole && ["league_admin", "league_secretary"].includes(leagueRole));

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
          {canManageLeague && (
            <TabsTrigger value="management">Management</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>League Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Format</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatLeagueFormat(league.format)}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Game Format</h3>
                  <p className="text-sm text-muted-foreground">{league.game_format}</p>
                </div>
                <div>
                  <h3 className="font-medium">League Length</h3>
                  <p className="text-sm text-muted-foreground">
                    {league.season_start && format(new Date(league.season_start), "MMM d")} - {league.season_end && format(new Date(league.season_end), "MMM d")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Start time: {league.schedule?.days?.map(day => (
                      <span key={day.day} className="mr-2">
                        {format(new Date(`2000-01-01T${day.startTime}`), 
                          league.schedule?.displayFormat === TimeDisplayFormat["24Hour"] ? "HH:mm" : "h:mm a"
                        )}
                        {league.schedule.type === LeagueScheduleType.multiple_days && ` (${day.day})`}
                      </span>
                    ))}
                  </p>
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
          {standings.length > 0 ? (
            <StandingsTab leagueId={leagueId} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Active Season</CardTitle>
                <CardDescription>There is currently no active season for this league.</CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="seasons">
          <SeasonsTab league={league} userRole={leagueRole} />
        </TabsContent>

        {canManageLeague && (
          <TabsContent value="management">
            <ManagementTab 
              league={league} 
              userRole={userRoles.includes("superuser") ? "superuser" : leagueRole} 
              onUpdate={() => {
                // Refetch league data when updates are made
                const fetchLeague = async () => {
                  if (!leagueId) return;

                  try {
                    // Get current user
                    const { data: { user } } = await supabase.auth.getUser();
                    
                    if (!user) {
                      setLeagueRole(null);
                      return;
                    }

                    // Fetch league with permissions in a single query
                    const { data, error } = await supabase
                      .from("leagues")
                      .select(`
                        *,
                        league_permissions!league_permissions_league_id_fkey (
                          permission_type,
                          users (
                            first_name,
                            last_name
                          )
                        )
                      `)
                      .eq("id", leagueId)
                      .single();

                    if (error) throw error;

                    // Find user's permission for this league
                    const userPermission = data.league_permissions?.find(
                      (p: any) => p.user_id === user.id
                    );

                    setLeagueRole(userPermission?.permission_type || null);
                    
                    // Transform the data to match the League type
                    const transformedLeague: League = {
                      ...data,
                      format: data.league_format as LeagueFormat,
                      schedule: {
                        type: (data.schedule as any)?.type || LeagueScheduleType.single_day,
                        days: Array.isArray((data.schedule as any)?.days) 
                          ? (data.schedule as any).days.map((day: any) => ({
                              day: day.day?.toUpperCase() as WeekDay || WeekDay.MONDAY,
                              startTime: day.startTime || "19:00"
                            }))
                          : [{ 
                              day: WeekDay.MONDAY,
                              startTime: "19:00" 
                            }],
                        displayFormat: (data.schedule as any)?.displayFormat || TimeDisplayFormat["12Hour"],
                        isHandicapped: (data.schedule as any)?.isHandicapped || false
                      },
                      league_permissions: data.league_permissions.map((p: any) => ({
                        ...p,
                        users: {
                          first_name: p.users?.first_name || null,
                          last_name: p.users?.last_name || null
                        }
                      })),
                      // Keep the original timestamp strings
                      season_start: data.season_start,
                      season_end: data.season_end
                    };

                    // Validate the dates
                    if (transformedLeague.season_start && transformedLeague.season_end) {
                      const startDate = new Date(transformedLeague.season_start);
                      const endDate = new Date(transformedLeague.season_end);
                      
                      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                        console.error("Invalid dates in league data:", { 
                          season_start: transformedLeague.season_start, 
                          season_end: transformedLeague.season_end 
                        });
                        
                        // Set default dates if the dates are invalid
                        const today = new Date();
                        const ninetyDaysFromNow = new Date(today);
                        ninetyDaysFromNow.setDate(today.getDate() + 90);
                        
                        transformedLeague.season_start = today.toISOString();
                        transformedLeague.season_end = ninetyDaysFromNow.toISOString();
                      }
                    } else {
                      // Set default dates if no dates are provided
                      const today = new Date();
                      const ninetyDaysFromNow = new Date(today);
                      ninetyDaysFromNow.setDate(today.getDate() + 90);
                      
                      transformedLeague.season_start = today.toISOString();
                      transformedLeague.season_end = ninetyDaysFromNow.toISOString();
                    }

                    setLeague(transformedLeague);
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
              }} 
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
