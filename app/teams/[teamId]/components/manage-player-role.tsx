"use client";

import { useState, useEffect } from "react";
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

type PlayerPosition = Database["public"]["Enums"]["player_position_enum"] | "remove";

interface ManagePlayerRoleProps {
  teamId: string;
  playerId: string;
  currentRole: PlayerPosition;
  onRoleUpdated?: () => void;
}

export function ManagePlayerRole({ teamId, playerId, currentRole, onRoleUpdated }: ManagePlayerRoleProps) {
  const [role, setRole] = useState<PlayerPosition>(currentRole);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const { user, userRoles } = useUser();
  const { toast } = useToast();
  const supabase = createClientComponentClient<Database>();

  // Check if user can assign admin roles
  const canAssignAdminRoles = userRoles?.some((role) => role === "superuser" || role === "league_admin");

  // Check if user can remove players based on both global roles and team permissions
  const checkPermissions = async () => {
    if (!user) return false;

    // First check global roles
    if (userRoles?.some((role) => ["superuser", "league_admin", "league_secretary"].includes(role))) {
      return true;
    }

    // Then check team-specific permissions
    try {
      const { data, error } = await supabase
        .from("team_permissions")
        .select("permission_type")
        .eq("team_id", teamId)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      return data?.permission_type === "team_captain";
    } catch (error) {
      console.error("Error checking permissions:", error);
      return false;
    }
  };

  // Use effect to check permissions when component mounts
  const [canRemovePlayer, setCanRemovePlayer] = useState(false);

  useEffect(() => {
    checkPermissions().then(setCanRemovePlayer);
  }, [user, userRoles, teamId]);

  const handleRoleChange = async (newRole: PlayerPosition) => {
    if (newRole === "remove") {
      setShowRemoveDialog(true);
      return;
    }

    try {
      setIsUpdating(true);

      const { error } = await supabase.from("team_players").update({ position: newRole }).eq("id", playerId);

      if (error) throw error;

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
