"use client";

import { useState } from "react";
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
import type { Team } from "@/app/teams/types";

interface AddTeamDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  leagueId: string;
  availableTeams: Team[];
}

export function AddTeamDialog({
  isOpen,
  onOpenChange,
  onSuccess,
  leagueId,
  availableTeams,
}: AddTeamDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const { toast } = useToast();
  const supabase = createClientComponentClient<Database>();

  const handleSave = async () => {
    if (!selectedTeamId) return;

    try {
      setIsLoading(true);

      const { error } = await supabase.from("league_teams").insert({
        league_id: leagueId,
        team_id: selectedTeamId,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Team added to league successfully",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to add team to league",
        variant: "destructive",
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
          <DialogDescription>Select a team to add to this league.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Select onValueChange={(value) => setSelectedTeamId(value)}>
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
          <Button onClick={handleSave} disabled={!selectedTeamId || isLoading}>
            Add Team
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
