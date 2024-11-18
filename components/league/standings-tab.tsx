"use client";

import { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";

interface StandingsTabProps {
  leagueId: string;
}

interface TeamStats {
  id: string;
  team_id: string;
  matches_played: number | null;
  wins: number | null;
  losses: number | null;
  draws: number | null;
  points: number | null;
  goals_for: number | null;
  goals_against: number | null;
  team: {
    name: string;
  };
}

export function StandingsTab({ leagueId }: StandingsTabProps) {
  const [statistics, setStatistics] = useState<TeamStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const { data, error } = await supabase
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
          .order("points", { ascending: false });

        if (error) throw error;
        setStatistics(data as TeamStats[]);
      } catch (error) {
        console.error("Error fetching statistics:", error);
        setError("Failed to load standings");
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [leagueId, supabase]);

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Position</TableHead>
          <TableHead>Team</TableHead>
          <TableHead>Played</TableHead>
          <TableHead>Won</TableHead>
          <TableHead>Drawn</TableHead>
          <TableHead>Lost</TableHead>
          <TableHead>GF</TableHead>
          <TableHead>GA</TableHead>
          <TableHead>Points</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {statistics.map((stat, index) => (
          <TableRow key={stat.id}>
            <TableCell>{index + 1}</TableCell>
            <TableCell>{stat.team.name}</TableCell>
            <TableCell>{stat.matches_played || 0}</TableCell>
            <TableCell>{stat.wins || 0}</TableCell>
            <TableCell>{stat.draws || 0}</TableCell>
            <TableCell>{stat.losses || 0}</TableCell>
            <TableCell>{stat.goals_for || 0}</TableCell>
            <TableCell>{stat.goals_against || 0}</TableCell>
            <TableCell>{stat.points || 0}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
