-- Create function to update user role when assigned as league secretary
CREATE OR REPLACE FUNCTION public.update_user_role_on_secretary_assignment()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the user's role to league_secretary if they don't have a higher role
    UPDATE auth.users
    SET role = 'league_secretary'
    WHERE id = NEW.user_id
    AND (
        role IS NULL 
        OR role = 'player'
        OR role = 'team_secretary'
        OR role = 'team_captain'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update role when secretary is assigned
DROP TRIGGER IF EXISTS update_secretary_role_trigger ON public.league_permissions;

CREATE TRIGGER update_secretary_role_trigger
    AFTER INSERT OR UPDATE
    ON public.league_permissions
    FOR EACH ROW
    WHEN (NEW.permission_type = 'league_secretary')
    EXECUTE FUNCTION public.update_user_role_on_secretary_assignment(); 