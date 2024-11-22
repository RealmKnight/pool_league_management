import type { Database } from "@/lib/database.types";

export type Team = Database["public"]["Tables"]["teams"]["Row"];

export type TeamWithRelations = Team & {
  team_permissions?: Array<{
    id: string;
    user_id: string;
    permission_type: string;
    users?: {
      id: string;
      first_name: string;
      last_name: string;
    } | null;
  }>;
}

export interface AvailableCaptain {
  id: string;
  first_name: string | null;
  last_name: string | null;
}
