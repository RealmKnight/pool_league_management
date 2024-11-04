-- First, create an enum for registration types
CREATE TYPE public.league_registration_type AS ENUM (
    'invite_only',
    'approval_required',
    'open'
);

-- Modify the leagues table to use the new enum
ALTER TABLE public.leagues 
    DROP COLUMN open_registration,
    ADD COLUMN registration_type league_registration_type NOT NULL DEFAULT 'invite_only';

-- Create a new table for team join requests
CREATE TABLE public.team_join_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(league_id, team_id)
);

-- Add RLS policies for team join requests
ALTER TABLE public.team_join_requests ENABLE ROW LEVEL SECURITY;

-- Policy for viewing join requests
CREATE POLICY "Users can view their own team's join requests"
    ON public.team_join_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.teams t
            WHERE t.id = team_id
            AND t.created_by = auth.uid()
        )
        OR
        public.has_league_permission(league_id, 'league_admin')
    );

-- Policy for creating join requests
CREATE POLICY "Teams can create join requests"
    ON public.team_join_requests
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.teams t
            WHERE t.id = team_id
            AND t.created_by = auth.uid()
        )
    );

-- Policy for updating join requests
CREATE POLICY "League admins can update join requests"
    ON public.team_join_requests
    FOR UPDATE
    USING (
        public.has_league_permission(league_id, 'league_admin')
    ); 