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
          role: string | null;
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
          role?: string | null;
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
          role?: string | null;
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
          rules: Json;
          season_start: string | null;
          season_end: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
          format: string;
          schedule: Json;
          estimated_weeks: number;
          team_count: number;
          league_admins?: {
            user_id: string;
            users: {
              first_name: string;
              last_name: string;
            };
          }[];
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          rules?: Json;
          season_start?: string | null;
          season_end?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          format?: string;
          schedule?: Json;
          estimated_weeks?: number;
          team_count?: number;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          rules?: Json;
          season_start?: string | null;
          season_end?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          format?: string;
          schedule?: Json;
          estimated_weeks?: number;
          team_count?: number;
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
      league_admins: {
        Row: {
          id: string;
          league_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          league_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          league_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "league_admins_league_id_fkey";
            columns: ["league_id"];
            isOneToOne: false;
            referencedRelation: "leagues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "league_admins_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      league_secretaries: {
        Row: {
          id: string;
          league_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          league_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          league_id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
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
