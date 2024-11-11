"use client";

import React, { useState, useEffect } from "react";
import type { Team } from "@/app/teams/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ManagePlayerRole } from "./manage-player-role";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";

interface PlayersTabProps {
  team: Team;
}

type TeamPlayer = Database["public"]["Tables"]["team_players"]["Row"] & {
  users: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
};

export const PlayersTab: React.FC<PlayersTabProps> = ({ team }) => {
  const [players, setPlayers] = useState<TeamPlayer[]>([]);
  const supabase = createClientComponentClient<Database>();

  // Initial load and update when team changes
  useEffect(() => {
    if (team.team_players) {
      setPlayers(team.team_players as TeamPlayer[]);
    }
  }, [team.team_players]);

  const refreshPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from("teams")
        .select(
          `
          team_players (
            id,
            user_id,
            jersey_number,
            position,
            status,
            users (
              first_name,
              last_name,
              email
            )
          )
        `
        )
        .eq("id", team.id)
        .single();

      if (error) throw error;
      if (data?.team_players) {
        setPlayers(data.team_players as TeamPlayer[]);
      }
    } catch (error) {
      console.error("Error refreshing players:", error);
    }
  };

  // Subscribe to changes in team_players table
  useEffect(() => {
    const channel = supabase
      .channel("team_players_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "team_players",
          filter: `team_id=eq.${team.id}`,
        },
        () => {
          refreshPlayers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [team.id, supabase]);

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
            <TableHead>Role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player) => (
            <TableRow key={player.id}>
              <TableCell>
                {player.users?.first_name} {player.users?.last_name}
              </TableCell>
              <TableCell>{player.jersey_number || "N/A"}</TableCell>
              <TableCell>{player.position || "N/A"}</TableCell>
              <TableCell>{player.status}</TableCell>
              <TableCell>
                <ManagePlayerRole
                  teamId={team.id}
                  playerId={player.id}
                  currentRole={player.position || "player"}
                  onRoleUpdated={refreshPlayers}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
