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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { GameFormat, LeagueFormat, LeagueRules, WeekDay, LeagueScheduleType, TimeDisplayFormat } from "@/app/leagues/types";
import { format } from "date-fns";
import { calculateSeasonLength } from "@/utils/schedule-utils";
import { ScheduleSelector } from "./schedule-selector";

interface CreateLeagueDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onLeagueCreate: () => void;
}

export function CreateLeagueDialog({ isOpen, onOpenChange, onLeagueCreate }: CreateLeagueDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [gameFormat, setGameFormat] = useState<GameFormat>(GameFormat["8-Ball"]);
  const [leagueFormat, setLeagueFormat] = useState<LeagueFormat>(LeagueFormat["Round Robin"]);
  const [rules, setRules] = useState<LeagueRules>(LeagueRules.BCA);
  const [numberOfTeams, setNumberOfTeams] = useState<number>(8); // Default to 8 teams
  const [schedule, setSchedule] = useState({
    type: LeagueScheduleType.single_day,
    days: [{ day: WeekDay.MONDAY, startTime: "19:00" }],
    displayFormat: TimeDisplayFormat["12Hour"],
    isHandicapped: false
  });

  const { toast } = useToast();
  const supabase = createClientComponentClient<Database>();

  const handleCreate = async () => {
    try {
      setIsLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to create a league",
          variant: "destructive",
        });
        return;
      }

      // Create the league
      const { data: league, error: leagueError } = await supabase
        .from("leagues")
        .insert({
          name,
          description: null,
          created_by: user.id,
          game_format: gameFormat,
          league_format: leagueFormat,
          rules,
          open_registration: true,
          team_count: numberOfTeams,
          estimated_weeks: numberOfTeams * 2, // Rough estimate
          schedule: {
            type: schedule.type,
            days: schedule.days.map(day => ({
              day: day.day as string,
              startTime: day.startTime
            })),
            displayFormat: schedule.displayFormat as string,
            isHandicapped: schedule.isHandicapped
          },
        })
        .select()
        .single();

      if (leagueError) throw leagueError;

      // Calculate season length based on number of teams
      const { endDate } = calculateSeasonLength(numberOfTeams);
      const startDate = new Date();
      
      const { error: seasonError } = await supabase.from("seasons").insert({
        league_id: league.id,
        name: "Season 1",
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
        status: "active",
      });

      if (seasonError) throw seasonError;

      toast({
        title: "Success",
        description: "League created successfully with initial season",
      });

      onLeagueCreate();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create League</DialogTitle>
          <DialogDescription>Create a new league and become its administrator.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">League Name</Label>
            <Input
              id="name"
              placeholder="Enter league name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="numberOfTeams">Expected Number of Teams</Label>
            <Input
              id="numberOfTeams"
              type="number"
              min={2}
              max={20}
              value={numberOfTeams}
              onChange={(e) => setNumberOfTeams(parseInt(e.target.value, 10))}
            />
            <p className="text-sm text-muted-foreground">
              This will be used to calculate the season length
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gameFormat">Game Format</Label>
            <Select value={gameFormat} onValueChange={(value) => setGameFormat(value as GameFormat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={GameFormat["8-Ball"]}>8-Ball</SelectItem>
                <SelectItem value={GameFormat["9-Ball"]}>9-Ball</SelectItem>
                <SelectItem value={GameFormat["10-Ball"]}>10-Ball</SelectItem>
                <SelectItem value={GameFormat["Straight Pool"]}>Straight Pool</SelectItem>
                <SelectItem value={GameFormat["One Pocket"]}>One Pocket</SelectItem>
                <SelectItem value={GameFormat["Bank Pool"]}>Bank Pool</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="leagueFormat">League Format</Label>
            <Select value={leagueFormat} onValueChange={(value) => setLeagueFormat(value as LeagueFormat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={LeagueFormat["Round Robin"]}>Round Robin</SelectItem>
                <SelectItem value={LeagueFormat["Single Elimination"]}>Single Elimination</SelectItem>
                <SelectItem value={LeagueFormat["Double Elimination"]}>Double Elimination</SelectItem>
                <SelectItem value={LeagueFormat.Swiss}>Swiss</SelectItem>
                <SelectItem value={LeagueFormat["Swiss with Knockouts"]}>Swiss with Knockouts</SelectItem>
                <SelectItem value={LeagueFormat["Single Round Robin"]}>Single Round Robin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Schedule Settings</Label>
            <ScheduleSelector value={schedule} onChange={setSchedule} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rules">Rules</Label>
            <Select value={rules} onValueChange={(value) => setRules(value as LeagueRules)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={LeagueRules.BCA}>BCA Rules</SelectItem>
                <SelectItem value={LeagueRules.APA}>APA Rules</SelectItem>
                <SelectItem value={LeagueRules.Bar}>Bar Rules</SelectItem>
                <SelectItem value={LeagueRules.House}>House Rules</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isHandicapped"
              checked={schedule.isHandicapped}
              onCheckedChange={(checked) => 
                setSchedule(prev => ({ ...prev, isHandicapped: checked as boolean }))
              }
            />
            <Label htmlFor="isHandicapped">Enable Handicap System</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name || isLoading}>
            {isLoading ? "Creating..." : "Create League"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}