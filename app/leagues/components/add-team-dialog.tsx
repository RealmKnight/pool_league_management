"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddTeamDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  leagueId: string;
  onSuccess: () => Promise<void>;
}

export function AddTeamDialog({ isOpen, onOpenChange, leagueId, onSuccess }: AddTeamDialogProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [availableTeams, setAvailableTeams] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClientComponentClient<Database>();
  const { toast } = useToast();

  const fetchAvailableTeams = async () => {
    console.log("Fetching available teams...");
    try {
      // First get the league's game format
      const { data: leagueData, error: leagueError } = await supabase
        .from("leagues")
        .select("game_format")
        .eq("id", leagueId)
        .single();

      if (leagueError) throw leagueError;

      // Then get teams matching the format and other criteria
      const { data: availableTeams, error: availableError } = await supabase
        .from("teams")
        .select("id, name, format, status")
        .is("league_id", null)
        .eq("status", "active")
        .order("name");

      console.log("Available teams query result:", { data: availableTeams, error: availableError });

      if (availableError) throw availableError;

      setAvailableTeams(availableTeams || []);
    } catch (error) {
      console.error("Error in fetchAvailableTeams:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load available teams",
      });
    }
  };

  // Add useEffect to monitor isOpen changes
  useEffect(() => {
    if (isOpen) {
      fetchAvailableTeams();
    } else {
      // Clear selection when dialog closes
      setSelectedTeamId("");
    }
  }, [isOpen]);

  const handleAssignTeam = async () => {
    if (!selectedTeamId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a team",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from("teams").update({ league_id: leagueId }).eq("id", selectedTeamId);

      if (error) throw error;

      await onSuccess();
      toast({
        title: "Success",
        description: "Team assigned to league successfully",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error assigning team:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to assign team to league",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Team to League</DialogTitle>
          <DialogDescription>
            {availableTeams.length === 0
              ? "No teams available to add"
              : `${availableTeams.length} team${availableTeams.length === 1 ? "" : "s"} available`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Select onValueChange={setSelectedTeamId} value={selectedTeamId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a team" />
              </SelectTrigger>
              <SelectContent>
                {availableTeams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssignTeam} disabled={isLoading || availableTeams.length === 0}>
            {isLoading ? "Adding..." : "Add Team"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
