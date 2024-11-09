"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddTeamDialog } from "./add-team-dialog";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import type { Database } from "@/lib/database.types";
import type { League } from "../types";

interface TeamsTabProps {
  league: League;
}

export function TeamsTab({ league }: TeamsTabProps) {
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [teams, setTeams] = useState<Array<{ id: string; name: string; home_venue: string | null }>>([]);
  const supabase = createClientComponentClient<Database>();
  const router = useRouter();

  // Fetch teams assigned to this league
  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from("teams")
        .select("id, name, home_venue")
        .eq("league_id", league.id)
        .order("name");

      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error("Error fetching teams:", error);
    }
  };

  // Add useEffect to fetch teams on mount
  useEffect(() => {
    fetchTeams();
  }, [league.id]);

  const handleTeamClick = (teamId: string) => {
    router.push(`/teams/${teamId}`);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Teams</CardTitle>
          <Button size="sm" onClick={() => setIsAddTeamOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Team
          </Button>
        </CardHeader>
        <CardContent>
          {teams.length === 0 ? (
            <div className="text-sm text-muted-foreground">No teams assigned yet</div>
          ) : (
            <div className="space-y-4">
              {teams.map((team) => (
                <div
                  key={team.id}
                  onClick={() => handleTeamClick(team.id)}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent hover:cursor-pointer transition-colors"
                >
                  <div>
                    <h4 className="font-medium">{team.name}</h4>
                    {team.home_venue && <p className="text-sm text-muted-foreground">Home Venue: {team.home_venue}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddTeamDialog
        isOpen={isAddTeamOpen}
        onOpenChange={setIsAddTeamOpen}
        leagueId={league.id}
        onSuccess={fetchTeams}
      />
    </div>
  );
}
