"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddTeamDialog } from "@/components/league/add-team-dialog";
import { CaptainDialog } from "@/components/team/captain-dialog";
import type { TeamWithRelations, AvailableCaptain } from "@/lib/teams";
import type { League } from "@/app/leagues/types";
import type { MouseEvent } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";
import { useToast } from "@/hooks/use-toast";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import Link from "next/link";

interface TeamsTabProps {
  league: League;
}

export function TeamsTab({ league }: TeamsTabProps) {
  const [teams, setTeams] = useState<TeamWithRelations[]>([]);
  const [availableTeams, setAvailableTeams] = useState<TeamWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [addTeamDialog, setAddTeamDialog] = useState({
    isOpen: false,
  });
  const [canManageTeams, setCanManageTeams] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamWithRelations | null>(null);
  const [isCaptainDialogOpen, setIsCaptainDialogOpen] = useState(false);
  const [availableCaptains, setAvailableCaptains] = useState<AvailableCaptain[]>([]);
  const [userRole, setUserRole] = useState<Database["public"]["Enums"]["user_role"] | null>(null);
  
  const supabase = createClientComponentClient<Database>();
  const { toast } = useToast();

  const canManageCaptains = userRole && ["superuser", "league_admin", "league_secretary"].includes(userRole);

  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        setUserRole(userData?.role || null);
      }
    };
    fetchUserRole();
  }, [supabase]);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user?.id) throw new Error("No user found");

        // Fetch teams in the league
        const { data: leagueTeams, error: leagueTeamsError } = await supabase
          .from("teams")
          .select(`
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
          `)
          .eq("league_id", league.id);

        if (leagueTeamsError) throw leagueTeamsError;

        // Fetch available teams (teams not in this league)
        const { data: otherTeams, error: otherTeamsError } = await supabase
          .from("teams")
          .select(`
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
          `)
          .is("league_id", null);

        if (otherTeamsError) throw otherTeamsError;

        // Check if user can manage teams
        const { data: userPermissions, error: permissionsError } = await supabase
          .from("league_permissions")
          .select("permission_type")
          .eq("league_id", league.id)
          .eq("user_id", user.id);

        if (permissionsError) throw permissionsError;

        const hasLeaguePermission = userPermissions?.some(
          (p) => p.permission_type === "admin" || p.permission_type === "secretary"
        ) ?? false;

        // Check if user is a superuser
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        const isSuperuser = userData?.role === 'superuser';
        
        setTeams(leagueTeams as TeamWithRelations[] ?? []);
        setAvailableTeams(otherTeams as TeamWithRelations[] ?? []);
        setCanManageTeams(hasLeaguePermission || isSuperuser);
      } catch (error) {
        console.error("Error fetching teams:", error);
        toast({
          title: "Error",
          description: "Failed to load teams. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [league.id, supabase, toast]);

  const fetchAvailableCaptains = async (teamId: string) => {
    try {
      // First, get all current team captains in this league
      const { data: leagueCaptains, error: captainsError } = await supabase
        .from('team_permissions')
        .select(`
          user_id,
          teams!inner (
            league_id
          )
        `)
        .eq('permission_type', 'team_captain')
        .eq('teams.league_id', league.id);

      if (captainsError) throw captainsError;

      // Get the list of user IDs who are already captains in this league
      const existingCaptainIds = new Set(leagueCaptains?.map(c => c.user_id) ?? []);

      // Get all users except those who are already captains in this league
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .order('first_name');

      if (usersError) throw usersError;

      // Filter out users who are already captains in this league
      // except for the current team's captain (if any)
      const currentTeamCaptain = teams
        .find(t => t.id === teamId)
        ?.team_permissions
        ?.find(p => p.permission_type === 'team_captain')
        ?.user_id;

      const mappedCaptains = (users ?? [])
        .filter(user => !existingCaptainIds.has(user.id) || user.id === currentTeamCaptain)
        .map(user => ({
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name
        }));

      setAvailableCaptains(mappedCaptains);
    } catch (error) {
      console.error('Error fetching available captains:', error);
      toast({
        title: "Error fetching available captains",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const handleCaptainClick = async (team: TeamWithRelations) => {
    if (!canManageCaptains) return;
    
    setSelectedTeam(team);
    await fetchAvailableCaptains(team.id);
    setIsCaptainDialogOpen(true);
  };

  const handleSaveCaptain = async (captainId: string) => {
    if (!selectedTeam) return;

    try {
      // Remove existing captain permission if any
      const { error: deleteError } = await supabase
        .from('team_permissions')
        .delete()
        .eq('team_id', selectedTeam.id)
        .eq('permission_type', 'team_captain')
        .select();

      if (deleteError) throw deleteError;

      // Add new captain permission
      const { error: insertError } = await supabase
        .from('team_permissions')
        .insert({
          team_id: selectedTeam.id,
          user_id: captainId,
          permission_type: 'team_captain'
        });

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "Team captain updated successfully",
      });

      // Refresh teams list
      await refreshTeams();
    } catch (error) {
      console.error('Error updating captain:', error);
      toast({
        title: "Error",
        description: "Failed to update team captain",
        variant: "destructive",
      });
    }
  };

  const refreshTeams = async () => {
    setLoading(true);
    try {
      const { data: leagueTeams, error: leagueTeamsError } = await supabase
        .from("teams")
        .select(`
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
        `)
        .eq("league_id", league.id);

      if (leagueTeamsError) throw leagueTeamsError;

      setTeams(leagueTeams as TeamWithRelations[] ?? []);
    } catch (error) {
      console.error("Error fetching teams:", error);
      toast({
        title: "Error",
        description: "Failed to load teams. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTeamAdded = () => {
    refreshTeams();
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-8">
      {canManageTeams && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setAddTeamDialog({ isOpen: true })}>
            <Plus className="h-4 w-4 mr-2" />
            Add Team
          </Button>
        </div>
      )}

      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team Name</TableHead>
              <TableHead>Venue</TableHead>
              <TableHead>Captain</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.map((team) => {
              const captain = team.team_permissions?.find(
                (p) => p.permission_type === "team_captain"
              )?.users;

              const captainName = captain 
                ? `${captain.first_name || ''} ${captain.last_name || ''}`.trim() || 'Unknown'
                : "No Captain";

              return (
                <TableRow 
                  key={team.id} 
                  className="group cursor-pointer"
                  onClick={(e: MouseEvent<HTMLTableRowElement>) => {
                    // Only navigate if we didn't click the captain cell
                    if (!(e.target as HTMLElement).closest('.captain-cell')) {
                      window.location.href = `/teams/${team.id}`;
                    }
                  }}
                >
                  <TableCell className="group-hover:underline">
                    {team.name}
                  </TableCell>
                  <TableCell>
                    {team.home_venue || "No Venue"}
                  </TableCell>
                  <TableCell 
                    className={`captain-cell ${canManageCaptains ? "cursor-pointer hover:underline" : ""}`}
                    onClick={(e: MouseEvent<HTMLTableCellElement>) => {
                      e.stopPropagation();
                      if (canManageCaptains) {
                        handleCaptainClick(team);
                      }
                    }}
                  >
                    {captainName}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AddTeamDialog
        isOpen={addTeamDialog.isOpen}
        onOpenChange={(open) => setAddTeamDialog({ isOpen: open })}
        onSuccess={handleTeamAdded}
        leagueId={league.id}
        availableTeams={availableTeams}
      />

      <CaptainDialog
        isOpen={isCaptainDialogOpen}
        onOpenChange={setIsCaptainDialogOpen}
        onSave={handleSaveCaptain}
        availableCaptains={availableCaptains}
        teamId={selectedTeam?.id}
        currentCaptainId={selectedTeam?.team_permissions?.find(p => p.permission_type === 'team_captain')?.user_id ?? null}
        isLoading={loading}
      />
    </div>
  );
}
