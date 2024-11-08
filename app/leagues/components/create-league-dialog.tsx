"use client";

import { useState, useEffect } from "react";
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
import { format, addDays, addWeeks, isBefore, isAfter, startOfDay, nextDay } from "date-fns";
import { z } from "zod";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Database } from "@/lib/database.types";
import type { AvailableAdmin } from "../types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useToast } from "@/hooks/use-toast";

// Constants and base types
const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
type WeekDay = (typeof DAYS_OF_WEEK)[number];

const GAME_FORMATS = ["8-Ball", "9-Ball", "10-Ball", "Straight Pool", "One Pocket", "Bank Pool"] as const;
type GameFormat = (typeof GAME_FORMATS)[number];

const LEAGUE_FORMATS = [
  "Single Round Robin",
  "Round Robin",
  "Single Elimination",
  "Double Elimination",
  "Swiss",
  "Swiss with Knockouts",
] as const;
type LeagueFormat = (typeof LEAGUE_FORMATS)[number];

// Add new type for schedule frequency
const SCHEDULE_FREQUENCIES = ["DAILY", "WEEKLY"] as const;
type ScheduleFrequency = (typeof SCHEDULE_FREQUENCIES)[number];

// Schema definitions
const scheduleDaySchema = z.object({
  day: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  rounds_per_day: z.number().optional(), // For weekly scheduling
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
  schedule_frequency: z.enum(SCHEDULE_FREQUENCIES),
  schedule_days: z.array(scheduleDaySchema).min(1, "At least one schedule day is required"),
  admin_id: z.string().optional(),
});

// Single CreateLeagueData type derived from the schema
export type CreateLeagueData = z.infer<typeof createLeagueSchema>;

// Helper interfaces
interface TimeSelection {
  start: string;
  end: string;
}

interface TimeRanges {
  [key: string]: TimeSelection;
}

interface CreateLeagueDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void>;
  isSuperuser: boolean;
  availableAdmins: AvailableAdmin[];
  isLoading?: boolean;
  userId: string;
}

// Helper function
const formatDate = (date: Date | undefined) => {
  if (!date) return null;
  return format(date, "PPP");
};

const getNextDayOfWeek = (dayName: string): Date => {
  const days = {
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
    Sunday: 0,
  };

  const today = startOfDay(new Date());
  const targetDay = days[dayName as keyof typeof days];
  const todayDay = today.getDay();

  let daysUntilNext = targetDay - todayDay;
  if (daysUntilNext <= 0) daysUntilNext += 7;

  return addDays(today, daysUntilNext);
};

// Add helper function to calculate rounds distribution
const calculateRoundsDistribution = (
  leagueFormat: LeagueFormat,
  teamCount: number,
  scheduleDays: { day: string }[],
  frequency: ScheduleFrequency
): { totalRounds: number; roundsPerDay: { [key: string]: number } } => {
  let totalRounds = 0;

  // Calculate total rounds based on league format
  switch (leagueFormat) {
    case "Single Round Robin":
      totalRounds = teamCount - 1; // Each team plays every other team once
      break;
    case "Round Robin":
      totalRounds = (teamCount - 1) * 2; // Each team plays every other team twice
      break;
    case "Double Elimination":
      totalRounds = Math.ceil(Math.log2(teamCount)) * 2 + 1; // Winners + Losers + Finals
      break;
    case "Single Elimination":
      totalRounds = Math.ceil(Math.log2(teamCount)); // Simple bracket
      break;
    case "Swiss":
      totalRounds = Math.ceil(Math.log2(teamCount)); // Typical Swiss format rounds
      break;
    case "Swiss with Knockouts":
      totalRounds = Math.ceil(Math.log2(teamCount)) + 3; // Swiss + knockout stages
      break;
  }

  const roundsPerDay: { [key: string]: number } = {};

  if (frequency === "DAILY") {
    // Each day runs a complete round
    scheduleDays.forEach(({ day }) => {
      roundsPerDay[day] = totalRounds;
    });
  } else {
    // WEEKLY - Distribute rounds across days
    const matchesPerDay = Math.ceil(teamCount / 4); // Assuming 4 teams can play simultaneously
    const totalMatchesPerRound = Math.floor(teamCount / 2);
    const daysNeededPerRound = Math.ceil(totalMatchesPerRound / matchesPerDay);

    // Distribute rounds evenly across available days
    scheduleDays.forEach(({ day }, index) => {
      const roundsForThisDay = Math.ceil(totalRounds / scheduleDays.length);
      roundsPerDay[day] = roundsForThisDay;
    });
  }

  return { totalRounds, roundsPerDay };
};

// Update the calculateSeasonLength function
const calculateSeasonLength = (
  leagueFormat: LeagueFormat,
  teamCount: number,
  scheduleDays: { day: string }[],
  frequency: ScheduleFrequency
): number => {
  const { totalRounds, roundsPerDay } = calculateRoundsDistribution(leagueFormat, teamCount, scheduleDays, frequency);

  if (frequency === "DAILY") {
    // Calculate weeks based on rounds per week
    const roundsPerWeek = scheduleDays.length;
    return Math.ceil(totalRounds / roundsPerWeek) + 2; // +2 for buffer
  } else {
    // WEEKLY - Calculate based on distributed rounds
    const totalWeeks = Math.ceil(totalRounds / Object.keys(roundsPerDay).length);
    return totalWeeks + 2; // +2 for buffer
  }
};

// First, let's create a constant for the format descriptions
const LEAGUE_FORMAT_DESCRIPTIONS: Record<LeagueFormat, string> = {
  "Single Round Robin": "Each team plays every other team once in the season",
  "Round Robin": "Double round-robin format where each team plays every other team twice - once home and once away",
  "Single Elimination": "Tournament style format where teams are eliminated after one loss",
  "Double Elimination": "Tournament style format where teams must lose twice to be eliminated",
  Swiss: "Teams are paired based on similar records, good for large leagues with limited time",
  "Swiss with Knockouts": "Swiss format followed by elimination rounds for top performing teams",
};

export function CreateLeagueDialog({
  isOpen,
  onOpenChange,
  onSuccess,
  isSuperuser,
  availableAdmins,
  userId,
}: CreateLeagueDialogProps) {
  const supabase = createClientComponentClient<Database>();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateLeague = async (data: CreateLeagueData) => {
    setIsLoading(true);
    try {
      // Prepare the league data according to the database schema
      const leagueData: Database["public"]["Tables"]["leagues"]["Insert"] = {
        name: data.name,
        description: data.description || null,
        game_format: data.game_format,
        league_format: data.league_format,
        rules: null,
        team_count: data.team_count,
        open_registration: !data.requires_approval,
        season_start: data.season_start?.toISOString() || null,
        season_end: data.season_end?.toISOString() || null,
        created_by: userId,
        schedule: {
          type: "multiple_days",
          days: data.schedule_days.map((day) => ({
            day: day.day,
            start_time: day.start_time,
            end_time: day.end_time,
          })),
        },
        estimated_weeks: 12,
      };

      // Create the league
      const { data: createdLeague, error: leagueError } = await supabase
        .from("leagues")
        .insert(leagueData)
        .select("*")
        .single();

      if (leagueError) throw leagueError;

      // Create the league permission
      const adminId = data.admin_id || userId;
      const { error: permissionError } = await supabase.from("league_permissions").insert({
        league_id: createdLeague.id,
        user_id: adminId,
        permission_type: "league_admin",
        created_at: new Date().toISOString(),
      });

      if (permissionError) throw permissionError;

      // If superuser creating for someone else, add superuser as admin too
      if (isSuperuser && data.admin_id && data.admin_id !== userId) {
        const { error: superuserPermissionError } = await supabase.from("league_permissions").insert({
          league_id: createdLeague.id,
          user_id: userId,
          permission_type: "league_admin",
          created_at: new Date().toISOString(),
        });

        if (superuserPermissionError) throw superuserPermissionError;
      }

      await onSuccess();
      toast({
        title: "Success",
        description: "League created successfully",
      });
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      console.error("Error creating league:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to create league",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const form = useForm<CreateLeagueData>({
    resolver: zodResolver(createLeagueSchema),
    defaultValues: {
      schedule_frequency: "DAILY",
      schedule_days: [{ day: DAYS_OF_WEEK[0], start_time: "19:00", end_time: "23:00", rounds_per_day: 1 }],
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

  // Add state management
  const [selectedDay, setSelectedDay] = useState<WeekDay | null>(null);
  const [tempTimeSelection, setTempTimeSelection] = useState<TimeSelection>({ start: "", end: "" });
  const [timeRanges, setTimeRanges] = useState<TimeRanges>({});

  const handleSubmit = async (data: CreateLeagueData) => {
    await handleCreateLeague(data);
  };

  const handleDialogClose = (open: boolean, day: WeekDay) => {
    if (!open) {
      setTempTimeSelection({ start: "", end: "" });
    }
    setSelectedDay(open ? day : null);
  };

  const handleSaveTimeSelection = (day: WeekDay) => {
    if (tempTimeSelection.start && tempTimeSelection.end) {
      setTimeRanges((prev: TimeRanges) => ({
        ...prev,
        [day]: { start: tempTimeSelection.start, end: tempTimeSelection.end },
      }));
      setSelectedDay(null);
      setTempTimeSelection({ start: "", end: "" });
    }
  };

  // Replace the existing useEffect watch logic with this:
  useEffect(() => {
    console.log("Setting up form watch effect");

    const subscription = form.watch((value, { name }) => {
      // Skip if no specific field changed
      if (!name || !isOpen) return;

      console.log("Form value changed:", name);

      // Get all current values
      const currentValues = form.getValues();
      const scheduleDays = currentValues.schedule_days;
      const leagueFormat = currentValues.league_format as LeagueFormat;
      const teamCount = currentValues.team_count;
      const frequency = currentValues.schedule_frequency as ScheduleFrequency;
      const currentStartDate = currentValues.season_start;
      const manualEndDate = currentValues.season_end;

      // Only proceed if we have the necessary data
      if (!scheduleDays?.length || !leagueFormat || !teamCount) {
        console.log("Missing required data for calculation");
        return;
      }

      // Check if the changed field should trigger a recalculation
      const shouldRecalculate =
        name.startsWith("schedule_days") || ["league_format", "team_count", "schedule_frequency"].includes(name);

      if (!shouldRecalculate) return;

      console.log("Recalculating dates");

      // Calculate the earliest possible start date if needed
      if (name.startsWith("schedule_days") || !currentStartDate) {
        const nextDates = scheduleDays.map((day) => getNextDayOfWeek(day.day));
        const earliestDate = nextDates.reduce(
          (earliest, current) => (isBefore(current, earliest) ? current : earliest),
          nextDates[0]
        );

        form.setValue("season_start", earliestDate, { shouldValidate: true });

        // Calculate end date based on the new start date
        const seasonLength = calculateSeasonLength(leagueFormat, teamCount, scheduleDays, frequency);
        const calculatedEndDate = addWeeks(earliestDate, seasonLength);
        form.setValue("season_end", calculatedEndDate, { shouldValidate: true });
      } else {
        // Recalculate end date based on current start date
        const seasonLength = calculateSeasonLength(leagueFormat, teamCount, scheduleDays, frequency);
        const calculatedEndDate = addWeeks(currentStartDate, seasonLength);
        form.setValue("season_end", calculatedEndDate, { shouldValidate: true });
      }
    });

    // Initial calculation when dialog opens
    if (isOpen) {
      const initialValues = form.getValues();
      if (initialValues.schedule_days?.length && initialValues.league_format && initialValues.team_count) {
        const nextDates = initialValues.schedule_days.map((day) => getNextDayOfWeek(day.day));
        const earliestDate = nextDates.reduce(
          (earliest, current) => (isBefore(current, earliest) ? current : earliest),
          nextDates[0]
        );

        form.setValue("season_start", earliestDate, { shouldValidate: true });
        const seasonLength = calculateSeasonLength(
          initialValues.league_format as LeagueFormat,
          initialValues.team_count,
          initialValues.schedule_days,
          initialValues.schedule_frequency as ScheduleFrequency
        );
        const calculatedEndDate = addWeeks(earliestDate, seasonLength);
        form.setValue("season_end", calculatedEndDate, { shouldValidate: true });
      }
    }

    return () => {
      console.log("Cleaning up form watch effect");
    };
  }, [isOpen, form]);

  // Add this useEffect after the other one
  useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New League</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="gap-4">
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

              <div className="space-y-2">
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
                <p className="text-sm text-muted-foreground">
                  {LEAGUE_FORMAT_DESCRIPTIONS[form.watch("league_format") as LeagueFormat]}
                </p>
                {form.formState.errors.league_format && (
                  <p className="text-sm text-red-500">{form.formState.errors.league_format.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="team_count">Number of Teams</Label>
                <Input id="team_count" type="number" {...form.register("team_count", { valueAsNumber: true })} />
              </div>
            </div>
          </div>

          {/* Add Schedule Frequency selector before Schedule Days */}
          <div className="space-y-4">
            <Label>Schedule Frequency</Label>
            <Select
              onValueChange={(value: ScheduleFrequency) => form.setValue("schedule_frequency", value)}
              value={form.watch("schedule_frequency")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAILY">Daily Rounds</SelectItem>
                <SelectItem value="WEEKLY">Weekly Rounds</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              {form.watch("schedule_frequency") === "DAILY"
                ? "Teams will play all scheduled games on the same day"
                : "Rounds will be split across multiple days per week, i.e games 1-6 on Monday, games 7-12 on Tuesday, etc."}
            </p>
          </div>

          {/* Update Schedule Days section */}
          <div className="space-y-4">
            <Label>Schedule Days</Label>
            <p className="text-sm text-muted-foreground">
              Select the days of the week that the league will be played on. Can choose multiple days by choosing "Add
              Schedule Day" button below.
            </p>
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

                {form.watch("schedule_frequency") === "WEEKLY" && (
                  <Input
                    type="number"
                    min="1"
                    placeholder="Rounds"
                    {...form.register(`schedule_days.${index}.rounds_per_day`, { valueAsNumber: true })}
                  />
                )}

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

            <p className="text-sm text-muted-foreground">
              {form.watch("schedule_frequency") === "DAILY"
                ? "If multiple days are selected, there will be multiple rounds of the schedule played in a single week. This results in a shorter season."
                : "If multiple days are selected, rounds will be split across multiple days per week, i.e games 1-6 on Monday, games 7-12 on Tuesday, etc. This results in a longer season."}
            </p>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({ day: DAYS_OF_WEEK[0], start_time: "19:00", end_time: "23:00", rounds_per_day: 1 })
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Schedule Day
            </Button>
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
