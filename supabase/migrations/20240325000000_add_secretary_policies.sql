-- Drop existing policies if they exist
DROP POLICY IF EXISTS "League admins can manage secretaries" ON "public"."league_permissions";

-- Create policy to allow league admins to manage secretaries
CREATE POLICY "League admins can manage secretaries" ON "public"."league_permissions"
FOR ALL
USING (
  -- Use the existing has_league_permission function which includes superuser check
  public.has_league_permission(league_id, 'league_admin')
)
WITH CHECK (
  -- Use the same function for insert/update checks
  public.has_league_permission(league_id, 'league_admin')
);

-- Enable RLS on the table if not already enabled
ALTER TABLE "public"."league_permissions" ENABLE ROW LEVEL SECURITY; 