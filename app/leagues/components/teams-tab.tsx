"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { LoadingState } from "./loading-state";
import { ErrorState } from "./error-state";
import { useAuth } from "@/components/providers/auth-provider";
import type { League } from "../types";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";

interface TeamsTabProps {
  league: League;
}

export function TeamsTab({ league }: TeamsTabProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Helper function to check if user has permission
  const canManageTeams = () => {
    if (!user?.id) return false;

    // Check if user is superuser
    if (userRole === "superuser") return true;

    // Check league permissions
    return league.league_permissions?.some(
      (p) => p.user_id === user.id && (p.permission_type === "league_admin" || p.permission_type === "league_secretary")
    );
  };

  useEffect(() => {
    const loadUserRole = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const supabase = createClientComponentClient<Database>();
        const { data, error } = await supabase.from("users").select("role").eq("id", user.id).single();

        if (error) throw error;
        setUserRole(data.role);
      } catch (error) {
        console.error("Error loading user role:", error);
        setError("Failed to load user permissions");
      } finally {
        setLoading(false);
      }
    };

    loadUserRole();
  }, [user?.id]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Teams</CardTitle>
        {canManageTeams() && (
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Team
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {/* Teams list will go here */}
        <div className="text-sm text-muted-foreground">No teams added yet</div>
      </CardContent>
    </Card>
  );
}
