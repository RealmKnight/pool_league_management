import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Team } from "../types";
import { Button } from "@/components/ui/button";
import { UserPlus, UserPlus2 } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";
import { useState, useEffect } from "react";

interface TeamCardProps {
  team: Team;
  onCaptainChange: (teamId: string) => void;
  onSecretaryChange: (teamId: string) => void;
}

export const TeamCard: React.FC<TeamCardProps> = ({ team, onCaptainChange, onSecretaryChange }) => {
  const { user, userRoles } = useUser();
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const [isInLeague, setIsInLeague] = useState(false);
  const [loading, setLoading] = useState(true);

  // Find captain and secretary from team permissions
  const captain = team.team_permissions?.find((p) => p.permission_type === "team_captain")?.users;
  const secretary = team.team_permissions?.find((p) => p.permission_type === "team_secretary")?.users;

  const isTeamMember = team.team_permissions?.some((p) => p.user_id === user?.id);

  // Check if user is already in a team in this league
  useEffect(() => {
    const checkLeagueMembership = async () => {
      if (!user || !team.league_id) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("team_players")
          .select("id")
          .eq("user_id", user.id)
          .eq("league_id", team.league_id)
          .single();

        if (error && error.code !== "PGRST116") {
          // PGRST116 is the "no rows returned" error
          console.error("Error checking league membership:", error);
        }

        setIsInLeague(!!data);
      } catch (error) {
        console.error("Error checking league membership:", error);
      } finally {
        setLoading(false);
      }
    };

    checkLeagueMembership();
  }, [user, team.league_id, supabase]);

  const canManagePlayers = () => {
    if (!user || !userRoles) return false;

    // Global roles that can manage players
    if (
      userRoles.includes("superuser") ||
      userRoles.includes("league_admin") ||
      userRoles.includes("league_secretary")
    ) {
      return true;
    }

    // Team-specific roles that can manage players
    const userPermission = team.team_permissions?.find((permission) => permission.user_id === user.id);

    return userPermission?.permission_type === "team_captain" || userPermission?.permission_type === "team_secretary";
  };

  const canManageCaptain = () => {
    return (
      userRoles.includes("superuser") || userRoles.includes("league_admin") || userRoles.includes("league_secretary")
    );
  };

  const canManageSecretary = () => {
    return (
      userRoles.includes("superuser") || userRoles.includes("league_admin") || userRoles.includes("league_secretary")
    );
  };

  const canJoinTeam = team.status === "active" && !isTeamMember && !isInLeague;

  const handleAddPlayers = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/teams/${team.id}?tab=players&dialog=add-players`);
  };

  return (
    <Card className="group hover:shadow-lg transition-shadow">
      <Link href={`/teams/${team.id}`} className="block">
        <CardHeader>
          <CardTitle className="group-hover:text-primary transition-colors">{team.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">Home Venue:</p>
              <p className="text-sm text-muted-foreground">{team.home_venue || "N/A"}</p>
            </div>

            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">Status:</p>
              <p className="text-sm text-muted-foreground capitalize">{team.status}</p>
            </div>

            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">Format:</p>
              <p className="text-sm text-muted-foreground">{team.format}</p>
            </div>

            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">Team Captain:</p>
              <p className="text-sm text-muted-foreground">
                {captain ? `${captain.first_name} ${captain.last_name}` : "Not assigned"}
              </p>
            </div>

            <div className="flex justify-between items-center">
              <p className="text-sm font-medium">Team Secretary:</p>
              <p className="text-sm text-muted-foreground">
                {secretary ? `${secretary.first_name} ${secretary.last_name}` : "Not assigned"}
              </p>
            </div>
          </div>
        </CardContent>
      </Link>

      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2">
          {canManageCaptain() && (
            <Button
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                onCaptainChange(team.id);
              }}
            >
              Manage Captain
            </Button>
          )}

          {canManageSecretary() && (
            <Button
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                onSecretaryChange(team.id);
              }}
            >
              Manage Secretary
            </Button>
          )}

          {canManagePlayers() && (
            <Button size="sm" variant="secondary" onClick={handleAddPlayers}>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Players
            </Button>
          )}

          {!loading && canJoinTeam && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                router.push(`/teams/${team.id}/join`);
              }}
            >
              <UserPlus2 className="h-4 w-4 mr-2" />
              Join Team
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
