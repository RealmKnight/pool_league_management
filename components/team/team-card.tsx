import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, UserPlus2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Database } from "@/lib/database.types";
import type { TeamWithRelations } from "@/lib/teams";

interface TeamCardProps {
  team: TeamWithRelations;
  userRole: Database["public"]["Enums"]["user_role"] | null;
  onCaptainChange: (teamId: string) => void;
  onSecretaryChange: (teamId: string) => void;
  canManageSecretaries: (team: TeamWithRelations, userId: string, userRole: string | null) => boolean;
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
      // Team specific roles that can manage players
      return team.team_permissions?.some(
        (p) =>
          p.user_id === userId &&
          (p.permission_type === "team_captain" || p.permission_type === "team_secretary")
      );
    };

    const canManageCaptain = () => {
      return userRole === "superuser" || userRole === "league_admin";
    };

    const canJoinTeam = team.status === "active" && !isTeamMember && !isInLeague;

    const handleAddPlayers = (e: React.MouseEvent) => {
      e.preventDefault();
      router.push(`/teams/${team.id}/players`);
    };

    return (
      <Card className="group hover:shadow-lg transition-shadow cursor-pointer" onClick={() => router.push(`/teams/${team.id}`)}>
        <CardHeader>
          <CardTitle>{team.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">Captain</p>
              <p className="text-sm text-gray-500">
                {captain ? `${captain.first_name} ${captain.last_name}` : "No captain assigned"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Secretary</p>
              <p className="text-sm text-gray-500">
                {secretary ? `${secretary.first_name} ${secretary.last_name}` : "No secretary assigned"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
              {canManagePlayers() && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleAddPlayers}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Manage Players
                </Button>
              )}
              {canManageCaptain() && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.preventDefault();
                    onCaptainChange(team.id);
                  }}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Manage Captain
                </Button>
              )}
              {canManageSecretaries(team, userId, userRole) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.preventDefault();
                    onSecretaryChange(team.id);
                  }}
                >
                  <UserPlus2 className="h-4 w-4 mr-2" />
                  Manage Secretary
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);
