import React, { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
  season: {
    name: string;
  };
}

interface StandingsTabProps {
  teamId: string;
}

export const StandingsTab: React.FC<StandingsTabProps> = ({ teamId }) => {
  const [statistics, setStatistics] = useState<TeamStats[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        // Then get team statistics for just this team
        const { data: statsData, error: statsError } = await supabase
          .from("team_statistics")
          .select(
            `
            *,
            team:team_id(
              id,
              name
            ),
            season:season_id(
              id,
              name
            )
          `
          )
          .eq("team_id", teamId)
          .order("season_id", { ascending: false });

        if (statsError) {
          console.error("Error fetching statistics:", statsError);
          throw statsError;
        }
        setStatistics(statsData as TeamStats[]);
      } catch (error) {
        console.error("Error in fetchStatistics:", error);
      } finally {
        setLoading(false);
      }
    };

    if (teamId) {
      fetchStatistics();
    }
  }, [teamId, supabase]);

  if (loading) return <div>Loading standings...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Team Performance History</h2>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Season</TableHead>
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
          {statistics.map((stat) => (
            <TableRow key={stat.id}>
              <TableCell>{stat.season.name}</TableCell>
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
    </div>
  );
};
