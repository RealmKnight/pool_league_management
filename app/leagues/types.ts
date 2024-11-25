import type { Database } from "@/lib/database.types";

// Base type from database
export type BaseLeague = Database["public"]["Tables"]["leagues"]["Row"];

export interface ScheduleDay {
  day: WeekDay;
  startTime: string; // 24-hour format HH:mm
}

export interface LeagueSchedule {
  type: LeagueScheduleType;
  days: ScheduleDay[];
  isHandicapped: boolean;
  displayFormat: TimeDisplayFormat;
}

export enum TimeDisplayFormat {
  "12Hour" = "12Hour",
  "24Hour" = "24Hour"
}

export enum LeagueScheduleType {
  single_day = "single_day",
  multiple_days = "multiple_days"
}

// League with permissions
export type League = Omit<BaseLeague, 'schedule'> & {
  league_permissions: Array<{
    id: string;
    user_id: string;
    permission_type: string;
    created_at: string;
    users: {
      first_name: string | null;
      last_name: string | null;
    };
  }>;
  schedule: LeagueSchedule;
  format: LeagueFormat;
};

export enum GameFormat {
  "8-Ball" = "8-Ball",
  "9-Ball" = "9-Ball",
  "10-Ball" = "10-Ball",
  "Straight Pool" = "Straight Pool",
  "One Pocket" = "One Pocket",
  "Bank Pool" = "Bank Pool"
}

export enum LeagueFormat {
  "Round Robin" = "Round Robin",
  "Single Elimination" = "Single Elimination",
  "Double Elimination" = "Double Elimination",
  "Swiss" = "Swiss",
  "Swiss with Knockouts" = "Swiss with Knockouts",
  "Single Round Robin" = "Single Round Robin"
}

export enum WeekDay {
  MONDAY = "MONDAY",
  TUESDAY = "TUESDAY",
  WEDNESDAY = "WEDNESDAY",
  THURSDAY = "THURSDAY",
  FRIDAY = "FRIDAY",
  SATURDAY = "SATURDAY",
  SUNDAY = "SUNDAY"
}

export enum LeagueRules {
  BCA = "BCA",
  APA = "APA",
  Bar = "Bar",
  House = "House"
}

export type AvailableAdmin = {
  id: string;
  first_name: string;
  last_name: string;
};

export type AdminDialogState = {
  isOpen: boolean;
  leagueId: string | null;
  isLoading: boolean;
  admins: AvailableAdmin[];
};

export interface CreateLeagueFormData {
  name: string;
  description: string | null;
  format: LeagueFormat;
  rules: LeagueRules;
  team_count: number;
  requires_approval: boolean;
  season_start: string | null;
  season_end: string | null;
  estimated_weeks: number;
  schedule: LeagueSchedule;
  admin_id?: string;
}
