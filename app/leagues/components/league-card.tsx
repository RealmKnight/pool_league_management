import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Calendar, Trophy } from "lucide-react";
import type { League } from "../types";
import { useRouter } from "next/navigation";

interface LeagueCardProps {
  league: League;
  userRole: string | null;
  onAdminChange: (leagueId: string) => void;
  onSecretaryChange: (leagueId: string) => void;
  canManageSecretaries: boolean;
  userId: string;
}

export function LeagueCard({
  league,
  userRole,
  onAdminChange,
  onSecretaryChange,
  canManageSecretaries,
  userId,
}: LeagueCardProps) {
  const router = useRouter();

  const handleNavigation = (leagueId: string, tab?: string) => {
    const baseUrl = `/leagues/${leagueId}`;
    const url = tab ? `${baseUrl}?tab=${tab}` : baseUrl;
    router.push(url);
  };

  // Helper function to get formatted name
  const getFormattedName = (permission_type: string) => {
    const permission = league.league_permissions?.find((p) => p.permission_type === permission_type);
    if (!permission?.users) return "Not Assigned";
    const { first_name, last_name } = permission.users;
    return `${first_name || ""} ${last_name || ""}`.trim() || "Not Assigned";
  };

  return (
    <Card className="cursor-pointer" onClick={() => handleNavigation(league.id)}>
      <CardHeader>
        <CardTitle>{league.name}</CardTitle>
        <CardDescription>{league.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span>Season: </span>
            <span>
              {league.season_start && league.season_end
                ? `${new Date(league.season_start).toLocaleDateString()} - ${new Date(
                    league.season_end
                  ).toLocaleDateString()}`
                : "No dates set"}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span>Administrator: </span>
            <span>{getFormattedName("league_admin")}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span>Secretary: </span>
            <span>{getFormattedName("league_secretary")}</span>
          </div>

          <div className="grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
            {userRole === "superuser" && (
              <Button variant="outline" className="w-full" onClick={() => onAdminChange(league.id)}>
                Change Admin
              </Button>
            )}
            {canManageSecretaries && (
              <Button variant="outline" className="w-full" onClick={() => onSecretaryChange(league.id)}>
                Change Secretary
              </Button>
            )}
            <Button variant="outline" className="w-full" onClick={() => handleNavigation(league.id, "teams")}>
              <Users className="mr-2 h-4 w-4" />
              Teams
            </Button>
            <Button variant="outline" className="w-full" onClick={() => handleNavigation(league.id, "schedule")}>
              <Calendar className="mr-2 h-4 w-4" />
              Schedule
            </Button>
            <Button variant="outline" className="w-full" onClick={() => handleNavigation(league.id, "standings")}>
              <Trophy className="mr-2 h-4 w-4" />
              Standings
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
