import { useCallback, useEffect, useState, useRef } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";
import { useUser } from "@/hooks/use-user";

export function usePermissions() {
  const { user, userRoles } = useUser();
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient<Database>();
  const fetchedRef = useRef(false);

  // Fetch all permissions once and cache them
  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user?.id || fetchedRef.current) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("league_permissions")
          .select("permission_type")
          .eq("user_id", user.id)
          .returns<{ permission_type: string }[]>();

        if (error) throw error;

        const permMap: Record<string, boolean> = {};
        data.forEach((p: { permission_type: string }) => {
          permMap[p.permission_type] = true;
        });

        setPermissions(permMap);
        fetchedRef.current = true;
      } catch (error) {
        console.error("Error fetching permissions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [user?.id, supabase]);

  const hasPermission = useCallback(
    (type: string) => {
      if (!user) return false;
      if (userRoles?.includes("superuser")) return true;
      return permissions[type] || false;
    },
    [user, userRoles, permissions]
  );

  return { hasPermission, loading };
}
