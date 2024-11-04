-- Add previous_role column to users table
ALTER TABLE public.users
ADD COLUMN previous_role user_role DEFAULT 'player';

-- Update existing users to have their current role as previous_role if not player
UPDATE public.users
SET previous_role = role
WHERE role != 'player' AND role IS NOT NULL;

-- Modify the secretary role trigger to handle previous_role
CREATE OR REPLACE FUNCTION public.update_user_role_on_secretary_assignment()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        -- When removing secretary role, restore previous role
        UPDATE public.users
        SET role = previous_role
        WHERE id = OLD.user_id
        AND role = 'league_secretary';
    ELSE
        -- Store current role as previous_role before updating to secretary
        UPDATE public.users
        SET 
            previous_role = CASE 
                WHEN role IN ('player', 'team_secretary', 'team_captain') THEN role
                ELSE previous_role  -- Keep existing previous_role for higher roles
            END,
            role = 'league_secretary'
        WHERE id = NEW.user_id
        AND (
            role IS NULL 
            OR role = 'player'
            OR role = 'team_secretary'
            OR role = 'team_captain'
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger
DROP TRIGGER IF EXISTS update_secretary_role_trigger ON public.league_permissions;

-- Create separate triggers for each operation
CREATE TRIGGER update_secretary_role_insert_trigger
    AFTER INSERT OR UPDATE
    ON public.league_permissions
    FOR EACH ROW
    WHEN (NEW.permission_type = 'league_secretary')
    EXECUTE FUNCTION public.update_user_role_on_secretary_assignment();

CREATE TRIGGER update_secretary_role_delete_trigger
    AFTER DELETE
    ON public.league_permissions
    FOR EACH ROW
    WHEN (OLD.permission_type = 'league_secretary')
    EXECUTE FUNCTION public.update_user_role_on_secretary_assignment(); 