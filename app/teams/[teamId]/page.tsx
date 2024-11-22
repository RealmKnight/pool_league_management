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
import type { TeamWithRelations } from "@/lib/teams";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/use-user";
import { AddPlayerDialog } from "@/components/teamId/add-player-dialog";
import { PlusIcon } from "@radix-ui/react-icons";

export default function TeamPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const teamId = params?.teamId as string;
  const supabase = createClientComponentClient<Database>();
  const [team, setTeam] = useState<TeamWithRelations | null>(null);
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
            team_permissions (
              id,
              user_id,
              permission_type,
              users (
                id,
                first_name,
                last_name
              )
            )
          `
          )
          .eq("id", teamId)
          .single();

        if (error) throw error;

        setTeam(data);
      } catch (error) {
        console.error("Error fetching team:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeam();
  }, [teamId, supabase]);

  useEffect(() => {
    const tab = searchParams?.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Team Not Found</h1>
        <p className="text-gray-600">The team you are looking for does not exist.</p>
      </div>
    );
  }

  const canManagePlayers = userRoles?.includes("superuser") || 
    team.team_permissions?.some(
      (p) => p.user_id === user?.id && ["team_captain", "team_secretary"].includes(p.permission_type)
    );

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{team.name}</h1>
          {canManagePlayers && activeTab === "players" && (
            <Button onClick={() => setIsAddPlayerDialogOpen(true)} size="sm">
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Player
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="players">Players</TabsTrigger>
            <TabsTrigger value="standings">Standings</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <OverviewTab team={team} />
          </TabsContent>

          <TabsContent value="players" className="space-y-4">
            <PlayersTab team={team} />
          </TabsContent>

          <TabsContent value="standings" className="space-y-4">
            <StandingsTab teamId={team.id} />
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <ScheduleTab teamId={team.id} />
          </TabsContent>
        </Tabs>
      </Card>

      <AddPlayerDialog
        open={isAddPlayerDialogOpen}
        onOpenChange={setIsAddPlayerDialogOpen}
        teamId={team.id}
        onPlayerAdded={() => {
          // Trigger a refresh of the players list
          const playersTab = document.querySelector('[data-state="active"]');
          if (playersTab) {
            playersTab.dispatchEvent(new Event('refreshPlayers'));
          }
        }}
      />
    </div>
  );
}
