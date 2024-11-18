import type { Database } from "@/lib/database.types";

export type TeamWithRelations = Database["public"]["Tables"]["teams"]["Row"] & {
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
  first_name: string;
  last_name: string;
}
