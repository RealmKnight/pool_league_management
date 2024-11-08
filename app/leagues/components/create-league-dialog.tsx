"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { LoadingState } from "./loading-state";
import { ErrorState } from "./error-state";
import type { LeagueFormat, LeagueRules, WeekDay, AvailableAdmin } from "../types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";
import { useToast } from "@/hooks/use-toast";

interface CreateLeagueDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: FormState) => Promise<void>;
  isSuperuser: boolean;
  isLoading: boolean;
}

export interface CreateLeagueData {
  name: string;
  created_by: string;
  estimated_weeks: number;
  format: LeagueFormat;
  team_count: number;
  open_registration: boolean;
  schedule: {
    type: "multiple_days";
    days: Array<{
      day: string;
      start_time: string;
      end_time: string;
    }>;
  };
  description?: string | null;
  rules?: {
    allowed: LeagueRules[];
    // Add any other rules-related fields here
  } | null;
  season_start?: string | null;
  season_end?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// Update the FormState interface
interface FormState {
  name: string;
  description: string;
  format: LeagueFormat;
  rules: {
    allowed: LeagueRules[];
  };
  team_count: number;
  requires_approval: boolean;
  open_registration: boolean;
  created_by: string;
  estimated_weeks: number;
  season_start: string | null;
  season_end: string | null;
  schedule: {
    type: "multiple_days";
    days: Array<{
      day: string;
      start_time: string;
      end_time: string;
    }>;
  };
  admin_id?: string;
}

const FORMATS: LeagueFormat[] = ["round_robin", "bracket", "swiss"];
const RULES: LeagueRules[] = ["APA", "BCA", "Bar", "House"];
const DAYS: WeekDay[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIME_OPTIONS = Array.from({ length: 36 }, (_, i) => {
  const hour = Math.floor(i / 2) + 6; // Start at 6 AM
  const minute = i % 2 === 0 ? "00" : "30";
  return `${hour.toString().padStart(2, "0")}:${minute}`;
});

// Utility function for conditional class names
const cn = (...classes: string[]) => classes.filter(Boolean).join(" ");

interface TimeSelection {
  start: string;
  end: string;
}

export function CreateLeagueDialog({ isOpen, onOpenChange, onSave, isSuperuser, isLoading }: CreateLeagueDialogProps) {
  const { toast } = useToast();

  // Update the initial form state
  const [formData, setFormData] = useState<FormState>({
    name: "",
    description: "",
    format: "round_robin",
    rules: {
      allowed: [],
    },
    team_count: 8,
    requires_approval: false,
    open_registration: true,
    created_by: "",
    estimated_weeks: 12,
    season_start: null,
    season_end: null,
    schedule: {
      type: "multiple_days",
      days: [],
    },
  });

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedDays, setSelectedDays] = useState<WeekDay[]>([]); // Track selected days
  const [timeRanges, setTimeRanges] = useState<{ [key in WeekDay]?: { start: string; end: string } }>({}); // Track time ranges
  const [selectedDay, setSelectedDay] = useState<WeekDay | null>(null);
  const [tempTimeSelection, setTempTimeSelection] = useState<TimeSelection>({ start: "", end: "" });
  const [availableAdmins, setAvailableAdmins] = useState<AvailableAdmin[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    if (startDate) {
      // Calculate end date based on format and number of teams
      const estimatedEndDate = new Date(startDate);
      estimatedEndDate.setDate(estimatedEndDate.getDate() + (formData.team_count > 8 ? 30 : 14)); // Example logic
      setEndDate(estimatedEndDate);
    }
  }, [startDate, formData.team_count]);

  // Load available administrators when dialog opens
  useEffect(() => {
    const loadAvailableAdmins = async () => {
      if (!isOpen || !isSuperuser) return;

      setLoadingAdmins(true);
      try {
        const { data, error } = await supabase.from("users").select("id, first_name, last_name").order("first_name");

        if (error) throw error;

        // Transform the data to ensure no null values
        const transformedData: AvailableAdmin[] = (data || []).map((user) => ({
          id: user.id,
          first_name: user.first_name || "", // Convert null to empty string
          last_name: user.last_name || "", // Convert null to empty string
        }));

        setAvailableAdmins(transformedData);
      } catch (error) {
        console.error("Error loading available administrators:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load available administrators",
        });
      } finally {
        setLoadingAdmins(false);
      }
    };

    loadAvailableAdmins();
  }, [isOpen, isSuperuser, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    // Transform timeRanges into the correct schedule format
    const scheduleData = {
      type: "multiple_days" as const,
      days: Object.entries(timeRanges).map(([day, times]) => ({
        day,
        start_time: times.start,
        end_time: times.end,
      })),
    };

    await onSave({
      ...formData,
      schedule: scheduleData,
      season_start: startDate?.toISOString() || null,
      season_end: endDate?.toISOString() || null,
    });
    setShowConfirmation(false);
  };

  const toggleDaySelection = (day: WeekDay) => {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const handleTimeChange = (day: WeekDay, start: string, end: string) => {
    setTimeRanges((prev) => ({
      ...prev,
      [day]: { start, end },
    }));
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
          <DialogTitle>{showConfirmation ? "Confirm League Creation" : "Create New League"}</DialogTitle>
          <DialogDescription>
            {showConfirmation
              ? "Please review the league details before confirming."
              : "Fill in the details to create a new league."}
          </DialogDescription>
        </DialogHeader>

        {showConfirmation ? (
          <div className="space-y-4">
            <p>Are you sure you want to create this league with the following details?</p>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Name:</strong> {formData.name}
              </p>
              <p>
                <strong>Format:</strong> {formData.format}
              </p>
              <p>
                <strong>Rules:</strong> {formData.rules?.allowed?.join(", ") || "None"}
              </p>
              <p>
                <strong>Teams:</strong> {formData.team_count}
              </p>
              <p>
                <strong>Season Start:</strong> {startDate?.toLocaleDateString()}
              </p>
              <p>
                <strong>Season End:</strong> {endDate?.toLocaleDateString()}
              </p>
              <p>
                <strong>Open Registration:</strong> {formData.open_registration ? "Yes" : "No"}
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmation(false)}>
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? "Creating..." : "Confirm"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">League Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="format">Format</Label>
                  <Select
                    value={formData.format}
                    onValueChange={(value: LeagueFormat) => setFormData({ ...formData, format: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMATS.map((format) => (
                        <SelectItem key={format} value={format}>
                          {format.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            {/* Rules and Settings */}
            <div className="space-y-4">
              <Label>Rules</Label>
              <div className="grid grid-cols-2 gap-4">
                {RULES.map((rule) => (
                  <div key={rule} className="flex items-center space-x-2">
                    <Checkbox
                      id={rule}
                      checked={formData.rules?.allowed?.includes(rule) ?? false}
                      onCheckedChange={(checked) => {
                        setFormData({
                          ...formData,
                          rules: {
                            allowed: checked
                              ? [...(formData.rules?.allowed || []), rule]
                              : (formData.rules?.allowed || []).filter((r) => r !== rule),
                          },
                        });
                      }}
                    />
                    <Label htmlFor={rule}>{rule}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Team Count */}
            <div className="space-y-2">
              <Label htmlFor="team_count">Number of Teams</Label>
              <Input
                id="team_count"
                type="number"
                value={formData.team_count}
                onChange={(e) => setFormData({ ...formData, team_count: Number(e.target.value) })}
                min={1}
                required
              />
            </div>

            {/* Registration Setting */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="open_registration"
                checked={formData.open_registration}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    open_registration: checked === true,
                  })
                }
              />
              <Label htmlFor="open_registration">Allow teams to join without admin approval</Label>
            </div>

            {/* Schedule Section */}
            <div className="space-y-4">
              <Label>Schedule</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {DAYS.map((day) => (
                  <Dialog key={day} open={selectedDay === day} onOpenChange={(open) => handleDialogClose(open, day)}>
                    <DialogTrigger asChild>
                      <Button variant={timeRanges[day] ? "default" : "outline"} className="w-full h-24 flex flex-col">
                        <span>{day}</span>
                        {timeRanges[day] && (
                          <span className="text-xs mt-2">
                            {timeRanges[day]?.start} - {timeRanges[day]?.end}
                          </span>
                        )}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Set Schedule for {day}</DialogTitle>
                        <DialogDescription>Choose the start and end times for {day}'s matches.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="start">Start Time</Label>
                            <Select
                              value={tempTimeSelection.start}
                              onValueChange={(value) => setTempTimeSelection({ ...tempTimeSelection, start: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select start time" />
                              </SelectTrigger>
                              <SelectContent position="popper" className="max-h-[200px] overflow-y-auto">
                                {TIME_OPTIONS.map((time) => (
                                  <SelectItem key={time} value={time}>
                                    {time}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="end">End Time</Label>
                            <Select
                              value={tempTimeSelection.end}
                              onValueChange={(value) => setTempTimeSelection({ ...tempTimeSelection, end: value })}
                              disabled={!tempTimeSelection.start}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select end time" />
                              </SelectTrigger>
                              <SelectContent position="popper" className="max-h-[200px] overflow-y-auto">
                                {TIME_OPTIONS.filter(
                                  (time) => !tempTimeSelection.start || time > tempTimeSelection.start
                                ).map((time) => (
                                  <SelectItem key={time} value={time}>
                                    {time}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex justify-between mt-4">
                          <Button
                            variant="destructive"
                            onClick={() => {
                              setTimeRanges((prev) => {
                                const newRanges = { ...prev };
                                delete newRanges[day];
                                return newRanges;
                              });
                              setTempTimeSelection({ start: "", end: "" });
                              setSelectedDay(null);
                            }}
                          >
                            Clear Schedule
                          </Button>
                          <Button
                            onClick={() => handleSaveTimeSelection(day)}
                            disabled={!tempTimeSelection.start || !tempTimeSelection.end}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                ))}
              </div>
            </div>

            {/* Calendar Section */}
            <div className="space-y-4">
              <Label>Season Dates</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} className="rounded-md border" />
                </div>
                <div className="flex flex-col">
                  <Label htmlFor="end_date">End Date</Label>
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    className="rounded-md border"
                    disabled={(date) => (startDate ? date < startDate : false)}
                  />
                </div>
              </div>
            </div>

            {/* Admin Selection (only for superusers) */}
            {isSuperuser && (
              <div className="space-y-2">
                <Label htmlFor="admin">League Administrator</Label>
                <Select
                  value={formData.admin_id}
                  onValueChange={(value) => setFormData({ ...formData, admin_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingAdmins ? "Loading..." : "Select an administrator"} />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="max-h-[200px] overflow-y-auto">
                      {availableAdmins.map((admin) => (
                        <SelectItem key={admin.id} value={admin.id}>
                          {`${admin.first_name || ""} ${admin.last_name || ""}`.trim() || "Unnamed User"}
                        </SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create League"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
