-- Add new columns to leagues table
alter table public.leagues add column if not exists format text not null default 'round_robin';
alter table public.leagues add column if not exists schedule jsonb not null default '{
  "type": "single_day",
  "days": [],
  "start_time": "19:00"
}'::jsonb;
alter table public.leagues add column if not exists estimated_weeks integer not null default 0;
alter table public.leagues add column if not exists team_count integer not null default 8;

-- Add check constraints
alter table public.leagues add constraint valid_format 
  check (format in ('round_robin', 'bracket', 'swiss'));

alter table public.leagues add constraint valid_schedule_type 
  check (
    (schedule->>'type')::text in ('single_day', 'multiple_days')
  );

alter table public.leagues add constraint valid_schedule_days 
  check (
    jsonb_array_length(schedule->'days') <= 
    case when (schedule->>'type')::text = 'single_day' then 1
         else 3
    end
  ); 