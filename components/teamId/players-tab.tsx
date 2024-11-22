"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ManagePlayerRole } from "./manage-player-role";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/hooks/use-user";
import { usePermissions } from "@/hooks/use-permissions";

type Team = Database["public"]["Tables"]["teams"]["Row"];

interface PlayersTabProps {
  team: Team;
}

type TeamPlayer = {
  id: string;
  user_id: string | null;
  team_id: string;
  jersey_number: string | null;
  position: Database["public"]["Enums"]["player_position_enum"] | null;
  status: "active" | "inactive" | "suspended" | null;
  created_at: string | null;
  updated_at: string | null;
  join_date: string | null;
  leave_date: string | null;
  league_id: string | null;
  role: string | null;
  users: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    role: Database["public"]["Enums"]["user_role"] | null;
  } | null;
  team_permissions?: TeamOfficial[];
};

type TeamOfficial = {
  id: string;
  user_id: string | null;
  permission_type: string;
  users: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    role: Database["public"]["Enums"]["user_role"] | null;
  };
};

export const PlayersTab: React.FC<PlayersTabProps> = ({ team }) => {
  const [players, setPlayers] = useState<TeamPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, userRoles, isAdmin, isSecretary, isCaptain } = useUser();
  const { hasPermission } = usePermissions();
  const supabase = createClientComponentClient<Database>();
  const initialLoadComplete = useRef(false);

  const canManagePlayers = useMemo(() => {
    if (!user) return false;
    return isAdmin || isSecretary || isCaptain || hasPermission("team_captain") || hasPermission("team_secretary");
  }, [user, isAdmin, isSecretary, isCaptain, hasPermission]);

  // Sort players by name
  const sortPlayers = useCallback((players: TeamPlayer[]) => {
    return [...players].sort((a, b) => {
      const nameA = `${a.users?.first_name || ''} ${a.users?.last_name || ''}`.trim().toLowerCase();
      const nameB = `${b.users?.first_name || ''} ${b.users?.last_name || ''}`.trim().toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, []);

  // Load team data function
  const loadTeamData = useCallback(async () => {
    if (!team.id || isLoading) return;

    try {
      setIsLoading(true);

      // First, get all team permissions (officials)
      const { data: officialsData, error: officialsError } = await supabase
        .from("team_permissions")
        .select(
          `
          id,
          user_id,
          permission_type,
          users!inner (
            id,
            first_name,
            last_name,
            email,
            role
          )
        `
        )
        .eq("team_id", team.id);

      if (officialsError) throw officialsError;

      // Then get all team players
      const { data: playersData, error: playersError } = await supabase
        .from("team_players")
        .select(
          `
          id,
          user_id,
          jersey_number,
          position,
          status,
          created_at,
          team_id,
          users!inner (
            id,
            first_name,
            last_name,
            email,
            role
          )
        `
        )
        .eq("team_id", team.id);

      if (playersError) throw playersError;

      // Transform and combine the data
      const allPlayers = [
        ...(officialsData.map((official) => ({
          ...(playersData.find((p) => p.user_id === official.user_id) || {
            id: official.id,
            user_id: official.user_id,
            team_id: team.id,
            jersey_number: null,
            position: "player",
            status: "active",
            created_at: null,
            updated_at: null,
            join_date: null,
            leave_date: null,
            league_id: null,
            role: null,
          }),
          users: official.users,
          team_permissions: [official],
        })) as TeamPlayer[]),
        ...(playersData
          .filter((player) => !officialsData.some((o) => o.user_id === player.user_id))
          .map((player) => ({
            ...player,
            team_permissions: [],
            updated_at: null,
            join_date: null,
            leave_date: null,
            league_id: null,
            role: null,
          })) as TeamPlayer[]),
      ];
      setPlayers(sortPlayers(allPlayers));
    } catch (error) {
      console.error("Error loading team data:", error);
      setPlayers([]);
    } finally {
      setIsLoading(false);
    }
  }, [team.id, supabase]);

  // Load data only on mount or when team changes
  useEffect(() => {
    if (!initialLoadComplete.current) {
      loadTeamData();
      initialLoadComplete.current = true;
    }
  }, [team.id]);

  // Get the player's team role (not RBAC role)
  const getTeamRole = (player: TeamPlayer) => {
    // Check if player has a team permission
    const teamPermission = player.team_permissions?.find((p) => p.user_id === player.user_id);
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

  // Add event listener for refresh
  useEffect(() => {
    const element = document.querySelector('[data-tab="players"]');
    if (!element) return;

    const handleRefresh = () => {
      loadTeamData();
    };

    element.addEventListener("refreshPlayers", handleRefresh);

    return () => {
      element.removeEventListener("refreshPlayers", handleRefresh);
    };
  }, [loadTeamData]);

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
            {canManagePlayers && <TableHead>User Role</TableHead>}
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
                {canManagePlayers && <TableCell>{renderRoleBadge(player.users?.role || "player")}</TableCell>}
                {canManagePlayers && (
                  <TableCell>
                    <ManagePlayerRole
                      teamId={team.id}
                      playerId={player.id}
                      userId={player.user_id || ""}
                      currentRole={player.position || "player"}
                      onRoleUpdated={loadTeamData}
                      isOfficial={player.team_permissions?.some(
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
