"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LoadingState } from "./loading-state";
import { ErrorState } from "./error-state";
import { generateSchedule, type WeekSchedule } from "../utils/schedule-generator";
import { format } from "date-fns";
import type { League } from "../types";

interface ScheduleTabProps {
  league: League;
}

export function ScheduleTab({ league }: ScheduleTabProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<WeekSchedule[]>([]);

  useEffect(() => {
    try {
      const generatedSchedule = generateSchedule(league);
      setSchedule(generatedSchedule);
      setError(null);
    } catch (err) {
      setError("Failed to generate schedule");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [league]);

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
                      <div className="mb-4 text-sm text-muted-foreground italic">BYE Week: {week.byeTeam}</div>
                    )}
                    {week.matches.map((match, matchIndex) => (
                      <div
                        key={matchIndex}
                        className="flex items-center justify-between border-b border-border last:border-0 pb-4 last:pb-0"
                      >
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(match.matchDate), "EEEE h:mm a")}
                        </span>
                        <div className="flex items-center gap-x-2">
                          <span className="text-sm font-medium">{match.homeTeam}</span>
                          <span className="text-sm text-muted-foreground">vs</span>
                          <span className="text-sm font-medium">{match.awayTeam}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{match.venue}</span>
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
