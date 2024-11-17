"use client";

import { useState, useEffect, useMemo } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { PlayerRoleSelect } from "./player-role-select";
import type { Database } from "@/lib/database.types";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePermissions } from "@/hooks/use-permissions";

type PlayerPosition = Database["public"]["Enums"]["player_position_enum"] | "remove";

interface ManagePlayerRoleProps {
  teamId: string;
  playerId: string;
  userId: string;
  currentRole: PlayerPosition;
  onRoleUpdated?: () => void;
  isOfficial?: boolean;
}

export function ManagePlayerRole({
  teamId,
  playerId,
  userId,
  currentRole,
  onRoleUpdated,
  isOfficial,
}: ManagePlayerRoleProps) {
  const [role, setRole] = useState<PlayerPosition>(currentRole);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const { user, userRoles, isAdmin } = useUser();
  const { toast } = useToast();
  const supabase = createClientComponentClient<Database>();
  const { hasPermission } = usePermissions();

  const canAssignAdminRoles = useMemo(
    () => userRoles?.includes("superuser") || userRoles?.includes("league_admin"),
    [userRoles]
  );

  const canRemovePlayer = useMemo(
    () => hasPermission("team_captain") || canAssignAdminRoles,
    [hasPermission, canAssignAdminRoles]
  );

  const handleRoleChange = async (newRole: PlayerPosition) => {
    if (isOfficial && !isAdmin) {
      toast({
        variant: "destructive",
        title: "Cannot Change Role",
        description: "Only superusers and league admins can modify team officials' roles",
      });
      return;
    }

    if (newRole === "remove") {
      setShowRemoveDialog(true);
      return;
    }

    try {
      setIsUpdating(true);

      const updateRole = async () => {
        if (isOfficial || newRole === "team_captain" || newRole === "team_secretary") {
          await supabase
            .from("team_permissions")
            .delete()
            .eq("team_id", teamId)
            .eq("user_id", userId)
            .in("permission_type", ["team_captain", "team_secretary"]);

          if (newRole === "team_captain" || newRole === "team_secretary") {
            await supabase.from("team_permissions").insert({
              team_id: teamId,
              user_id: userId,
              permission_type: newRole,
            });

            await supabase.from("users").update({ role: newRole }).eq("id", userId);
          } else {
            await supabase.from("users").update({ role: "player" }).eq("id", userId);
          }
        }

        const { error } = await supabase.from("team_players").update({ position: newRole }).eq("id", playerId);

        if (error) throw error;
      };

      await updateRole();

      setRole(newRole);
      onRoleUpdated?.();

      toast({
        title: "Success",
        description: "Player role updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update player role",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemovePlayer = async () => {
    try {
      setIsUpdating(true);

      const { error } = await supabase.from("team_players").delete().eq("id", playerId);

      if (error) throw error;

      onRoleUpdated?.();

      toast({
        title: "Success",
        description: "Player removed from team successfully",
      });
    } catch (error: any) {
      console.error("Error removing player:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to remove player",
      });
    } finally {
      setIsUpdating(false);
      setShowRemoveDialog(false);
    }
  };

  return (
    <>
      <PlayerRoleSelect
        value={role}
        onChange={handleRoleChange}
        showAdminRoles={canAssignAdminRoles}
        canRemovePlayer={canRemovePlayer}
        disabled={isOfficial && !isAdmin}
      />

      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Player</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this player from the team? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemovePlayer} className="bg-destructive hover:bg-destructive/90">
              Remove Player
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
