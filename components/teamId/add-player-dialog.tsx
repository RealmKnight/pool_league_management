"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";
import { useToast } from "@/hooks/use-toast";
import { Loader2Icon } from "lucide-react";

interface AddPlayerDialogProps {
  teamId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onPlayerAdded: () => void;
}

type AvailablePlayer = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

export function AddPlayerDialog({ teamId, isOpen, onOpenChange, onPlayerAdded }: AddPlayerDialogProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [availablePlayers, setAvailablePlayers] = useState<AvailablePlayer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    if (!isOpen) return;

    const fetchAvailablePlayers = async () => {
      try {
        setIsLoading(true);

        // Get current team players
        const { data: teamPlayers, error: teamError } = await supabase
          .from("team_players")
          .select("user_id")
          .eq("team_id", teamId);

        if (teamError) throw teamError;

        // Get all users with role 'player'
        const { data: users, error: usersError } = await supabase
          .from("users")
          .select("*")
          .order("first_name", { ascending: true });

        if (usersError) throw usersError;

        // Filter out users who are already on the team
        const teamPlayerIds = teamPlayers.map((p) => p.user_id);
        const availableUsers = users.filter((user) => !teamPlayerIds.includes(user.id));

        setAvailablePlayers(availableUsers);
      } catch (error) {
        console.error("Error fetching available players:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch available players",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailablePlayers();
  }, [isOpen, teamId, supabase, toast]);

  const handleSave = async () => {
    if (!selectedPlayerId) return;

    try {
      setIsLoading(true);

      const { error } = await supabase.from("team_players").insert({
        team_id: teamId,
        user_id: selectedPlayerId,
        status: "active",
        position: "player",
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Player added successfully",
      });

      onPlayerAdded();
      onOpenChange(false);
      setSelectedPlayerId(null);
    } catch (error: any) {
      console.error("Error adding player:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add player",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Player</DialogTitle>
          <DialogDescription>Select a player to add to the team.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Select value={selectedPlayerId || undefined} onValueChange={(value: string) => setSelectedPlayerId(value)}>
            <SelectTrigger>
              <SelectValue placeholder={availablePlayers.length === 0 ? "No available players" : "Select a player"} />
            </SelectTrigger>
            <SelectContent>
              {availablePlayers.map((player) => (
                <SelectItem key={player.id} value={player.id}>
                  {`${player.first_name || ""} ${player.last_name || ""}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!selectedPlayerId || isLoading}>
            {isLoading ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Player"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
