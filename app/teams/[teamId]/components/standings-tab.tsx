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
        // First get the league_id for the team
        const { data: teamData, error: teamError } = await supabase
          .from("teams")
          .select("league_id")
          .eq("id", teamId)
          .single();

        if (teamError) throw teamError;

        if (teamData?.league_id) {
          // Then get all team statistics for that league
          const { data, error } = await supabase
            .from("team_statistics")
            .select(
              `
              *,
              team:team_id(name)
            `
            )
            .eq("league_id", teamData.league_id)
            .order("points", { ascending: false });

          if (error) throw error;
          setStatistics(data as TeamStats[]);
        }
      } catch (error) {
        console.error("Error fetching statistics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [teamId, supabase]);

  if (loading) return <div>Loading standings...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">League Standings</h2>

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
            <TableRow key={stat.id} className={stat.team_id === teamId ? "bg-muted/50" : ""}>
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
    </div>
  );
};
