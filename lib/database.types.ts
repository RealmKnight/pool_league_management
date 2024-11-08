export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      games: {
        Row: {
          away_player_id: string | null;
          away_score: number | null;
          created_at: string | null;
          game_number: number;
          home_player_id: string | null;
          home_score: number | null;
          id: string;
          league_id: string | null;
          match_id: string | null;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          away_player_id?: string | null;
          away_score?: number | null;
          created_at?: string | null;
          game_number: number;
          home_player_id?: string | null;
          home_score?: number | null;
          id?: string;
          league_id?: string | null;
          match_id?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          away_player_id?: string | null;
          away_score?: number | null;
          created_at?: string | null;
          game_number?: number;
          home_player_id?: string | null;
          home_score?: number | null;
          id?: string;
          league_id?: string | null;
          match_id?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "games_away_player_id_fkey";
            columns: ["away_player_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "games_home_player_id_fkey";
            columns: ["home_player_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "games_league_id_fkey";
            columns: ["league_id"];
            referencedRelation: "leagues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "games_match_id_fkey";
            columns: ["match_id"];
            referencedRelation: "matches";
            referencedColumns: ["id"];
          }
        ];
      };
      league_permissions: {
        Row: {
          created_at: string | null;
          id: string;
          league_id: string | null;
          permission_type: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          league_id?: string | null;
          permission_type: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          league_id?: string | null;
          permission_type?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "league_permissions_league_id_fkey";
            columns: ["league_id"];
            referencedRelation: "leagues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "league_permissions_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      leagues: {
        Row: {
          created_at: string | null;
          created_by: string;
          description: string | null;
          estimated_weeks: number;
          format: string;
          id: string;
          name: string;
          open_registration: boolean;
          rules: Json | null;
          schedule: Json;
          season_end: string | null;
          season_start: string | null;
          team_count: number;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by: string;
          description?: string | null;
          estimated_weeks?: number;
          format?: string;
          id?: string;
          name: string;
          open_registration?: boolean;
          rules?: Json | null;
          schedule?: Json;
          season_end?: string | null;
          season_start?: string | null;
          team_count?: number;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string;
          description?: string | null;
          estimated_weeks?: number;
          format?: string;
          id?: string;
          name?: string;
          open_registration?: boolean;
          rules?: Json | null;
          schedule?: Json;
          season_end?: string | null;
          season_start?: string | null;
          team_count?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "leagues_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      matches: {
        Row: {
          away_team_id: string | null;
          created_at: string | null;
          home_team_id: string | null;
          id: string;
          league_id: string | null;
          match_date: string;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          away_team_id?: string | null;
          created_at?: string | null;
          home_team_id?: string | null;
          id?: string;
          league_id?: string | null;
          match_date: string;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          away_team_id?: string | null;
          created_at?: string | null;
          home_team_id?: string | null;
          id?: string;
          league_id?: string | null;
          match_date?: string;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey";
            columns: ["away_team_id"];
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_home_team_id_fkey";
            columns: ["home_team_id"];
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_league_id_fkey";
            columns: ["league_id"];
            referencedRelation: "leagues";
            referencedColumns: ["id"];
          }
        ];
      };
      team_join_requests: {
        Row: {
          created_at: string;
          id: string;
          league_id: string;
          status: string;
          team_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          league_id: string;
          status?: string;
          team_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          league_id?: string;
          status?: string;
          team_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_join_requests_league_id_fkey";
            columns: ["league_id"];
            referencedRelation: "leagues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_join_requests_team_id_fkey";
            columns: ["team_id"];
            referencedRelation: "teams";
            referencedColumns: ["id"];
          }
        ];
      };
      team_players: {
        Row: {
          created_at: string | null;
          id: string;
          league_id: string | null;
          team_id: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          league_id?: string | null;
          team_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          league_id?: string | null;
          team_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "team_players_league_id_fkey";
            columns: ["league_id"];
            referencedRelation: "leagues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_players_team_id_fkey";
            columns: ["team_id"];
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_players_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      teams: {
        Row: {
          created_at: string | null;
          created_by: string;
          format: string;
          id: string;
          league_id: string | null;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by: string;
          format: string;
          id?: string;
          league_id?: string | null;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string;
          format?: string;
          id?: string;
          league_id?: string | null;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "teams_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "teams_league_id_fkey";
            columns: ["league_id"];
            referencedRelation: "leagues";
            referencedColumns: ["id"];
          }
        ];
      };
      users: {
        Row: {
          availability: Json | null;
          avatar_url: string | null;
          contact_preferences: Json | null;
          created_at: string | null;
          email: string | null;
          first_name: string | null;
          format_preference: string[] | null;
          full_name: string | null;
          id: string;
          last_name: string | null;
          nickname: string | null;
          phone_number: string | null;
          previous_role: Database["public"]["Enums"]["user_role"] | null;
          role: Database["public"]["Enums"]["user_role"] | null;
          rules_preference: string[] | null;
          updated_at: string | null;
          use_nickname: boolean | null;
          will_substitute: boolean | null;
        };
        Insert: {
          availability?: Json | null;
          avatar_url?: string | null;
          contact_preferences?: Json | null;
          created_at?: string | null;
          email?: string | null;
          first_name?: string | null;
          format_preference?: string[] | null;
          full_name?: string | null;
          id: string;
          last_name?: string | null;
          nickname?: string | null;
          phone_number?: string | null;
          previous_role?: Database["public"]["Enums"]["user_role"] | null;
          role?: Database["public"]["Enums"]["user_role"] | null;
          rules_preference?: string[] | null;
          updated_at?: string | null;
          use_nickname?: boolean | null;
          will_substitute?: boolean | null;
        };
        Update: {
          availability?: Json | null;
          avatar_url?: string | null;
          contact_preferences?: Json | null;
          created_at?: string | null;
          email?: string | null;
          first_name?: string | null;
          format_preference?: string[] | null;
          full_name?: string | null;
          id?: string;
          last_name?: string | null;
          nickname?: string | null;
          phone_number?: string | null;
          previous_role?: Database["public"]["Enums"]["user_role"] | null;
          role?: Database["public"]["Enums"]["user_role"] | null;
          rules_preference?: string[] | null;
          updated_at?: string | null;
          use_nickname?: boolean | null;
          will_substitute?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "users_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      check_user_role: {
        Args: {
          lookup_role: string;
        };
        Returns: boolean;
      };
      has_league_permission: {
        Args: {
          league_uuid: string;
          required_permission: string;
        };
        Returns: boolean;
      };
      is_league_admin: {
        Args: {
          league_uuid: string;
        };
        Returns: boolean;
      };
      is_league_secretary: {
        Args: {
          league_uuid: string;
        };
        Returns: boolean;
      };
      is_superuser:
        | {
            Args: Record<PropertyKey, never>;
            Returns: boolean;
          }
        | {
            Args: {
              user_id: string;
            };
            Returns: boolean;
          };
      is_team_captain: {
        Args: {
          league_uuid: string;
        };
        Returns: boolean;
      };
      manage_league_secretary: {
        Args: {
          p_league_id: string;
          p_user_id: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      user_role: "superuser" | "league_admin" | "league_secretary" | "team_captain" | "team_secretary" | "player";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] & Database["public"]["Views"])
  ? (Database["public"]["Tables"] & Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  PublicTableNameOrOptions extends keyof Database["public"]["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof Database["public"]["Tables"] | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  PublicEnumNameOrOptions extends keyof Database["public"]["Enums"] | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never;
