"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface StandingsTabProps {
  standings: Array<{
    team: {
      name: string;
    };
    played: number;
    won: number;
    lost: number;
    points: number;
  }>;
}

export function StandingsTab({ standings }: StandingsTabProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Team</TableHead>
          <TableHead>Played</TableHead>
          <TableHead>Won</TableHead>
          <TableHead>Lost</TableHead>
          <TableHead>Points</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {standings.map((team, index) => (
          <TableRow key={index}>
            <TableCell>{team.team.name}</TableCell>
            <TableCell>{team.played}</TableCell>
            <TableCell>{team.won}</TableCell>
            <TableCell>{team.lost}</TableCell>
            <TableCell>{team.points}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
