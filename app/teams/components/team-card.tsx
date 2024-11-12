import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Team } from "../types";
import { Button } from "@/components/ui/button";
import { UserPlus, UserPlus2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Database } from "@/lib/database.types";

interface TeamCardProps {
  team: Team;
  userRole: Database["public"]["Enums"]["user_role"] | null;
  onCaptainChange: (teamId: string) => void;
  onSecretaryChange: (teamId: string) => void;
  canManageSecretaries: boolean;
  userId: string;
  isTeamMember: boolean;
  isInLeague: boolean;
}

export const TeamCard: React.FC<TeamCardProps> = React.memo(
  ({ team, userRole, onCaptainChange, onSecretaryChange, canManageSecretaries, userId, isTeamMember, isInLeague }) => {
    const router = useRouter();

    // Find captain and secretary from team permissions
    const captain = team.team_permissions?.find((p) => p.permission_type === "team_captain")?.users;
    const secretary = team.team_permissions?.find((p) => p.permission_type === "team_secretary")?.users;

    const canManagePlayers = () => {
      // Global roles that can manage players
      if (userRole === "superuser" || userRole === "league_admin" || userRole === "league_secretary") {
        return true;
      }

      // Team-specific roles that can manage players
      const userPermission = team.team_permissions?.find((permission) => permission.user_id === userId);

      return userPermission?.permission_type === "team_captain" || userPermission?.permission_type === "team_secretary";
    };

    const canManageCaptain = () => {
      return userRole === "superuser" || userRole === "league_admin" || userRole === "league_secretary";
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

            {canManageSecretaries && (
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

            {canJoinTeam && (
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
  }
);

TeamCard.displayName = "TeamCard";
