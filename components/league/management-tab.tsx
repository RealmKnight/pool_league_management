"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { League, GameFormat, LeagueFormat, LeagueRules, TimeDisplayFormat, LeagueSchedule } from "@/app/leagues/types";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScheduleSelector } from "./schedule-selector";

interface ManagementTabProps {
  league: League;
  userRole: string | null;
  onUpdate: () => void;
}

export function ManagementTab({ league, userRole, onUpdate }: ManagementTabProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(league.name);
  const [description, setDescription] = useState(league.description || "");
  const [gameFormat, setGameFormat] = useState<GameFormat>(league.game_format as GameFormat);
  const [leagueFormat, setLeagueFormat] = useState<LeagueFormat>(league.league_format as LeagueFormat);
  const [rules, setRules] = useState<LeagueRules>(league.rules as LeagueRules);
  const [schedule, setSchedule] = useState<LeagueSchedule>({
    type: league.schedule.type,
    days: league.schedule.days,
    displayFormat: league.schedule.displayFormat || TimeDisplayFormat["12Hour"],
    isHandicapped: league.schedule.isHandicapped
  });

  const { toast } = useToast();
  const supabase = createClientComponentClient<Database>();

  const handleUpdate = async () => {
    try {
      setIsLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to update the league",
          variant: "destructive",
        });
        return;
      }

      // Update the league
      const { error: leagueError } = await supabase
        .from("leagues")
        .update({
          name,
          description,
          game_format: gameFormat,
          league_format: leagueFormat,
          rules,
          schedule: {
            type: schedule.type,
            days: schedule.days.map(day => ({
              day: day.day as string,
              startTime: day.startTime
            })),
            displayFormat: schedule.displayFormat as string,
            isHandicapped: schedule.isHandicapped
          }
        })
        .eq("id", league.id);

      if (leagueError) throw leagueError;

      toast({
        title: "Success",
        description: "League updated successfully",
      });

      onUpdate();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Something went wrong while updating the league",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!["superuser", "league_admin", "league_secretary"].includes(userRole || "")) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Unauthorized</CardTitle>
          <CardDescription>
            You do not have permission to manage this league.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>League Management</CardTitle>
        <CardDescription>Update league settings and configuration.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter league description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
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

          <div className="pt-4">
            <Button onClick={handleUpdate} disabled={isLoading}>
              {isLoading ? "Updating..." : "Update League"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
