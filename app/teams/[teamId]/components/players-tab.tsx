import React from "react";
import type { Team } from "@/app/teams/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PlayersTabProps {
  team: Team;
}

export const PlayersTab: React.FC<PlayersTabProps> = ({ team }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Team Players</h2>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Jersey Number</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {team.team_players?.map((player) => (
            <TableRow key={player.id}>
              <TableCell>
                {player.users?.first_name} {player.users?.last_name}
              </TableCell>
              <TableCell>{player.jersey_number || "N/A"}</TableCell>
              <TableCell>{player.position || "N/A"}</TableCell>
              <TableCell>{player.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
