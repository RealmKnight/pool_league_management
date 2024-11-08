import type { Database } from "@/lib/database.types";

// Base type from database
export type BaseTeam = Database["public"]["Tables"]["teams"]["Row"];

// Team with permissions and players
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
  team_players: Array<{
    id: string;
    user_id: string;
    jersey_number: string | null;
    position: string | null;
    status: string | null;
    users: {
      first_name: string | null;
      last_name: string | null;
      email: string | null;
    };
  }>;
  league: {
    id: string;
    name: string;
    game_format: string;
  } | null;
  format: TeamFormat;
};

export type TeamFormat = "singles" | "doubles" | "scotch-doubles";
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
