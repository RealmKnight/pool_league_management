"use client";

import React, { useState, useEffect } from "react";
import type { Team } from "@/app/teams/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ManagePlayerRole } from "./manage-player-role";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/hooks/use-user";

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
  const { user, userRoles } = useUser();

  const canManagePlayers = () => {
    if (!user || !userRoles) return false;

    if (userRoles.some((role) => ["superuser", "league_admin", "league_secretary"].includes(role))) {
      return true;
    }

    return (
      team.team_permissions?.some(
        (permission) =>
          permission.user_id === user.id && ["team_captain", "team_secretary"].includes(permission.permission_type)
      ) ?? false
    );
  };

  const sortPlayers = (players: TeamPlayer[]) => {
    return players.sort((a, b) => {
      // Get team roles for both players
      const roleA = getTeamRole(a);
      const roleB = getTeamRole(b);

      // Define role priority (only team roles, not RBAC roles)
      const rolePriority: { [key: string]: number } = {
        team_captain: 1,
        team_secretary: 2,
        player: 3,
        substitute: 4,
        reserve: 5,
      };

      // Get priority for each role (default to highest number if role not found)
      const priorityA = rolePriority[roleA || ""] || 999;
      const priorityB = rolePriority[roleB || ""] || 999;

      // Sort by role priority first
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // If roles are the same, sort by name
      const nameA = `${a.users?.first_name} ${a.users?.last_name}`.toLowerCase();
      const nameB = `${b.users?.first_name} ${b.users?.last_name}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  };

  // Initial load and update when team changes
  useEffect(() => {
    const loadTeamMembers = async () => {
      try {
        // Fetch team officials first
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
          .eq("team_id", team.id);

        if (playersError) throw playersError;

        // Sort the players before setting state
        const sortedPlayers = sortPlayers(playersData as TeamPlayer[]);
        setPlayers(sortedPlayers);
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
        .eq("team_id", team.id);

      if (error) throw error;

      // Sort the players before setting state
      const sortedPlayers = sortPlayers(data as TeamPlayer[]);
      setPlayers(sortedPlayers);
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

  // Get the player's team role (not RBAC role)
  const getTeamRole = (player: TeamPlayer) => {
    // Check if player has a team permission
    const teamPermission = team.team_permissions?.find((p) => p.user_id === player.user_id);
    if (teamPermission) {
      return teamPermission.permission_type;
    }
    // Return their position if no special team role
    return player.position || "player";
  };

  const renderRoleBadge = (role: string) => {
    const badgeVariant =
      role === "team_captain"
        ? "default"
        : role === "team_secretary"
        ? "secondary"
        : role === "substitute"
        ? "outline"
        : "ghost";

    // Format the display text
    const displayText =
      role === "team_captain"
        ? "Team Captain"
        : role === "team_secretary"
        ? "Team Secretary"
        : role.charAt(0).toUpperCase() + role.slice(1); // Capitalize first letter

    return <Badge variant={badgeVariant}>{displayText}</Badge>;
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
            <TableHead>Team Role</TableHead>
            {canManagePlayers() && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player) => {
            const teamRole = getTeamRole(player);
            return (
              <TableRow key={player.id}>
                <TableCell>
                  {player.users?.first_name} {player.users?.last_name}
                </TableCell>
                <TableCell>{player.jersey_number || "N/A"}</TableCell>
                <TableCell>{player.position || "N/A"}</TableCell>
                <TableCell>{player.status}</TableCell>
                <TableCell>{renderRoleBadge(teamRole)}</TableCell>
                {canManagePlayers() && (
                  <TableCell>
                    <ManagePlayerRole
                      teamId={team.id}
                      playerId={player.id}
                      currentRole={player.position || "player"}
                      onRoleUpdated={refreshPlayers}
                      isOfficial={team.team_permissions?.some(
                        (p) =>
                          p.user_id === player.user_id && ["team_captain", "team_secretary"].includes(p.permission_type)
                      )}
                    />
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
