import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Team } from "../types";
import { Button } from "@/components/ui/button";
import { UserPlus, UserPlus2 } from "lucide-react";

interface TeamCardProps {
  team: Team;
  userRole: string | null;
  onCaptainChange: (teamId: string) => void;
  onSecretaryChange: (teamId: string) => void;
  canManageSecretaries: boolean;
  userId: string;
}

export const TeamCard: React.FC<TeamCardProps> = ({
  team,
  userRole,
  onCaptainChange,
  onSecretaryChange,
  canManageSecretaries,
  userId,
}) => {
  // Find captain and secretary from team permissions
  const captain = team.team_permissions?.find((p) => p.permission_type === "team_captain")?.users;
  const secretary = team.team_permissions?.find((p) => p.permission_type === "team_secretary")?.users;

  // Check if user can manage players
  const canManagePlayers =
    userRole === "superuser" ||
    userRole === "league_admin" ||
    userRole === "team_captain" ||
    userRole === "team_secretary" ||
    team.team_permissions?.some(
      (p) => p.user_id === userId && (p.permission_type === "team_captain" || p.permission_type === "team_secretary")
    );

  // Check if user is already a member of the team
  const isTeamMember = team.team_permissions?.some((p) => p.user_id === userId);

  // Check if team is open to join
  const canJoinTeam = team.status === "active" && !isTeamMember;

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
          {(userRole === "captain" ||
            userRole === "league_admin" ||
            userRole === "league_secretary" ||
            userRole === "superuser") && (
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
          {canManagePlayers && (
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = `/teams/${team.id}/players`;
              }}
            >
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
                window.location.href = `/teams/${team.id}/join`;
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
