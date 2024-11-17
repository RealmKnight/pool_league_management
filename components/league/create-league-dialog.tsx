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
import type { LeagueFormat, LeagueRules, WeekDay } from "@/app/leagues/types";

interface CreateLeagueDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onLeagueCreate: () => void;
}

export function CreateLeagueDialog({ isOpen, onOpenChange, onLeagueCreate }: CreateLeagueDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<LeagueFormat>("8_BALL");
  const [weekDay, setWeekDay] = useState<WeekDay>("MONDAY");
  const [rules, setRules] = useState<LeagueRules>("WORLD_RULES");
  const [isHandicapped, setIsHandicapped] = useState(false);

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

      const { error } = await supabase.from("leagues").insert({
        name,
        format,
        week_day: weekDay,
        rules,
        is_handicapped: isHandicapped,
        admin_id: user.id,
        secretary_id: user.id,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "League created successfully",
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
      <DialogContent>
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
            <Label htmlFor="format">Format</Label>
            <Select value={format} onValueChange={(value) => setFormat(value as LeagueFormat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="8_BALL">8 Ball</SelectItem>
                <SelectItem value="9_BALL">9 Ball</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="weekDay">Week Day</Label>
            <Select value={weekDay} onValueChange={(value) => setWeekDay(value as WeekDay)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MONDAY">Monday</SelectItem>
                <SelectItem value="TUESDAY">Tuesday</SelectItem>
                <SelectItem value="WEDNESDAY">Wednesday</SelectItem>
                <SelectItem value="THURSDAY">Thursday</SelectItem>
                <SelectItem value="FRIDAY">Friday</SelectItem>
                <SelectItem value="SATURDAY">Saturday</SelectItem>
                <SelectItem value="SUNDAY">Sunday</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rules">Rules</Label>
            <Select value={rules} onValueChange={(value) => setRules(value as LeagueRules)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WORLD_RULES">World Rules</SelectItem>
                <SelectItem value="OLD_RULES">Old Rules</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="handicapped"
              checked={isHandicapped}
              onCheckedChange={(checked) => setIsHandicapped(checked as boolean)}
            />
            <Label htmlFor="handicapped">Handicapped</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!name || isLoading}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
