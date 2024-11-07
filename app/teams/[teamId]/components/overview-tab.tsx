import React from "react";
import type { Team } from "@/app/teams/types";

interface OverviewTabProps {
  team: Team;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ team }) => {
  const captain = team.team_permissions?.find((p) => p.permission_type === "team_captain")?.users;
  const secretary = team.team_permissions?.find((p) => p.permission_type === "team_secretary")?.users;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Team Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium">Game Format:</p>
            <p className="text-sm text-muted-foreground">{team.league?.game_format || "Not in a league"}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Team Format:</p>
            <p className="text-sm text-muted-foreground">{team.format}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Home Venue:</p>
            <p className="text-sm text-muted-foreground">{team.home_venue || "N/A"}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Status:</p>
            <p className="text-sm text-muted-foreground capitalize">{team.status}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Max Players:</p>
            <p className="text-sm text-muted-foreground">{team.max_players}</p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Team Management</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium">Team Captain:</p>
            <p className="text-sm text-muted-foreground">
              {captain ? `${captain.first_name} ${captain.last_name}` : "Not assigned"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Team Secretary:</p>
            <p className="text-sm text-muted-foreground">
              {secretary ? `${secretary.first_name} ${secretary.last_name}` : "Not assigned"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
