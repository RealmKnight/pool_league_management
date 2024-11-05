"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar"; // Import the calendar component
import { LoadingState } from "./loading-state";
import { ErrorState } from "./error-state";
import type { LeagueFormat, LeagueRules, WeekDay } from "../types";

interface CreateLeagueDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: CreateLeagueData) => Promise<void>;
  isSuperuser: boolean;
  isLoading: boolean;
  availableAdmins?: { id: string; first_name: string; last_name: string }[];
}

export interface CreateLeagueData {
  name: string;
  description: string;
  format: LeagueFormat;
  rules: LeagueRules[];
  team_count: number;
  requires_approval: boolean;
  season_start: string; // Ensure this is always a string
  season_end: string; // Ensure this is always a string
  schedule_days: {
    day: WeekDay;
    start_time: string;
    end_time: string;
  }[];
  open_registration: boolean; // New field for open registration
  admin_id?: string; // Only for superuser
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

export function CreateLeagueDialog({
  isOpen,
  onOpenChange,
  onSave,
  isSuperuser,
  isLoading,
  availableAdmins = [],
}: CreateLeagueDialogProps) {
  const [formData, setFormData] = useState<CreateLeagueData>({
    name: "",
    description: "",
    format: "round_robin",
    rules: [],
    team_count: 8,
    requires_approval: true,
    season_start: "", // Initialize as empty string
    season_end: "", // Initialize as empty string
    schedule_days: [], // Initialize as empty array
    open_registration: true, // Default to true
  });

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [selectedDays, setSelectedDays] = useState<WeekDay[]>([]); // Track selected days
  const [timeRanges, setTimeRanges] = useState<{ [key in WeekDay]?: { start: string; end: string } }>({}); // Track time ranges

  useEffect(() => {
    if (startDate) {
      // Calculate end date based on format and number of teams
      const estimatedEndDate = new Date(startDate);
      estimatedEndDate.setDate(estimatedEndDate.getDate() + (formData.team_count > 8 ? 30 : 14)); // Example logic
      setEndDate(estimatedEndDate);
    }
  }, [startDate, formData.team_count]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showConfirmation) {
      setShowConfirmation(true);
      return;
    }
    await onSave({
      ...formData,
      season_start: startDate ? startDate.toISOString() : "", // Ensure it's a string
      season_end: endDate ? endDate.toISOString() : "", // Ensure it's a string
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{showConfirmation ? "Confirm League Creation" : "Create New League"}</DialogTitle>
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
                <strong>Rules:</strong> {formData.rules.join(", ")}
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
                      checked={formData.rules.includes(rule)}
                      onCheckedChange={(checked) => {
                        setFormData({
                          ...formData,
                          rules: checked ? [...formData.rules, rule] : formData.rules.filter((r) => r !== rule),
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

            {/* Approval Requirement */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="requires_approval"
                checked={formData.requires_approval}
                onCheckedChange={(checked) => setFormData({ ...formData, requires_approval: checked })}
              />
              <Label htmlFor="requires_approval">Require admin approval for teams to join</Label>
            </div>

            {/* Open Registration */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="open_registration"
                checked={formData.open_registration}
                onCheckedChange={(checked) => setFormData({ ...formData, open_registration: checked })}
              />
              <Label htmlFor="open_registration">Open registration for teams</Label>
            </div>

            {/* Schedule */}
            <div className="space-y-4">
              <Label>Schedule</Label>
              <div className="grid grid-cols-2 gap-4">
                {DAYS.map((day) => (
                  <div key={day} className="flex flex-col">
                    <Button
                      variant="outline"
                      onClick={() => toggleDaySelection(day)}
                      className={cn("w-full", selectedDays.includes(day) ? "bg-blue-500 text-white" : "")}
                    >
                      {day}
                    </Button>
                    {selectedDays.includes(day) && (
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <Select
                          value={timeRanges[day]?.start || ""}
                          onValueChange={(value) => handleTimeChange(day, value, timeRanges[day]?.end || "")}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Start Time" />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_OPTIONS.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={timeRanges[day]?.end || ""}
                          onValueChange={(value) => handleTimeChange(day, timeRanges[day]?.start || "", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="End Time" />
                          </SelectTrigger>
                          <SelectContent>
                            {TIME_OPTIONS.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

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
