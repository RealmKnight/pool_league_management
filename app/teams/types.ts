import type { Database } from "@/lib/database.types";

export type Team = {
  id: string;
  name: string;
  format: string;
  home_venue: string | null;
  league_id: string | null;
  logo_url: string | null;
  max_players: number | null;
  status: Database["public"]["Enums"]["team_status_enum"] | null;
  team_contact: string | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string;
  team_permissions: {
    id: string;
    user_id: string;
    permission_type: string;
    created_at: string;
    users: {
      first_name: string | null;
      last_name: string | null;
    };
  }[];
  team_players: {
    id: string;
    user_id: string;
    jersey_number: string | null;
    position: string | null;
    status: string | null;
    users: {
      first_name: string | null;
      last_name: string | null;
    };
  }[];
  league: {
    id: string;
    name: string;
  } | null;
};

export type AvailableCaptain = {
  id: string;
  first_name: string | null;
  last_name: string | null;
};
