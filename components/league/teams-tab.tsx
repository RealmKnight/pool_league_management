"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddTeamDialog } from "@/components/league/add-team-dialog";
import type { Team } from "@/app/teams/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TeamsTabProps {
  leagueId: string;
  teams: Team[];
  availableTeams: Team[];
  canManageTeams: boolean;
  onTeamAdded: () => void;
}

export function TeamsTab({ leagueId, teams, availableTeams, canManageTeams, onTeamAdded }: TeamsTabProps) {
  const [addTeamDialog, setAddTeamDialog] = useState({
    isOpen: false,
  });

  return (
    <div className="space-y-8">
      {canManageTeams && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setAddTeamDialog({ isOpen: true })}>
            <Plus className="h-4 w-4 mr-2" />
            Add Team
          </Button>
        </div>
      )}

      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team Name</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead>Captain</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.map((team) => (
              <TableRow key={team.id}>
                <TableCell>{team.name}</TableCell>
                <TableCell>{team.venue?.name || "TBD"}</TableCell>
                <TableCell>
                  {team.captain ? `${team.captain.first_name} ${team.captain.last_name}` : "TBD"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AddTeamDialog
        isOpen={addTeamDialog.isOpen}
        onOpenChange={(open) => setAddTeamDialog({ isOpen: open })}
        onSuccess={onTeamAdded}
        leagueId={leagueId}
        availableTeams={availableTeams}
      />
    </div>
  );
}
