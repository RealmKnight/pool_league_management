"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { TimeDisplayFormat, WeekDay, LeagueScheduleType, type ScheduleDay, type LeagueSchedule } from "@/app/leagues/types";
import { format, parse, setHours, setMinutes } from "date-fns";
import { cn } from "@/lib/utils";

interface ScheduleSelectorProps {
  value: LeagueSchedule;
  onChange: (value: LeagueSchedule) => void;
}

// Generate time options in 30-minute increments
const generateTimeOptions = (displayFormat: TimeDisplayFormat) => {
  const options: { value: string; label: string }[] = [];
  const date = new Date();
  date.setHours(0, 0, 0, 0);

  for (let i = 0; i < 48; i++) {
    const hours = Math.floor(i / 2);
    const minutes = (i % 2) * 30;
    date.setHours(hours);
    date.setMinutes(minutes);

    const value = format(date, "HH:mm");
    const label = format(date, displayFormat === TimeDisplayFormat["12Hour"] ? "h:mm a" : "HH:mm");
    options.push({ value, label });
  }

  return options;
};

export function ScheduleSelector({ value, onChange }: ScheduleSelectorProps) {
  const [selectedDay, setSelectedDay] = useState<WeekDay | null>(null);
  const timeOptions = generateTimeOptions(value.displayFormat);

  const formatTime = (time: string) => {
    const date = parse(time, "HH:mm", new Date());
    return format(date, value.displayFormat === TimeDisplayFormat["12Hour"] ? "h:mm a" : "HH:mm");
  };

  const handleAddDay = () => {
    if (selectedDay && !value.days.find(d => d.day === selectedDay)) {
      onChange({
        ...value,
        days: [...value.days, { day: selectedDay, startTime: "19:00" }].sort(
          (a, b) => Object.values(WeekDay).indexOf(a.day) - Object.values(WeekDay).indexOf(b.day)
        )
      });
      setSelectedDay(null);
    }
  };

  const handleRemoveDay = (day: WeekDay) => {
    onChange({
      ...value,
      days: value.days.filter(d => d.day !== day)
    });
  };

  const handleTimeChange = (day: WeekDay, newTime: string) => {
    onChange({
      ...value,
      days: value.days.map(d => 
        d.day === day ? { ...d, startTime: newTime } : d
      )
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Schedule Type</Label>
        <Select
          value={value.type}
          onValueChange={(newValue) => 
            onChange({ ...value, type: newValue as LeagueScheduleType })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={LeagueScheduleType.single_day}>Single Day</SelectItem>
            <SelectItem value={LeagueScheduleType.multiple_days}>Multiple Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <Label>Time Format</Label>
        <div className="flex items-center space-x-2">
          <span>24h</span>
          <Switch
            checked={value.displayFormat === TimeDisplayFormat["12Hour"]}
            onCheckedChange={(checked) =>
              onChange({
                ...value,
                displayFormat: checked ? TimeDisplayFormat["12Hour"] : TimeDisplayFormat["24Hour"]
              })
            }
          />
          <span>12h</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label>League Days</Label>
        <div className="flex flex-wrap gap-2">
          {value.days.map((scheduleDay) => (
            <div
              key={scheduleDay.day}
              className="flex items-center space-x-2 rounded-lg border p-2"
            >
              <span className="min-w-[100px]">{scheduleDay.day}</span>
              <Select
                value={scheduleDay.startTime}
                onValueChange={(newTime) => handleTimeChange(scheduleDay.day, newTime)}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveDay(scheduleDay.day)}
              >
                ×
              </Button>
            </div>
          ))}
        </div>

        <div className="flex items-center space-x-2 mt-2">
          <Select value={selectedDay || ""} onValueChange={(value) => setSelectedDay(value as WeekDay)}>
            <SelectTrigger className={cn("w-[180px]", !selectedDay && "text-muted-foreground")}>
              <SelectValue placeholder="Select day" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(WeekDay)
                .filter((day) => !value.days.find((d) => d.day === day))
                .map((day) => (
                  <SelectItem key={day} value={day}>
                    {day}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Button onClick={handleAddDay} disabled={!selectedDay}>
            Add Day
          </Button>
        </div>
      </div>
    </div>
  );
}
