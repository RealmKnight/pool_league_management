-- Add created_by column to teams table
ALTER TABLE public.teams
ADD COLUMN created_by UUID REFERENCES auth.users(id);

-- Update existing teams to have the current user as created_by (if needed)
UPDATE public.teams
SET created_by = auth.uid()
WHERE created_by IS NULL;

-- Make created_by NOT NULL after updating existing records
ALTER TABLE public.teams
ALTER COLUMN created_by SET NOT NULL;

-- Create the team_join_requests table first
CREATE TABLE IF NOT EXISTS public.team_join_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    league_id UUID NOT NULL REFERENCES public.leagues(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(league_id, team_id)
);

-- Enable RLS on the new table
ALTER TABLE public.team_join_requests ENABLE ROW LEVEL SECURITY;

-- Now create the policies
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

CREATE POLICY "League admins can update join requests"
    ON public.team_join_requests
    FOR UPDATE
    USING (
        public.has_league_permission(league_id, 'league_admin')
    ); 