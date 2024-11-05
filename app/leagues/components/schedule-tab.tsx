"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "./loading-state";
import { ErrorState } from "./error-state";
import type { League } from "../types";

interface ScheduleTabProps {
  league: League;
}

export function ScheduleTab({ league }: ScheduleTabProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Implement schedule loading logic here
    setLoading(false);
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Schedule content will go here */}
          <div className="text-sm text-muted-foreground">No matches scheduled yet</div>
        </div>
      </CardContent>
    </Card>
  );
}
