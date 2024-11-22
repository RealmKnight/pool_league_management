"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CreateSeasonDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  leagueId: string;
}

export function CreateSeasonDialog({
  isOpen,
  onOpenChange,
  onSuccess,
  leagueId,
}: CreateSeasonDialogProps) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();
  const supabase = createClientComponentClient<Database>();

  const handleSave = async () => {
    if (!name || !startDate || !endDate) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (endDate < startDate) {
      toast({
        title: "Error",
        description: "End date must be after start date",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      // Check if there are any active seasons
      const { data: activeSeasons } = await supabase
        .from("seasons")
        .select("id")
        .eq("league_id", leagueId)
        .eq("status", "active");

      // Set status to active only if there are no active seasons
      const status = !activeSeasons || activeSeasons.length === 0 ? "active" : "pending";

      // Create the new season
      const { data: newSeason, error: seasonError } = await supabase
        .from("seasons")
        .insert({
          league_id: leagueId,
          name,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          status,
        })
        .select()
        .single();

      if (seasonError) throw seasonError;

      // Get all teams in the league
      const { data: teams, error: teamsError } = await supabase
        .from("teams")
        .select("id")
        .eq("league_id", leagueId);

      if (teamsError) throw teamsError;

      // Create team statistics records for all teams
      const teamStats = teams.map((team) => ({
        league_id: leagueId,
        team_id: team.id,
        season_id: newSeason.id,
        matches_played: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        goals_for: 0,
        goals_against: 0,
        points: 0,
      }));

      if (teamStats.length > 0) {
        const { error: statsError } = await supabase
          .from("team_statistics")
          .insert(teamStats);

        if (statsError) throw statsError;
      }

      toast({
        title: "Success",
        description: "Season created successfully",
      });

      onSuccess();
      onOpenChange(false);
      setName("");
      setStartDate(undefined);
      setEndDate(undefined);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to create season",
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
          <DialogTitle>Create New Season</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Season Name</Label>
            <Input
              id="name"
              placeholder="e.g., Season 1, Summer 2024, etc."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            Create Season
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
