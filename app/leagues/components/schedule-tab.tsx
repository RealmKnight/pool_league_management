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

interface ScheduleTabProps {
  league: League;
}

interface TeamMapping {
  [placeholder: string]: {
    name: string;
    venue: string | null;
  };
}

export function ScheduleTab({ league }: ScheduleTabProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<WeekSchedule[]>([]);
  const [teamMapping, setTeamMapping] = useState<TeamMapping>({});
  const supabase = createClientComponentClient<Database>();

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

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        {schedule.length === 0 ? (
          <div className="text-sm text-muted-foreground">No matches scheduled yet</div>
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
