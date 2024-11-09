"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";
import { format } from "date-fns";
import { LoadingState } from "@/app/leagues/components/loading-state";
import { ErrorState } from "@/app/leagues/components/error-state";

interface ScheduleTabProps {
  teamId: string;
}

interface TeamMatch {
  id: string;
  week: number;
  match_date: string;
  home_team_id: string;
  away_team_id: string;
  home_team: {
    id: string;
    name: string;
    home_venue: string | null;
  };
  away_team: {
    id: string;
    name: string;
  };
  league: {
    id: string;
    name: string;
    schedule: {
      type: "single_day" | "multiple_days";
      days: string[] | Array<{ day: string; start_time: string }>;
      start_time?: string;
    };
  };
}

export function ScheduleTab({ teamId }: ScheduleTabProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<TeamMatch[]>([]);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const fetchTeamSchedule = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("matches")
          .select(
            `
            id,
            week,
            match_date,
            home_team_id,
            away_team_id,
            home_team:teams!matches_home_team_id_fkey (
              id,
              name,
              home_venue
            ),
            away_team:teams!matches_away_team_id_fkey (
              id,
              name
            ),
            league:leagues (
              id,
              name,
              schedule
            )
          `
          )
          .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
          .order("week");

        if (error) {
          console.error("Supabase error:", error);
          throw error;
        }

        if (!data) {
          throw new Error("No data returned");
        }

        setMatches(data as TeamMatch[]);
      } catch (err) {
        console.error("Error fetching team schedule:", err);
        setError(err instanceof Error ? err.message : "Failed to load schedule");
      } finally {
        setLoading(false);
      }
    };

    if (teamId) {
      fetchTeamSchedule();
    }
  }, [teamId, supabase]);

  // Helper function to format the time from 24h to 12h with AM/PM
  const formatTime = (time: string): string => {
    const [hours] = time.split(":");
    const hour = parseInt(hours, 10);
    return `${hour > 12 ? hour - 12 : hour}${hour >= 12 ? "PM" : "AM"}`;
  };

  // Helper function to get schedule time for a given day
  const getScheduleTime = (date: Date, league: TeamMatch["league"]): string => {
    const dayName = format(date, "EEEE");
    const schedulePreferences = league.schedule;

    if (schedulePreferences.type === "single_day") {
      const days = schedulePreferences.days as string[];
      if (days.includes(dayName)) {
        return formatTime(schedulePreferences.start_time || "");
      }
    }

    if (schedulePreferences.type === "multiple_days") {
      const days = schedulePreferences.days as Array<{ day: string; start_time: string }>;
      const daySchedule = days.find((schedule) => schedule.day === dayName);

      if (daySchedule) {
        return formatTime(daySchedule.start_time);
      }
    }

    return schedulePreferences.start_time ? formatTime(schedulePreferences.start_time) : "TBD";
  };

  const formatMatchDateTime = (match: TeamMatch): string => {
    const date = new Date(match.match_date);
    const dayName = format(date, "EEEE");
    const monthDay = format(date, "MMM d");
    const time = getScheduleTime(date, match.league);

    return `${dayName}, ${monthDay} @ ${time}`;
  };

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        {matches.length === 0 ? (
          <div className="text-sm text-muted-foreground">No matches scheduled</div>
        ) : (
          <div className="space-y-6">
            {matches.map((match) => (
              <div key={match.id} className="flex flex-col space-y-2 pb-4 border-b border-border last:border-0">
                <div className="flex items-center gap-x-2">
                  <span className="text-sm font-medium">Week {match.week}</span>
                  <span className="text-sm text-muted-foreground">{formatMatchDateTime(match)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-x-2">
                    <span className={`text-sm ${match.home_team.id === teamId ? "font-bold" : ""}`}>
                      {match.home_team.name}
                    </span>
                    <span className="text-sm text-muted-foreground">vs</span>
                    <span className={`text-sm ${match.away_team.id === teamId ? "font-bold" : ""}`}>
                      {match.away_team.name}
                    </span>
                  </div>
                  {match.home_team.home_venue && (
                    <span className="text-sm text-muted-foreground">@ {match.home_team.home_venue}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
