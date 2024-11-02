-- Drop existing tables and their dependencies
DROP TABLE IF EXISTS league_secretaries;
DROP TABLE IF EXISTS league_admins;

-- Create new league_permissions table
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
  format TEXT NOT NULL, -- singles, doubles, etc.
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

-- Create specific permission check functions
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

-- Create RLS policies
ALTER TABLE league_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- League Permissions policies
CREATE POLICY "Allow read league_permissions"
  ON league_permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow superuser to manage league_permissions"
  ON league_permissions
  TO authenticated
  USING (is_superuser())
  WITH CHECK (is_superuser());

-- Teams policies
CREATE POLICY "Allow read teams"
  ON teams FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow league admin to manage teams"
  ON teams
  TO authenticated
  USING (is_league_admin(league_id))
  WITH CHECK (is_league_admin(league_id));

-- Similar policies for other tables... 