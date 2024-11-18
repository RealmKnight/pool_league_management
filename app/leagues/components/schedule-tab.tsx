"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LoadingState } from "./loading-state";
import { ErrorState } from "./error-state";
import { generateSchedule, type WeekSchedule } from "../utils/schedule-generator";
import { format } from "date-fns";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";
import type { League } from "../types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface ScheduleTabProps {
  league: League;
}

interface TeamMapping {
  [placeholder: string]: {
    name: string;
    venue: string | null;
  };
}

interface Match {
  match_date: string;
  home_team_id: string;
  away_team_id: string;
  league_id: string;
  season_id: string;
  status: "scheduled" | "completed" | "cancelled";
  week: number;
  venue: string | null;
}

export function ScheduleTab({ league }: ScheduleTabProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<WeekSchedule[]>([]);
  const [teamMapping, setTeamMapping] = useState<TeamMapping>({});
  const [teamCount, setTeamCount] = useState(0);
  const supabase = createClientComponentClient<Database>();
  const { toast } = useToast();

  // Fetch team count whenever the league changes
  useEffect(() => {
    const fetchTeamCount = async () => {
      const { count, error } = await supabase
        .from("teams")
        .select("*", { count: "exact", head: true })
        .eq("league_id", league.id)
        .eq("status", "active");

      if (error) {
        console.error("Error fetching team count:", error);
        return;
      }

      setTeamCount(count || 0);
    };

    fetchTeamCount();
  }, [league.id, supabase]);

  // Set up real-time subscription for team changes
  useEffect(() => {
    const channel = supabase
      .channel("teams_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "teams",
          filter: `league_id=eq.${league.id}`,
        },
        () => {
          fetchTeamsAndGenerateSchedule();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [league.id]);

  // Fetch assigned teams and generate schedule
  const fetchTeamsAndGenerateSchedule = async () => {
    try {
      setLoading(true);
      // Fetch teams assigned to this league with their venues
      const { data: teams, error: teamsError } = await supabase
        .from("teams")
        .select("name, home_venue")
        .eq("league_id", league.id)
        .order("name");

      if (teamsError) throw teamsError;

      // Create mapping from placeholder to real team names and venues
      const mapping: TeamMapping = {};
      teams?.forEach((team, index) => {
        mapping[`Team ${String.fromCharCode(65 + index)}`] = {
          name: team.name,
          venue: team.home_venue,
        };
      });

      setTeamMapping(mapping);

      // Generate schedule
      const generatedSchedule = generateSchedule(league);
      setSchedule(generatedSchedule);
      setError(null);
    } catch (err) {
      console.error("Error in fetchTeamsAndGenerateSchedule:", err);
      setError("Failed to generate schedule");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchTeamsAndGenerateSchedule();
  }, [league]);

  // Helper function to display team name (real or placeholder)
  const displayTeamName = (placeholderName: string) => {
    return teamMapping[placeholderName]?.name || placeholderName;
  };

  // Helper function to get team venue
  const getTeamVenue = (placeholderName: string) => {
    return teamMapping[placeholderName]?.venue || "TBD";
  };

  // Helper function to format the time from 24h to 12h with AM/PM
  const formatTime = (time: string): string => {
    const [hours] = time.split(":");
    const hour = parseInt(hours, 10);
    return `${hour > 12 ? hour - 12 : hour}${hour >= 12 ? "PM" : "AM"}`;
  };

  // Helper function to get schedule time for a given day
  const getScheduleTime = (date: Date): string => {
    const dayName = format(date, "EEEE");
    const schedulePreferences = league.schedule as {
      type: string;
      days: string[];
      start_time: string;
    };

    // For single_day type, we just use the start_time directly if the day matches
    if (schedulePreferences.type === "single_day") {
      if (schedulePreferences.days.includes(dayName)) {
        return formatTime(schedulePreferences.start_time);
      }
    }

    // For multiple_days type, find the matching day's schedule
    if (schedulePreferences.type === "multiple_days") {
      const daySchedule = (schedulePreferences.days as Array<{ day: string; start_time: string }>).find(
        (schedule) => schedule.day === dayName
      );

      if (daySchedule) {
        return formatTime(daySchedule.start_time);
      }
    }

    // If we have a start_time but no specific day matching, use the default start_time
    if (schedulePreferences.start_time) {
      return formatTime(schedulePreferences.start_time);
    }

    return "TBD";
  };

  // Helper function to format the full date and time
  const formatMatchDateTime = (matchDate: string): string => {
    const date = new Date(matchDate);
    const dayName = format(date, "EEEE");
    const monthDay = format(date, "MMM d");
    const time = getScheduleTime(date);

    return `${dayName}, ${monthDay} @ ${time}`;
  };

  const generateAndSaveSchedule = async () => {
    try {
      setLoading(true);

      // 1. First get or create a season
      const { data: existingSeason, error: seasonError } = await supabase
        .from("seasons")
        .select("id")
        .eq("league_id", league.id)
        .eq("status", "active")
        .single();

      let seasonId;

      if (seasonError || !existingSeason) {
        // Create a new season if none exists
        const { data: newSeason, error: createSeasonError } = await supabase
          .from("seasons")
          .insert({
            league_id: league.id,
            name: `Season ${new Date().getFullYear()}`,
            status: "active",
            start_date: league.season_start || new Date().toISOString(),
            end_date: league.season_end || null,
          })
          .select("id")
          .single();

        if (createSeasonError) throw createSeasonError;
        seasonId = newSeason.id;
      } else {
        seasonId = existingSeason.id;
      }

      // 2. Fetch teams
      const { data: teams, error: teamsError } = await supabase
        .from("teams")
        .select("id, name, home_venue")
        .eq("league_id", league.id)
        .order("name");

      if (teamsError) throw teamsError;
      if (!teams?.length) throw new Error("No teams found in league");

      // 3. Generate schedule
      const generatedSchedule = generateSchedule(league);

      // 4. Create matches records
      const matchesData: Match[] = generatedSchedule.flatMap((week) =>
        week.matches.map((match) => {
          const homeTeamIndex = parseInt(match.homeTeam.replace("Team ", "").charCodeAt(0) - 65 + "");
          const awayTeamIndex = parseInt(match.awayTeam.replace("Team ", "").charCodeAt(0) - 65 + "");

          const homeTeam = teams[homeTeamIndex];
          const awayTeam = teams[awayTeamIndex];

          if (!homeTeam || !awayTeam) {
            console.error("Team not found:", { homeTeamIndex, awayTeamIndex, teams });
            throw new Error("Failed to map teams to schedule");
          }

          return {
            week: week.week,
            match_date: match.matchDate,
            home_team_id: homeTeam.id,
            away_team_id: awayTeam.id,
            league_id: league.id,
            season_id: seasonId,
            status: "scheduled" as const,
            venue: homeTeam.home_venue,
          };
        })
      );

      if (matchesData.length === 0) {
        throw new Error("No matches generated");
      }

      // 5. Delete existing matches for this league and season
      const { error: deleteError } = await supabase
        .from("matches")
        .delete()
        .eq("league_id", league.id)
        .eq("season_id", seasonId);

      if (deleteError) throw deleteError;

      // 6. Insert new matches
      const { error: insertError } = await supabase.from("matches").insert(matchesData);

      if (insertError) {
        console.error("Insert error:", insertError);
        throw insertError;
      }

      // 7. Refresh the display
      await fetchTeamsAndGenerateSchedule();

      // 8. Show success message
      toast({
        title: "Schedule Generated",
        description: "The league schedule has been created successfully.",
      });
    } catch (err) {
      console.error("Error generating schedule:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to generate schedule. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const isScheduleGenerationAllowed = () => {
    // Check if we have all required teams
    if (teamCount < league.team_count) {
      return {
        allowed: false,
        message: `Need ${league.team_count - teamCount} more team${
          league.team_count - teamCount === 1 ? "" : "s"
        } to generate schedule`,
      };
    }

    // Check if we have season dates set
    if (!league.season_start || !league.season_end) {
      return {
        allowed: false,
        message: "League season dates must be set before generating schedule",
      };
    }

    return { allowed: true, message: "" };
  };

  const scheduleStatus = isScheduleGenerationAllowed();

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Schedule</CardTitle>
        <div className="flex items-center gap-x-4">
          {!scheduleStatus.allowed && <span className="text-sm text-muted-foreground">{scheduleStatus.message}</span>}
          <Button onClick={generateAndSaveSchedule} disabled={loading || !scheduleStatus.allowed}>
            Generate Schedule
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {schedule.length === 0 ? (
          <div className="flex flex-col gap-y-4">
            <div className="text-sm text-muted-foreground">No matches scheduled yet</div>
            {teamCount > 0 && (
              <div className="text-sm">
                Teams registered: {teamCount} / {league.team_count}
              </div>
            )}
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {schedule.map((week) => (
              <AccordionItem key={week.week} value={`week-${week.week}`}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-x-2">
                    <span className="font-medium">Week {week.week}</span>
                    <span className="text-sm text-muted-foreground">({format(new Date(week.matchDate), "MMM d")})</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-4">
                    {week.byeTeam && (
                      <div className="mb-4 text-sm text-muted-foreground italic">
                        BYE Week: {displayTeamName(week.byeTeam)}
                      </div>
                    )}
                    <div className="flex flex-row gap-y-2 justify-between">
                      <div className="text-sm font-medium">Matches</div>
                      <div className="text-sm font-medium">Home Team ↔ Away Team</div>
                      <div className="text-sm font-medium">Venue</div>
                    </div>
                    {week.matches.map((match, matchIndex) => (
                      <div
                        key={matchIndex}
                        className="flex items-center justify-between border-b border-border last:border-0 pb-4 last:pb-0"
                      >
                        <span className="text-sm text-muted-foreground">{formatMatchDateTime(match.matchDate)}</span>
                        <div className="flex items-center gap-x-2">
                          <span
                            className={`text-sm ${
                              teamMapping[match.homeTeam] ? "font-medium" : "italic text-muted-foreground"
                            }`}
                          >
                            {displayTeamName(match.homeTeam)}
                          </span>
                          <span className="text-sm text-muted-foreground">vs</span>
                          <span
                            className={`text-sm ${
                              teamMapping[match.awayTeam] ? "font-medium" : "italic text-muted-foreground"
                            }`}
                          >
                            {displayTeamName(match.awayTeam)}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">{getTeamVenue(match.homeTeam)}</span>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
