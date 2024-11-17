"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import type { Database } from "@/lib/database.types";
import { OverviewTab } from "@/components/teamId/overview-tab";
import { ScheduleTab } from "@/components/team/schedule-tab";
import { StandingsTab } from "@/components/teamId/standings-tab";
import { PlayersTab } from "@/components/teamId/players-tab";
import type { Team } from "@/app/teams/types";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { AddPlayerDialog } from "@/components/teamId/add-player-dialog";
import { PlusIcon } from "@radix-ui/react-icons";

export default function TeamPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const teamId = params?.teamId as string;
  const supabase = createClientComponentClient<Database>();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, userRoles } = useUser();
  const [isAddPlayerDialogOpen, setIsAddPlayerDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchTeam = async () => {
      if (!teamId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("teams")
          .select(
            `
            *,
            team_permissions!team_permissions_team_id_fkey (
              id,
              user_id,
              permission_type,
              created_at,
              users:user_id (
                first_name,
                last_name
              )
            ),
            team_players (
              id,
              user_id,
              jersey_number,
              position,
              status,
              users (
                first_name,
                last_name,
                email
              )
            ),
            league:league_id (
              id,
              name,
              game_format
            )
          `
          )
          .eq("id", teamId)
          .single();

        if (error) throw error;
        setTeam(data as Team);
      } catch (error) {
        console.error("Error fetching team:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [teamId, supabase]);

  const handlePlayerAdded = () => {
    setIsAddPlayerDialogOpen(false);
    if (activeTab === "players") {
      const playersTabElement = document.querySelector('[data-tab="players"]');
      if (playersTabElement) {
        const event = new CustomEvent("refreshPlayers");
        playersTabElement.dispatchEvent(event);
      }
    }
  };

  const canAddPlayers = () => {
    if (!team || !user || !userRoles) return false;

    if (
      userRoles.includes("superuser") ||
      userRoles.includes("league_admin") ||
      userRoles.includes("league_secretary")
    ) {
      return true;
    }

    const userPermission = team.team_permissions?.find((permission) => permission.user_id === user.id);

    return userPermission?.permission_type === "team_captain" || userPermission?.permission_type === "team_secretary";
  };

  // Handle initial state from URL parameters
  useEffect(() => {
    const tab = searchParams.get("tab");
    const dialog = searchParams.get("dialog");

    if (tab) {
      setActiveTab(tab);
    }

    if (dialog === "add-players") {
      setIsAddPlayerDialogOpen(true);
    }
  }, [searchParams]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!team) {
    return <div>Team not found</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{team.name}</h1>
        {canAddPlayers() && <Button onClick={() => setIsAddPlayerDialogOpen(true)}>Add Players</Button>}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="standings">Standings</TabsTrigger>
          <TabsTrigger value="players">Players</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card className="p-6">
            <OverviewTab team={team} />
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <ScheduleTab teamId={team.id} />
        </TabsContent>

        <TabsContent value="standings">
          <Card className="p-6">
            <StandingsTab teamId={team.id} />
          </Card>
        </TabsContent>

        <TabsContent value="players">
          <Card className="p-6">
            <PlayersTab team={team} data-tab="players" />
          </Card>
        </TabsContent>
      </Tabs>

      <AddPlayerDialog
        teamId={team.id}
        isOpen={isAddPlayerDialogOpen}
        onOpenChange={setIsAddPlayerDialogOpen}
        onPlayerAdded={handlePlayerAdded}
      />
    </div>
  );
}
