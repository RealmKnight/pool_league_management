"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { PlayerRoleSelect } from "./player-role-select";
import type { Database } from "@/lib/database.types";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";

type PlayerPosition = Database["public"]["Enums"]["player_position_enum"];

interface ManagePlayerRoleProps {
  teamId: string;
  playerId: string;
  currentRole: PlayerPosition;
  onRoleUpdated?: () => void;
}

export function ManagePlayerRole({ teamId, playerId, currentRole, onRoleUpdated }: ManagePlayerRoleProps) {
  const [role, setRole] = useState<PlayerPosition>(currentRole);
  const [isUpdating, setIsUpdating] = useState(false);
  const { userRoles } = useUser();
  const { toast } = useToast();
  const supabase = createClientComponentClient<Database>();

  // Check if user can assign admin roles
  const canAssignAdminRoles = userRoles?.some((role) => role === "superuser" || role === "league_admin");

  const handleRoleChange = async (newRole: PlayerPosition) => {
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

  return <PlayerRoleSelect value={role} onChange={handleRoleChange} showAdminRoles={canAssignAdminRoles} />;
}
