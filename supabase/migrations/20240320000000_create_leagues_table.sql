-- First drop all existing policies
do $$ 
begin
  -- Drop all policies for leagues table
  execute (
    select string_agg('drop policy if exists ' || quote_ident(policyname) || ' on public.leagues;', E'\n')
    from pg_policies 
    where schemaname = 'public' 
    and tablename = 'leagues'
  );
  
  -- Drop all policies for league_admins table
  execute (
    select string_agg('drop policy if exists ' || quote_ident(policyname) || ' on public.league_admins;', E'\n')
    from pg_policies 
    where schemaname = 'public' 
    and tablename = 'league_admins'
  );
end $$;

-- Create leagues table if it doesn't exist
create table if not exists public.leagues (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  rules jsonb default '{}'::jsonb,
  season_start timestamp with time zone,
  season_end timestamp with time zone,
  created_by uuid references auth.users(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create league_admins table if it doesn't exist
create table if not exists public.league_admins (
  id uuid primary key default uuid_generate_v4(),
  league_id uuid references public.leagues(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(league_id, user_id)
);

-- Enable RLS
alter table public.leagues enable row level security;
alter table public.league_admins enable row level security;

-- Leagues policies
-- Any authenticated user with a role in users table can read
create policy "leagues_read_policy"
on public.leagues for select
using (
  exists (
    select 1 
    from public.users 
    where id = auth.uid() 
    and role is not null
  )
);

-- Only users with superuser or league_admin role can create leagues
create policy "leagues_insert_policy"
on public.leagues for insert
with check (
  exists (
    select 1 
    from public.users 
    where id = auth.uid() 
    and role in ('superuser', 'league_admin')
  )
);

-- League owners and superusers can update leagues
create policy "leagues_update_policy"
on public.leagues for update
using (
  exists (
    select 1 
    from public.users 
    where id = auth.uid() 
    and (
      role = 'superuser' 
      or (created_by = auth.uid() and role in ('superuser', 'league_admin'))
    )
  )
);

-- League owners and superusers can delete leagues
create policy "leagues_delete_policy"
on public.leagues for delete
using (
  exists (
    select 1 
    from public.users 
    where id = auth.uid() 
    and (
      role = 'superuser' 
      or (created_by = auth.uid() and role in ('superuser', 'league_admin'))
    )
  )
);

-- League admins policies
-- Any authenticated user with a role can read league admins
create policy "league_admins_read_policy"
on public.league_admins for select
using (
  exists (
    select 1 
    from public.users 
    where id = auth.uid() 
    and role is not null
  )
);

-- League owners and superusers can add league admins
create policy "league_admins_insert_policy"
on public.league_admins for insert
with check (
  exists (
    select 1 
    from public.leagues l
    join public.users u on u.id = auth.uid()
    where l.id = league_id 
    and (
      u.role = 'superuser' 
      or (l.created_by = auth.uid() and u.role = 'league_admin')
    )
  )
);

-- League owners and superusers can update league admins
create policy "league_admins_update_policy"
on public.league_admins for update
using (
  exists (
    select 1 
    from public.leagues l
    join public.users u on u.id = auth.uid()
    where l.id = league_id 
    and (
      u.role = 'superuser' 
      or (l.created_by = auth.uid() and u.role = 'league_admin')
    )
  )
);

-- League owners and superusers can delete league admins
create policy "league_admins_delete_policy"
on public.league_admins for delete
using (
  exists (
    select 1 
    from public.leagues l
    join public.users u on u.id = auth.uid()
    where l.id = league_id 
    and (
      u.role = 'superuser' 
      or (l.created_by = auth.uid() and u.role = 'league_admin')
    )
  )
); 