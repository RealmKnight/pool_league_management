import type { Database } from "@/lib/database.types";

// Base type from database
export type BaseTeam = Database["public"]["Tables"]["teams"]["Row"];

// Team with permissions
export type Team = BaseTeam & {
  team_permissions: Array<{
    id: string;
    user_id: string;
    permission_type: string;
    created_at: string;
    users: {
      first_name: string | null;
      last_name: string | null;
    };
  }>;
  format: TeamFormat;
};

export type TeamFormat = "5-a-side" | "7-a-side" | "11-a-side";
export type AvailableCaptain = {
  id: string;
  first_name: string;
  last_name: string;
};

export type CaptainDialogState = {
  isOpen: boolean;
  teamId: string | null;
  isLoading: boolean;
  captains: AvailableCaptain[];
};
