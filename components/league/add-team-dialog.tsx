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
import type { TeamWithRelations } from "@/lib/teams";

interface AddTeamDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  leagueId: string;
  availableTeams: TeamWithRelations[];
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

      // Get the current season for the league
      const { data: seasons, error: seasonsError } = await supabase
        .from("seasons")
        .select("id")
        .eq("league_id", leagueId)
        .eq("status", "active");

      if (seasonsError) throw seasonsError;

      // Update the team's league_id
      const { error: teamError } = await supabase
        .from("teams")
        .update({ league_id: leagueId })
        .eq("id", selectedTeamId);

      if (teamError) throw teamError;

      // Initialize team statistics for each active season
      if (seasons && seasons.length > 0) {
        const teamStats = seasons.map((season) => ({
          league_id: leagueId,
          team_id: selectedTeamId,
          season_id: season.id,
          matches_played: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          goals_for: 0,
          goals_against: 0,
          points: 0,
        }));

        const { error: statsError } = await supabase
          .from("team_statistics")
          .insert(teamStats);

        if (statsError) {
          // If stats creation fails, rollback by removing the league_id from the team
          await supabase
            .from("teams")
            .update({ league_id: null })
            .eq("id", selectedTeamId);
          throw statsError;
        }
      }

      toast({
        title: "Success",
        description: "Team added to league successfully",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: error.message || "Failed to add team to league",
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
