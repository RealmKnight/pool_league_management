import React, { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Match {
  id: string;
  match_date: string;
  venue: string | null;
  home_team_score: number | null;
  away_team_score: number | null;
  status: string | null;
  home_team: { name: string } | null;
  away_team: { name: string } | null;
}

interface ScheduleTabProps {
  teamId: string;
}

export const ScheduleTab: React.FC<ScheduleTabProps> = ({ teamId }) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const { data, error } = await supabase
          .from("matches")
          .select(
            `
            *,
            home_team:home_team_id(name),
            away_team:away_team_id(name)
          `
          )
          .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
          .order("match_date", { ascending: true });

        if (error) throw error;
        setMatches(data as Match[]);
      } catch (error) {
        console.error("Error fetching matches:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [teamId, supabase]);

  if (loading) return <div>Loading schedule...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Match Schedule</h2>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Home Team</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Away Team</TableHead>
            <TableHead>Venue</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map((match) => (
            <TableRow key={match.id}>
              <TableCell>{new Date(match.match_date).toLocaleDateString()}</TableCell>
              <TableCell>{match.home_team?.name}</TableCell>
              <TableCell>
                {match.home_team_score !== null && match.away_team_score !== null
                  ? `${match.home_team_score} - ${match.away_team_score}`
                  : "TBD"}
              </TableCell>
              <TableCell>{match.away_team?.name}</TableCell>
              <TableCell>{match.venue || "TBD"}</TableCell>
              <TableCell>{match.status || "Scheduled"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
