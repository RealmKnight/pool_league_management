-- Drop existing tables and their dependencies
DROP TABLE IF EXISTS league_secretaries CASCADE;
DROP TABLE IF EXISTS league_admins CASCADE;

-- Create league_permissions table
CREATE TABLE league_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  permission_type TEXT NOT NULL CHECK (
    permission_type IN (
      'league_admin',
      'league_secretary',
      'team_captain',
      'team_secretary'
    )
  ),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(league_id, user_id, permission_type)
);

-- Create teams table
CREATE TABLE teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  format TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create team_players table
CREATE TABLE team_players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Create matches table
CREATE TABLE matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  home_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  away_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  match_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (
    status IN ('scheduled', 'in_progress', 'completed', 'cancelled')
  ),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create games table
CREATE TABLE games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  home_player_id UUID REFERENCES users(id),
  away_player_id UUID REFERENCES users(id),
  home_score INTEGER,
  away_score INTEGER,
  game_number INTEGER NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (
    status IN ('scheduled', 'in_progress', 'completed', 'cancelled')
  ),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_league_permissions_league_id ON league_permissions(league_id);
CREATE INDEX idx_league_permissions_user_id ON league_permissions(user_id);
CREATE INDEX idx_teams_league_id ON teams(league_id);
CREATE INDEX idx_team_players_team_id ON team_players(team_id);
CREATE INDEX idx_team_players_league_id ON team_players(league_id);
CREATE INDEX idx_team_players_user_id ON team_players(user_id);
CREATE INDEX idx_matches_league_id ON matches(league_id);
CREATE INDEX idx_matches_home_team_id ON matches(home_team_id);
CREATE INDEX idx_matches_away_team_id ON matches(away_team_id);
CREATE INDEX idx_games_match_id ON games(match_id);
CREATE INDEX idx_games_league_id ON games(league_id);
CREATE INDEX idx_games_home_player_id ON games(home_player_id);
CREATE INDEX idx_games_away_player_id ON games(away_player_id);

-- Create RLS policies
ALTER TABLE league_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Create permission check functions
CREATE OR REPLACE FUNCTION public.is_superuser()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid()
    AND role = 'superuser'
  );
$$;

CREATE OR REPLACE FUNCTION public.has_league_permission(league_uuid UUID, required_permission TEXT)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM league_permissions
    WHERE league_id = league_uuid
    AND user_id = auth.uid()
    AND permission_type = required_permission
  ) OR (SELECT is_superuser());
$$;

CREATE OR REPLACE FUNCTION public.is_league_admin(league_uuid UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT public.has_league_permission(league_uuid, 'league_admin');
$$;

CREATE OR REPLACE FUNCTION public.is_league_secretary(league_uuid UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT public.has_league_permission(league_uuid, 'league_secretary');
$$;

CREATE OR REPLACE FUNCTION public.is_team_captain(league_uuid UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT public.has_league_permission(league_uuid, 'team_captain');
$$;

-- Create basic RLS policies
CREATE POLICY "Enable read for authenticated users"
ON league_permissions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable read for authenticated users"
ON teams FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable read for authenticated users"
ON team_players FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable read for authenticated users"
ON matches FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable read for authenticated users"
ON games FOR SELECT
TO authenticated
USING (true);

-- Migrate existing league admins to league_permissions
INSERT INTO league_permissions (league_id, user_id, permission_type)
SELECT league_id, user_id, 'league_admin'
FROM league_admins;

-- Update user roles enum
ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
ADD CONSTRAINT users_role_check
CHECK (role IN ('superuser', 'league_admin', 'league_secretary', 'team_captain', 'team_secretary', 'player')); 