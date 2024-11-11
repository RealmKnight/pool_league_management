export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  pgbouncer: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_auth: {
        Args: {
          p_usename: string
        }
        Returns: {
          username: string
          password: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      games: {
        Row: {
          away_player_id: string | null
          away_score: number | null
          created_at: string | null
          game_number: number
          home_player_id: string | null
          home_score: number | null
          id: string
          league_id: string | null
          match_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          away_player_id?: string | null
          away_score?: number | null
          created_at?: string | null
          game_number: number
          home_player_id?: string | null
          home_score?: number | null
          id?: string
          league_id?: string | null
          match_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          away_player_id?: string | null
          away_score?: number | null
          created_at?: string | null
          game_number?: number
          home_player_id?: string | null
          home_score?: number | null
          id?: string
          league_id?: string | null
          match_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "games_away_player_id_fkey"
            columns: ["away_player_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_home_player_id_fkey"
            columns: ["home_player_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_league_id_fkey"
            columns: ["league_id"]
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_match_id_fkey"
            columns: ["match_id"]
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      league_permissions: {
        Row: {
          created_at: string | null
          id: string
          league_id: string | null
          permission_type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          league_id?: string | null
          permission_type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          league_id?: string | null
          permission_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "league_permissions_league_id_fkey"
            columns: ["league_id"]
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "league_permissions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      leagues: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          estimated_weeks: number
          game_format: string
          id: string
          league_format: string
          name: string
          open_registration: boolean
          rules: Json | null
          schedule: Json
          season_end: string | null
          season_start: string | null
          team_count: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          estimated_weeks?: number
          game_format?: string
          id?: string
          league_format?: string
          name: string
          open_registration?: boolean
          rules?: Json | null
          schedule?: Json
          season_end?: string | null
          season_start?: string | null
          team_count?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          estimated_weeks?: number
          game_format?: string
          id?: string
          league_format?: string
          name?: string
          open_registration?: boolean
          rules?: Json | null
          schedule?: Json
          season_end?: string | null
          season_start?: string | null
          team_count?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leagues_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          away_team_id: string | null
          away_team_score: number | null
          created_at: string | null
          home_team_id: string | null
          home_team_score: number | null
          id: string
          league_id: string | null
          match_date: string
          season_id: string
          status: string | null
          updated_at: string | null
          venue: string | null
          week: number | null
        }
        Insert: {
          away_team_id?: string | null
          away_team_score?: number | null
          created_at?: string | null
          home_team_id?: string | null
          home_team_score?: number | null
          id?: string
          league_id?: string | null
          match_date: string
          season_id: string
          status?: string | null
          updated_at?: string | null
          venue?: string | null
          week?: number | null
        }
        Update: {
          away_team_id?: string | null
          away_team_score?: number | null
          created_at?: string | null
          home_team_id?: string | null
          home_team_score?: number | null
          id?: string
          league_id?: string | null
          match_date?: string
          season_id?: string
          status?: string | null
          updated_at?: string | null
          venue?: string | null
          week?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_league_id_fkey"
            columns: ["league_id"]
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_season_id_fkey"
            columns: ["season_id"]
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      player_statistics: {
        Row: {
          assists: number | null
          goals: number | null
          id: string
          league_id: string
          matches_played: number | null
          minutes_played: number | null
          player_id: string
          red_cards: number | null
          season_id: string
          team_id: string
          updated_at: string | null
          yellow_cards: number | null
        }
        Insert: {
          assists?: number | null
          goals?: number | null
          id?: string
          league_id: string
          matches_played?: number | null
          minutes_played?: number | null
          player_id: string
          red_cards?: number | null
          season_id: string
          team_id: string
          updated_at?: string | null
          yellow_cards?: number | null
        }
        Update: {
          assists?: number | null
          goals?: number | null
          id?: string
          league_id?: string
          matches_played?: number | null
          minutes_played?: number | null
          player_id?: string
          red_cards?: number | null
          season_id?: string
          team_id?: string
          updated_at?: string | null
          yellow_cards?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_statistics_league_id_fkey"
            columns: ["league_id"]
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_statistics_player_id_fkey"
            columns: ["player_id"]
            referencedRelation: "team_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_statistics_season_id_fkey"
            columns: ["season_id"]
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_statistics_team_id_fkey"
            columns: ["team_id"]
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          created_at: string | null
          created_by: string | null
          end_date: string | null
          id: string
          league_id: string
          name: string
          start_date: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          id?: string
          league_id: string
          name: string
          start_date?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          id?: string
          league_id?: string
          name?: string
          start_date?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seasons_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seasons_league_id_fkey"
            columns: ["league_id"]
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invites: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invited_by: string
          league_id: string
          role: string
          status: string | null
          team_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_by: string
          league_id: string
          role: string
          status?: string | null
          team_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string
          league_id?: string
          role?: string
          status?: string | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invites_invited_by_fkey"
            columns: ["invited_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invites_league_id_fkey"
            columns: ["league_id"]
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invites_team_id_fkey"
            columns: ["team_id"]
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_join_requests: {
        Row: {
          created_at: string
          id: string
          league_id: string
          status: string
          team_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          league_id: string
          status?: string
          team_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          league_id?: string
          status?: string
          team_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_join_requests_league_id_fkey"
            columns: ["league_id"]
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_join_requests_team_id_fkey"
            columns: ["team_id"]
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_join_requests_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      team_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission_type: string
          team_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission_type: string
          team_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          permission_type?: string
          team_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_permissions_team_id_fkey"
            columns: ["team_id"]
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_permissions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      team_players: {
        Row: {
          created_at: string | null
          id: string
          jersey_number: string | null
          join_date: string | null
          league_id: string | null
          leave_date: string | null
          position: Database["public"]["Enums"]["player_position_enum"] | null
          role: string | null
          status: Database["public"]["Enums"]["player_status_enum"] | null
          team_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          jersey_number?: string | null
          join_date?: string | null
          league_id?: string | null
          leave_date?: string | null
          position?: Database["public"]["Enums"]["player_position_enum"] | null
          role?: string | null
          status?: Database["public"]["Enums"]["player_status_enum"] | null
          team_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          jersey_number?: string | null
          join_date?: string | null
          league_id?: string | null
          leave_date?: string | null
          position?: Database["public"]["Enums"]["player_position_enum"] | null
          role?: string | null
          status?: Database["public"]["Enums"]["player_status_enum"] | null
          team_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_players_league_id_fkey"
            columns: ["league_id"]
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_players_team_id_fkey"
            columns: ["team_id"]
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_players_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      team_staff: {
        Row: {
          created_at: string | null
          end_date: string | null
          id: string
          league_id: string
          role: string | null
          start_date: string | null
          status: string | null
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          league_id: string
          role?: string | null
          start_date?: string | null
          status?: string | null
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          id?: string
          league_id?: string
          role?: string | null
          start_date?: string | null
          status?: string | null
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_staff_league_id_fkey"
            columns: ["league_id"]
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_staff_team_id_fkey"
            columns: ["team_id"]
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_staff_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      team_statistics: {
        Row: {
          draws: number | null
          goals_against: number | null
          goals_for: number | null
          id: string
          league_id: string
          losses: number | null
          matches_played: number | null
          points: number | null
          season_id: string
          team_id: string
          updated_at: string | null
          wins: number | null
        }
        Insert: {
          draws?: number | null
          goals_against?: number | null
          goals_for?: number | null
          id?: string
          league_id: string
          losses?: number | null
          matches_played?: number | null
          points?: number | null
          season_id: string
          team_id: string
          updated_at?: string | null
          wins?: number | null
        }
        Update: {
          draws?: number | null
          goals_against?: number | null
          goals_for?: number | null
          id?: string
          league_id?: string
          losses?: number | null
          matches_played?: number | null
          points?: number | null
          season_id?: string
          team_id?: string
          updated_at?: string | null
          wins?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "team_statistics_league_id_fkey"
            columns: ["league_id"]
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_statistics_season_id_fkey"
            columns: ["season_id"]
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_statistics_team_id_fkey"
            columns: ["team_id"]
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string | null
          created_by: string
          format: string
          home_venue: string | null
          id: string
          league_id: string | null
          logo_url: string | null
          max_players: number | null
          name: string
          status: Database["public"]["Enums"]["team_status_enum"] | null
          team_contact: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          format: string
          home_venue?: string | null
          id?: string
          league_id?: string | null
          logo_url?: string | null
          max_players?: number | null
          name: string
          status?: Database["public"]["Enums"]["team_status_enum"] | null
          team_contact?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          format?: string
          home_venue?: string | null
          id?: string
          league_id?: string | null
          logo_url?: string | null
          max_players?: number | null
          name?: string
          status?: Database["public"]["Enums"]["team_status_enum"] | null
          team_contact?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_league_id_fkey"
            columns: ["league_id"]
            referencedRelation: "leagues"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          availability: Json | null
          avatar_url: string | null
          contact_preferences: Json | null
          created_at: string | null
          email: string | null
          first_name: string | null
          format_preference: string[] | null
          full_name: string | null
          id: string
          last_name: string | null
          nickname: string | null
          phone_number: string | null
          previous_role: Database["public"]["Enums"]["user_role"] | null
          role: Database["public"]["Enums"]["user_role"] | null
          rules_preference: string[] | null
          updated_at: string | null
          use_nickname: boolean | null
          will_substitute: boolean | null
        }
        Insert: {
          availability?: Json | null
          avatar_url?: string | null
          contact_preferences?: Json | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          format_preference?: string[] | null
          full_name?: string | null
          id: string
          last_name?: string | null
          nickname?: string | null
          phone_number?: string | null
          previous_role?: Database["public"]["Enums"]["user_role"] | null
          role?: Database["public"]["Enums"]["user_role"] | null
          rules_preference?: string[] | null
          updated_at?: string | null
          use_nickname?: boolean | null
          will_substitute?: boolean | null
        }
        Update: {
          availability?: Json | null
          avatar_url?: string | null
          contact_preferences?: Json | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          format_preference?: string[] | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          nickname?: string | null
          phone_number?: string | null
          previous_role?: Database["public"]["Enums"]["user_role"] | null
          role?: Database["public"]["Enums"]["user_role"] | null
          rules_preference?: string[] | null
          updated_at?: string | null
          use_nickname?: boolean | null
          will_substitute?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_user_role: {
        Args: {
          lookup_role: string
        }
        Returns: boolean
      }
      has_league_permission: {
        Args: {
          league_uuid: string
          required_permission: string
        }
        Returns: boolean
      }
      is_league_admin: {
        Args: {
          league_uuid: string
        }
        Returns: boolean
      }
      is_league_secretary: {
        Args: {
          league_uuid: string
        }
        Returns: boolean
      }
      is_superuser:
        | {
            Args: Record<PropertyKey, never>
            Returns: boolean
          }
        | {
            Args: {
              user_id: string
            }
            Returns: boolean
          }
      is_team_captain: {
        Args: {
          league_uuid: string
        }
        Returns: boolean
      }
      manage_league_permission: {
        Args: {
          p_league_id: string
          p_user_id: string
          p_permission_type: string
        }
        Returns: undefined
      }
      manage_league_secretary: {
        Args: {
          p_league_id: string
          p_user_id: string
        }
        Returns: undefined
      }
      manage_team_secretary: {
        Args: {
          p_team_id: string
          p_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      game_format_enum:
        | "8-Ball"
        | "9-Ball"
        | "10-Ball"
        | "Straight Pool"
        | "One Pocket"
        | "Bank Pool"
      league_format_enum:
        | "Round Robin"
        | "Single Elimination"
        | "Double Elimination"
        | "Swiss"
        | "Swiss with Knockouts"
        | "Single Round Robin"
      player_position_enum: "forward" | "defense" | "substitute"
      player_status_enum: "active" | "inactive" | "suspended"
      team_status_enum: "active" | "inactive" | "pending"
      user_role:
        | "superuser"
        | "league_admin"
        | "league_secretary"
        | "team_captain"
        | "team_secretary"
        | "player"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: {
          bucketid: string
          name: string
          owner: string
          metadata: Json
        }
        Returns: undefined
      }
      extension: {
        Args: {
          name: string
        }
        Returns: string
      }
      filename: {
        Args: {
          name: string
        }
        Returns: string
      }
      foldername: {
        Args: {
          name: string
        }
        Returns: string[]
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: {
          size: number
          bucket_id: string
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          prefix_param: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
        }
        Returns: {
          key: string
          id: string
          created_at: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          bucket_id: string
          prefix_param: string
          delimiter_param: string
          max_keys?: number
          start_after?: string
          next_token?: string
        }
        Returns: {
          name: string
          id: string
          metadata: Json
          updated_at: string
        }[]
      }
      operation: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      search: {
        Args: {
          prefix: string
          bucketname: string
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
