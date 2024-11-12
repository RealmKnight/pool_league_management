"use client";

import React, { useState, useEffect } from "react";
import type { Team } from "@/app/teams/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ManagePlayerRole } from "./manage-player-role";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";
import { Badge } from "@/components/ui/badge";

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

type TeamOfficial = {
  id: string;
  user_id: string;
  permission_type: string;
  users: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
};

export const PlayersTab: React.FC<PlayersTabProps> = ({ team }) => {
  const [players, setPlayers] = useState<TeamPlayer[]>([]);
  const [officials, setOfficials] = useState<TeamOfficial[]>([]);
  const supabase = createClientComponentClient<Database>();

  // Initial load and update when team changes
  useEffect(() => {
    const loadTeamMembers = async () => {
      try {
        // Fetch team officials (captain and secretary) with their player records
        const { data: officialsData, error: officialsError } = await supabase
          .from("team_permissions")
          .select(
            `
            id,
            user_id,
            permission_type,
            users (
              id,
              first_name,
              last_name,
              email
            )
          `
          )
          .eq("team_id", team.id)
          .in("permission_type", ["team_captain", "team_secretary"]);

        if (officialsError) throw officialsError;

        // Set officials
        setOfficials(officialsData as TeamOfficial[]);

        // Get all players including officials
        const { data: playersData, error: playersError } = await supabase
          .from("team_players")
          .select(
            `
            id,
            user_id,
            jersey_number,
            position,
            status,
            users (
              id,
              first_name,
              last_name,
              email
            )
          `
          )
          .eq("team_id", team.id)
          .order("position");

        if (playersError) throw playersError;

        setPlayers(playersData as TeamPlayer[]);
      } catch (error) {
        console.error("Error loading team members:", error);
      }
    };

    loadTeamMembers();
  }, [team.id, supabase]);

  const refreshPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from("team_players")
        .select(
          `
          id,
          user_id,
          jersey_number,
          position,
          status,
          users (
            id,
            first_name,
            last_name,
            email
          )
        `
        )
        .eq("team_id", team.id)
        .order("position");

      if (error) throw error;
      setPlayers(data as TeamPlayer[]);
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

  const getPlayerRole = (player: TeamPlayer) => {
    const official = officials.find((o) => o.user_id === player.user_id);
    if (official) {
      return official.permission_type === "team_captain" ? "Team Captain" : "Team Secretary";
    }
    return player.position;
  };

  const renderRoleBadge = (role: string) => {
    const badgeVariant =
      role === "Team Captain"
        ? "default"
        : role === "Team Secretary"
        ? "secondary"
        : role === "substitute"
        ? "outline"
        : "ghost";

    return <Badge variant={badgeVariant}>{role}</Badge>;
  };

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
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player) => {
            const playerRole = getPlayerRole(player);
            return (
              <TableRow key={player.id}>
                <TableCell>
                  {player.users?.first_name} {player.users?.last_name}
                </TableCell>
                <TableCell>{player.jersey_number || "N/A"}</TableCell>
                <TableCell>{player.position || "N/A"}</TableCell>
                <TableCell>{player.status}</TableCell>
                <TableCell>{renderRoleBadge(playerRole)}</TableCell>
                <TableCell>
                  <ManagePlayerRole
                    teamId={team.id}
                    playerId={player.id}
                    currentRole={player.position || "player"}
                    onRoleUpdated={refreshPlayers}
                    isOfficial={officials.some((o) => o.user_id === player.user_id)}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
