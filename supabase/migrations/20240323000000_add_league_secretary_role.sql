-- Add a new role to the users table if it doesn't exist
alter table public.users 
  add column if not exists role text not null default 'player';

-- Create a unique constraint for league_secretary per league
create table if not exists public.league_secretaries (
  id uuid primary key default uuid_generate_v4(),
  league_id uuid references public.leagues(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(league_id)
); 