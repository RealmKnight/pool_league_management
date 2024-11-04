export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          first_name: string | null;
          last_name: string | null;
          nickname: string | null;
          phone_number: string | null;
          rules_preference: string[] | null;
          format_preference: string[] | null;
          availability: Json | null;
          will_substitute: boolean | null;
          contact_preferences: Json | null;
          use_nickname: boolean | null;
          role: "superuser" | "league_admin" | "league_secretary" | "team_captain" | "team_secretary" | "player" | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          nickname?: string | null;
          phone_number?: string | null;
          rules_preference?: string[] | null;
          format_preference?: string[] | null;
          availability?: Json | null;
          will_substitute?: boolean | null;
          contact_preferences?: Json | null;
          use_nickname?: boolean | null;
          role?:
            | "superuser"
            | "league_admin"
            | "league_secretary"
            | "team_captain"
            | "team_secretary"
            | "player"
            | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          nickname?: string | null;
          phone_number?: string | null;
          rules_preference?: string[] | null;
          format_preference?: string[] | null;
          availability?: Json | null;
          will_substitute?: boolean | null;
          contact_preferences?: Json | null;
          use_nickname?: boolean | null;
          role?:
            | "superuser"
            | "league_admin"
            | "league_secretary"
            | "team_captain"
            | "team_secretary"
            | "player"
            | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "users_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      leagues: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          rules: Json | null;
          season_start: string | null;
          season_end: string | null;
          created_by: string;
          created_at: string | null;
          updated_at: string | null;
          format: string;
          schedule: Json;
          estimated_weeks: number;
          team_count: number;
          league_permissions?: {
            user_id: string;
            permission_type: string;
            users: {
              first_name: string;
              last_name: string;
            };
          }[];
          open_registration: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          rules?: Json | null;
          season_start?: string | null;
          season_end?: string | null;
          created_by: string;
          created_at?: string | null;
          updated_at?: string | null;
          format?: string;
          schedule?: Json;
          estimated_weeks?: number;
          team_count?: number;
          open_registration?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          rules?: Json | null;
          season_start?: string | null;
          season_end?: string | null;
          created_by?: string;
          created_at?: string | null;
          updated_at?: string | null;
          format?: string;
          schedule?: Json;
          estimated_weeks?: number;
          team_count?: number;
          open_registration?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "leagues_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      league_permissions: {
        Row: {
          id: string;
          league_id: string;
          user_id: string;
          permission_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          league_id: string;
          user_id: string;
          permission_type: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          league_id?: string;
          user_id?: string;
          permission_type?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "league_permissions_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "leagues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "league_permissions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      teams: {
        Row: {
          id: string;
          league_id: string;
          name: string;
          format: string;
          created_at: string;
          updated_at: string;
          created_by: string;
        };
        Insert: {
          id?: string;
          league_id: string;
          name: string;
          format: string;
          created_at?: string;
          updated_at?: string;
          created_by: string;
        };
        Update: {
          id?: string;
          league_id?: string;
          name?: string;
          format?: string;
          created_at?: string;
          updated_at?: string;
          created_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: "teams_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "leagues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "teams_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      team_players: {
        Row: {
          id: string;
          team_id: string;
          league_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          league_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          league_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_players_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_players_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "leagues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_players_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      matches: {
        Row: {
          id: string;
          league_id: string;
          home_team_id: string;
          away_team_id: string;
          match_date: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          league_id: string;
          home_team_id: string;
          away_team_id: string;
          match_date: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          league_id?: string;
          home_team_id?: string;
          away_team_id?: string;
          match_date?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "matches_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "leagues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_home_team_id_fkey";
            columns: ["home_team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_away_team_id_fkey";
            columns: ["away_team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          }
        ];
      };
      games: {
        Row: {
          id: string;
          match_id: string;
          league_id: string;
          home_player_id: string;
          away_player_id: string;
          home_score: number;
          away_score: number;
          game_number: number;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          league_id: string;
          home_player_id: string;
          away_player_id: string;
          home_score?: number;
          away_score?: number;
          game_number: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          league_id?: string;
          home_player_id?: string;
          away_player_id?: string;
          home_score?: number;
          away_score?: number;
          game_number?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "games_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "games_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "leagues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "games_home_player_id_fkey";
            columns: ["home_player_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "games_away_player_id_fkey";
            columns: ["away_player_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      team_join_requests: {
        Row: {
          id: string;
          league_id: string;
          team_id: string;
          status: "pending" | "approved" | "rejected";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          league_id: string;
          team_id: string;
          status?: "pending" | "approved" | "rejected";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          league_id?: string;
          team_id?: string;
          status?: "pending" | "approved" | "rejected";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "team_join_requests_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "leagues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_join_requests_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_superuser: {
        Args: Record<PropertyKey, never>;
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
        Returns: void;
      };
    };
    Enums: {
      user_role: "superuser" | "league_admin" | "league_secretary" | "team_captain" | "team_secretary" | "player";
      league_registration_type: "invite_only" | "approval_required" | "open";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export interface LeagueSchedule {
  type: "single_day" | "multiple_days";
  days: string[];
  start_time: string;
}
