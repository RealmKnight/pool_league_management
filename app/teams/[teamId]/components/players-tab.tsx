"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import type { Team } from "@/app/teams/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ManagePlayerRole } from "./manage-player-role";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/hooks/use-user";
import { usePermissions } from "@/hooks/use-permissions";

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
  const { user, userRoles, isAdmin, isSecretary, isCaptain } = useUser();
  const { hasPermission } = usePermissions();
  const supabase = createClientComponentClient<Database>();
  const fetchedRef = useRef(false);

  const canManagePlayers = useMemo(() => {
    if (!user) return false;
    return isAdmin || isSecretary || isCaptain || hasPermission("team_captain") || hasPermission("team_secretary");
  }, [user, isAdmin, isSecretary, isCaptain, hasPermission]);

  useEffect(() => {
    const loadTeamData = async () => {
      if (fetchedRef.current || !team.id) return;

      try {
        const { data: playersData, error: playersError } = await supabase
          .from("team_players")
          .select(
            `
            id,
            user_id,
            jersey_number,
            position,
            status,
            users!inner (
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

        const transformedPlayers =
          playersData?.map((player) => ({
            ...player,
            team_permissions: team.team_permissions?.filter((p) => p.user_id === player.user_id) || [],
          })) || [];

        setPlayers(sortPlayers(transformedPlayers));
        fetchedRef.current = true;
      } catch (error) {
        console.error("Error loading team data:", error);
        setPlayers([]);
      }
    };

    loadTeamData();

    return () => {
      fetchedRef.current = false;
    };
  }, [team.id, team.team_permissions, supabase]);

  const sortPlayers = useCallback((players: TeamPlayer[]) => {
    return players.sort((a, b) => {
      const roleA = getTeamRole(a);
      const roleB = getTeamRole(b);

      const rolePriority: { [key: string]: number } = {
        team_captain: 1,
        team_secretary: 2,
        player: 3,
        substitute: 4,
        reserve: 5,
      };

      const priorityA = rolePriority[roleA || ""] || 999;
      const priorityB = rolePriority[roleB || ""] || 999;

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      return `${a.users?.first_name} ${a.users?.last_name}`.localeCompare(
        `${b.users?.first_name} ${b.users?.last_name}`
      );
    });
  }, []);

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
        : "destructive";

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
            <TableHead>Status</TableHead>
            <TableHead>Team Role</TableHead>
            {canManagePlayers && <TableHead>Actions</TableHead>}
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
                <TableCell>{player.status}</TableCell>
                <TableCell>{renderRoleBadge(teamRole)}</TableCell>
                {canManagePlayers && (
                  <TableCell>
                    <ManagePlayerRole
                      teamId={team.id}
                      playerId={player.id}
                      userId={player.user_id}
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
