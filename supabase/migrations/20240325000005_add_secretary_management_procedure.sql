-- Drop the procedure if it exists
DROP PROCEDURE IF EXISTS public.manage_league_secretary;

-- Create a function instead of a procedure
CREATE OR REPLACE FUNCTION public.manage_league_secretary(
    p_league_id UUID,
    p_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if the user has permission to manage secretaries
    IF NOT public.has_league_permission(p_league_id, 'league_admin') THEN
        RAISE EXCEPTION 'Permission denied';
    END IF;

    -- Remove existing secretary permissions for this league
    DELETE FROM public.league_permissions
    WHERE league_id = p_league_id
    AND permission_type = 'league_secretary';

    -- Add new secretary permission
    INSERT INTO public.league_permissions (
        league_id,
        user_id,
        permission_type
    ) VALUES (
        p_league_id,
        p_user_id,
        'league_secretary'
    );

    -- The trigger will handle updating the user's role
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.manage_league_secretary TO authenticated; 