import type { Database } from "@/lib/database.types";

// Base type from database
export type BaseLeague = Database["public"]["Tables"]["leagues"]["Row"];

// League with permissions
export type League = BaseLeague & {
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
  format: LeagueFormat;
};

export type LeagueScheduleType = "single_day" | "multiple_days";
export type LeagueFormat = "round_robin" | "bracket" | "swiss";
export type WeekDay = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
export type LeagueRules = "BCA" | "APA" | "Bar" | "House";

export interface LeagueSchedule {
  type: LeagueScheduleType;
  days: WeekDay[];
  start_time: string;
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
  rules: {
    allowed: LeagueRules[];
  };
  team_count: number;
  requires_approval: boolean;
  season_start: string | null;
  season_end: string | null;
  estimated_weeks: number;
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
