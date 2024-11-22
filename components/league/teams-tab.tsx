"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddTeamDialog } from "@/components/league/add-team-dialog";
import { CaptainDialog } from "@/components/team/captain-dialog";
import type { TeamWithRelations } from "@/lib/teams";
import type { AvailableCaptain } from "@/components/types";
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
import type { League } from "@/app/leagues/types";
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
  const [userRole, setUserRole] = useState<string | null>(null);
  
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
          .eq("user_id", user?.id);

        if (permissionsError) throw permissionsError;

        const hasLeaguePermission = userPermissions?.some(
          (p) => p.permission_type === "admin" || p.permission_type === "secretary"
        ) ?? false;

        // Check if user is a superuser
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user?.id)
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
      const existingCaptainIds = new Set(leagueCaptains.map(c => c.user_id));

      // Get all users except those who are already captains in this league
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, first_name, last_name, email')
        .order('first_name');

      if (usersError) throw usersError;

      console.log('Available users from DB:', users);
      console.log('Existing captain IDs in league:', Array.from(existingCaptainIds));

      // Filter out users who are already captains in this league
      // except for the current team's captain (if any)
      const currentTeamCaptain = teams
        .find(t => t.id === teamId)
        ?.team_permissions
        ?.find(p => p.permission_type === 'team_captain')
        ?.user_id;

      const mappedCaptains = users
        .filter(user => !existingCaptainIds.has(user.id) || user.id === currentTeamCaptain)
        .map(user => ({
          id: user.id,
          name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          email: user.email || '',
        }));

      console.log('Mapped available captains:', mappedCaptains);
      setAvailableCaptains(mappedCaptains);
    } catch (error: any) {
      console.error('Error fetching available captains:', error);
      toast({
        title: "Error fetching available captains",
        description: error.message,
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
      const { data: existingPermissions } = await supabase
        .from('team_permissions')
        .select('id')
        .eq('team_id', selectedTeam.id)
        .eq('permission_type', 'team_captain');

      if (existingPermissions?.length) {
        await supabase
          .from('team_permissions')
          .delete()
          .eq('team_id', selectedTeam.id)
          .eq('permission_type', 'team_captain');
      }

      // Add new captain permission
      await supabase
        .from('team_permissions')
        .insert({
          team_id: selectedTeam.id,
          user_id: captainId,
          permission_type: 'team_captain'
        });

      toast({
        title: "Success",
        description: "Team captain updated successfully",
      });

      // Refresh teams list
      setLoading(true);
      const fetchTeams = async () => {
        try {
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();

          if (userError) throw userError;

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
      fetchTeams();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update team captain",
        variant: "destructive",
      });
    }
  };

  const handleTeamAdded = () => {
    // Refresh teams list
    setLoading(true);
    const fetchTeams = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

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
    fetchTeams();
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
            {teams.map((team) => (
              <TableRow 
                key={team.id} 
                className="group cursor-pointer"
                onClick={(e) => {
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
                  onClick={(e) => {
                    e.stopPropagation();
                    if (canManageCaptains) {
                      handleCaptainClick(team);
                    }
                  }}
                >
                  {(() => {
                    const captain = team.team_permissions?.find(p => 
                      p.permission_type === "team_captain" && p.users
                    )?.users;
                    if (!captain) return "No Captain";
                    return `${captain.first_name || ''} ${captain.last_name || ''}`.trim() || "No Captain";
                  })()}
                </TableCell>
              </TableRow>
            ))}
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
        teamId={selectedTeam?.id}
        currentCaptainId={selectedTeam?.team_permissions?.find(p => p.permission_type === "team_captain")?.user_id}
        onSave={handleSaveCaptain}
        availableCaptains={availableCaptains}
        isLoading={loading}
      />
    </div>
  );
}
