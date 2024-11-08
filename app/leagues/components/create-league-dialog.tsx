"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon, Plus, Trash } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Database } from "@/lib/database.types";
import type { AvailableAdmin } from "../types";

// Constants first
const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Update the type definitions to match your database enums exactly
const GAME_FORMATS = ["8-Ball", "9-Ball", "10-Ball", "Straight Pool", "One Pocket", "Bank Pool"] as const;

const LEAGUE_FORMATS = [
  "Round Robin",
  "Single Elimination",
  "Double Elimination",
  "Swiss",
  "Swiss with Knockouts",
] as const;

// Schema for schedule days
const scheduleDaySchema = z.object({
  day: z.string(),
  start_time: z.string(),
  end_time: z.string(),
});

// Schema for the entire form
const createLeagueSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  game_format: z.enum(GAME_FORMATS as readonly [string, ...string[]]),
  league_format: z.enum(LEAGUE_FORMATS as readonly [string, ...string[]]),
  rules: z.any().optional(),
  team_count: z.number().min(2, "Must have at least 2 teams"),
  requires_approval: z.boolean().default(false),
  season_start: z.date().optional(),
  season_end: z.date().optional(),
  schedule_days: z.array(scheduleDaySchema).min(1, "At least one schedule day is required"),
});

export type CreateLeagueData = z.infer<typeof createLeagueSchema>;

// Add type safety for the date format function
const formatDate = (date: Date | undefined) => {
  if (!date) return null;
  return format(date, "PPP");
};

interface CreateLeagueDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: CreateLeagueData) => Promise<void>;
  isLoading: boolean;
}

export function CreateLeagueDialog({ isOpen, onOpenChange, onSave, isLoading }: CreateLeagueDialogProps) {
  const form = useForm<CreateLeagueData>({
    resolver: zodResolver(createLeagueSchema),
    defaultValues: {
      schedule_days: [{ day: DAYS_OF_WEEK[0], start_time: "19:00", end_time: "23:00" }],
      requires_approval: true,
      team_count: 8,
      game_format: "8-Ball",
      league_format: "Round Robin",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "schedule_days",
  });

  const handleSubmit = async (data: CreateLeagueData) => {
    await onSave(data);
    form.reset();
  };

  const handleDialogClose = (open: boolean, day: WeekDay) => {
    if (!open) {
      setTempTimeSelection({ start: "", end: "" });
    }
    setSelectedDay(open ? day : null);
  };

  const handleSaveTimeSelection = (day: WeekDay) => {
    if (tempTimeSelection.start && tempTimeSelection.end) {
      setTimeRanges((prev) => ({
        ...prev,
        [day]: { start: tempTimeSelection.start, end: tempTimeSelection.end },
      }));
      setSelectedDay(null);
      setTempTimeSelection({ start: "", end: "" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New League</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">League Name</Label>
                <Input id="name" {...form.register("name")} placeholder="Enter league name" />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" {...form.register("description")} placeholder="Enter league description" />
              </div>

              <div>
                <Label htmlFor="game_format">Game Format</Label>
                <Select
                  onValueChange={(value: (typeof GAME_FORMATS)[number]) => form.setValue("game_format", value)}
                  value={form.watch("game_format")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select game format" />
                  </SelectTrigger>
                  <SelectContent>
                    {GAME_FORMATS.map((format) => (
                      <SelectItem key={format} value={format}>
                        {format}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.game_format && (
                  <p className="text-sm text-red-500">{form.formState.errors.game_format.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="league_format">League Format</Label>
                <Select
                  onValueChange={(value: (typeof LEAGUE_FORMATS)[number]) => form.setValue("league_format", value)}
                  value={form.watch("league_format")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select league format" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAGUE_FORMATS.map((format) => (
                      <SelectItem key={format} value={format}>
                        {format}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.league_format && (
                  <p className="text-sm text-red-500">{form.formState.errors.league_format.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="team_count">Number of Teams</Label>
                <Input id="team_count" type="number" {...form.register("team_count", { valueAsNumber: true })} />
              </div>
            </div>

            {/* Dates and Admin */}
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label>Season Dates</Label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !form.watch("season_start") && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formatDate(form.watch("season_start")) ?? <span>Start date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={form.watch("season_start")}
                        onSelect={(date) => form.setValue("season_start", date)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !form.watch("season_end") && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formatDate(form.watch("season_end")) ?? <span>End date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={form.watch("season_end")}
                        onSelect={(date) => form.setValue("season_end", date)}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="requires_approval"
                  checked={form.watch("requires_approval")}
                  onCheckedChange={(checked: boolean) => form.setValue("requires_approval", checked)}
                />
                <Label htmlFor="requires_approval">Require approval for team registration</Label>
              </div>
            </div>
          </div>

          {/* Schedule Days */}
          <div className="space-y-4">
            <Label>Schedule Days</Label>
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-4 items-center">
                <Select
                  defaultValue={field.day}
                  onValueChange={(value) => form.setValue(`schedule_days.${index}.day`, value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day} value={day}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input type="time" {...form.register(`schedule_days.${index}.start_time`)} />
                <Input type="time" {...form.register(`schedule_days.${index}.end_time`)} />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ day: DAYS_OF_WEEK[0], start_time: "19:00", end_time: "23:00" })}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Schedule Day
            </Button>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create League"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
