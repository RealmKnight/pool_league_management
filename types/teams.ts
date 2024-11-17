import type { Database } from "@/lib/database.types";

export interface Team extends Database["public"]["Tables"]["teams"]["Row"] {
  team_permissions: Array<{
    user_id: string;
    permission_type: string;
    team_id: string;
  }>;
  team_players: Array<{
    user_id: string;
    team_id: string;
  }>;
  leagues: {
    id: string;
    name: string;
    format: string;
    status: string;
  } | null;
}

export interface AvailableCaptain {
  id: string;
  first_name: string;
  last_name: string;
}
