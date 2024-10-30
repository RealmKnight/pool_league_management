-- Add new columns for league format and scheduling
alter table public.leagues 
  add column if not exists format text not null default 'round_robin',
  add column if not exists schedule jsonb not null default '{"type": "single_day", "days": [], "start_time": "19:00"}'::jsonb,
  add column if not exists estimated_weeks integer not null default 0,
  add column if not exists team_count integer not null default 8;

-- Drop existing constraints if they exist
do $$ 
begin
  if exists (select constraint_name 
             from information_schema.table_constraints 
             where table_name = 'leagues' and constraint_name = 'valid_format') then
    alter table public.leagues drop constraint valid_format;
  end if;

  if exists (select constraint_name 
             from information_schema.table_constraints 
             where table_name = 'leagues' and constraint_name = 'valid_schedule_type') then
    alter table public.leagues drop constraint valid_schedule_type;
  end if;

  if exists (select constraint_name 
             from information_schema.table_constraints 
             where table_name = 'leagues' and constraint_name = 'valid_schedule_days') then
    alter table public.leagues drop constraint valid_schedule_days;
  end if;

  if exists (select constraint_name 
             from information_schema.table_constraints 
             where table_name = 'leagues' and constraint_name = 'valid_team_count') then
    alter table public.leagues drop constraint valid_team_count;
  end if;

  if exists (select constraint_name 
             from information_schema.table_constraints 
             where table_name = 'leagues' and constraint_name = 'valid_rules_type') then
    alter table public.leagues drop constraint valid_rules_type;
  end if;
end $$;

-- Add each constraint separately
alter table public.leagues 
  add constraint valid_format 
    check (format in ('round_robin', 'bracket', 'swiss'));

alter table public.leagues 
  add constraint valid_schedule_type 
    check ((schedule->>'type')::text in ('single_day', 'multiple_days'));

alter table public.leagues 
  add constraint valid_schedule_days 
    check (
      jsonb_array_length(schedule->'days') <= 
      case when (schedule->>'type')::text = 'single_day' then 1
           else 3
      end
    );

alter table public.leagues 
  add constraint valid_team_count
    check (team_count >= 7 and team_count <= 128);

-- Update the rules type constraint
alter table public.leagues 
  drop constraint if exists valid_rules_type,
  add constraint valid_rules_type 
    check ((rules->>'type')::text in ('BCA', 'APA', 'Bar', 'House'));

-- Add index for better query performance
drop index if exists idx_leagues_format;
drop index if exists idx_leagues_team_count;
create index if not exists idx_leagues_format on public.leagues(format);
create index if not exists idx_leagues_team_count on public.leagues(team_count);

-- Update existing records to ensure they have valid data
update public.leagues
set 
  format = 'round_robin',
  schedule = '{"type": "single_day", "days": [], "start_time": "19:00"}'::jsonb,
  estimated_weeks = 0,
  team_count = 8
where format is null;

-- Comment on columns for documentation
comment on column public.leagues.format is 'League format: round_robin, bracket, or swiss';
comment on column public.leagues.schedule is 'League schedule configuration including type, days, and start time';
comment on column public.leagues.estimated_weeks is 'Estimated duration of the league in weeks';
comment on column public.leagues.team_count is 'Number of teams in the league (minimum 7)';