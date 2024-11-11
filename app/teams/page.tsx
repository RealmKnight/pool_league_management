"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TeamCard } from "@/app/teams/components/team-card";
import { useTeams } from "@/app/teams/hooks/use-teams";
import type { Team } from "@/app/teams/types";
import { CaptainDialog } from "@/app/teams/components/captain-dialog";
import { SecretaryDialog } from "@/app/teams/components/secretary-dialog";
import type { AvailableCaptain } from "@/app/teams/types";
import { CreateTeamDialog, type CreateTeamData } from "@/app/teams/components/create-team-dialog";

export default function TeamsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = createClientComponentClient<Database>();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCaptainId, setSelectedCaptainId] = useState<string | null>(null);
  const [selectedSecretaryId, setSelectedSecretaryId] = useState<string | null>(null);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Use the custom hook
  const { teams, filteredTeams, loading, userRole, loadInitialData, handleSearch } = useTeams(user?.id);

  // Initial data loading
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Helper functions for permissions
  const isTeamCaptain = (team: Team, userId: string) => {
    return team.team_permissions?.some((p) => p.permission_type === "team_captain" && p.user_id === userId);
  };

  const canManageSecretaries = (team: Team, userId: string, userRole: string | null) => {
    return userRole === "superuser" || isTeamCaptain(team, userId);
  };

  const [captainDialog, setCaptainDialog] = useState({
    isOpen: false,
    teamId: null as string | null,
    isLoading: false,
    captains: [] as AvailableCaptain[],
  });

  const [secretaryDialog, setSecretaryDialog] = useState({
    isOpen: false,
    teamId: null as string | null,
    isLoading: false,
    users: [] as AvailableCaptain[],
  });

  const handleCaptainChange = async (teamId: string) => {
    setCaptainDialog((prev) => ({ ...prev, isOpen: true, teamId, isLoading: true }));
    try {
      const { data, error } = await supabase.from("users").select("id, first_name, last_name").order("first_name");

      if (error) throw error;

      setCaptainDialog((prev) => ({
        ...prev,
        isLoading: false,
        captains: data as AvailableCaptain[],
      }));
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch users",
      });
      setCaptainDialog((prev) => ({ ...prev, isOpen: false }));
    }
  };

  const handleSecretaryChange = async (teamId: string) => {
    setSecretaryDialog((prev) => ({ ...prev, isOpen: true, teamId, isLoading: true }));
    try {
      const { data, error } = await supabase.from("users").select("id, first_name, last_name").order("first_name");

      if (error) throw error;

      setSecretaryDialog((prev) => ({
        ...prev,
        isLoading: false,
        users: data as AvailableCaptain[],
      }));
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch users",
      });
      setSecretaryDialog((prev) => ({ ...prev, isOpen: false }));
    }
  };

  const handleIconClick = () => {
    setIsSearchVisible(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  // Hide the search input when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsSearchVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSaveCaptain = async (captainId: string) => {
    if (!captainDialog.teamId) return;

    try {
      // First check if the new captain already has this permission
      const { data: existingPermissions, error: checkError } = await supabase
        .from("team_permissions")
        .select("*")
        .eq("team_id", captainDialog.teamId)
        .eq("user_id", captainId)
        .eq("permission_type", "team_captain");

      if (checkError) throw checkError;

      if (existingPermissions && existingPermissions.length > 0) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "This user is already a captain for this team",
        });
        return;
      }

      // Remove old captain permissions
      const { error: deleteError } = await supabase
        .from("team_permissions")
        .delete()
        .eq("team_id", captainDialog.teamId)
        .eq("permission_type", "team_captain");

      if (deleteError) throw deleteError;

      // Add new captain permission
      const { error: insertError } = await supabase.from("team_permissions").insert({
        team_id: captainDialog.teamId,
        user_id: captainId,
        permission_type: "team_captain",
      });

      if (insertError) throw insertError;

      // Refresh the team data
      await loadInitialData();

      toast({
        title: "Success",
        description: "Team captain changed successfully",
      });
      setCaptainDialog((prev) => ({ ...prev, isOpen: false }));
    } catch (error) {
      console.error("Error changing team captain:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to change team captain",
      });
    }
  };

  const handleSaveSecretary = async (secretaryId: string) => {
    if (!secretaryDialog.teamId) return;

    try {
      // Use the stored procedure for managing team secretary
      const { error: procedureError } = await supabase.rpc("manage_team_secretary", {
        p_team_id: secretaryDialog.teamId,
        p_user_id: secretaryId,
      });

      if (procedureError) throw procedureError;

      // Refresh the team data
      await loadInitialData();

      toast({
        title: "Success",
        description: "Team secretary changed successfully",
      });
      setSecretaryDialog((prev) => ({ ...prev, isOpen: false }));
    } catch (error) {
      console.error("Error changing team secretary:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to change team secretary",
      });
    }
  };

  const canCreateTeam = () => {
    return (
      userRole === "superuser" ||
      userRole === "league_admin" ||
      userRole === "league_secretary" ||
      userRole === "team_captain"
    );
  };

  const [createDialog, setCreateDialog] = useState({
    isOpen: false,
    isLoading: false,
    availableCaptains: [] as AvailableCaptain[],
  });

  const handleCreateTeam = async (data: CreateTeamData) => {
    setCreateDialog((prev) => ({ ...prev, isLoading: true }));
    try {
      console.log("Creating team with data:", data); // Debug log

      // Validate user is logged in
      if (!user?.id) {
        throw new Error("User must be logged in to create a team");
      }

      // Prepare the team data according to the database schema
      const teamData: Database["public"]["Tables"]["teams"]["Insert"] = {
        name: data.name,
        format: data.format,
        home_venue: data.home_venue || null,
        max_players: data.max_players,
        created_by: user.id,
        league_id: data.league_id || null,
        status: data.status as Database["public"]["Enums"]["team_status_enum"],
      };

      console.log("Prepared team data:", teamData); // Debug log

      // Create the team
      const { data: createdTeam, error: teamError } = await supabase
        .from("teams")
        .insert(teamData)
        .select("*")
        .single();

      if (teamError) {
        console.error("Team creation error details:", {
          code: teamError.code,
          message: teamError.message,
          details: teamError.details,
          hint: teamError.hint,
        });
        throw new Error(`Failed to create team: ${teamError.message}`);
      }

      if (!createdTeam) {
        throw new Error("No team data returned after creation");
      }

      console.log("Team created successfully:", createdTeam); // Debug log

      // Refresh teams list
      await loadInitialData();

      toast({
        title: "Success",
        description: "Team created successfully. Please assign a captain.",
      });
      setCreateDialog((prev) => ({ ...prev, isOpen: false }));

      // Automatically open the captain dialog for the new team
      handleCaptainChange(createdTeam.id);
    } catch (error: any) {
      console.error("Error creating team - Full error:", {
        error,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        stack: error?.stack,
      });

      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to create team. Please check the console for details.",
      });
    } finally {
      setCreateDialog((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleCreateClick = async () => {
    if (userRole === "superuser") {
      // Load available captains for superuser
      try {
        const { data, error } = await supabase.from("users").select("id, first_name, last_name").order("first_name");

        if (error) throw error;

        setCreateDialog((prev) => ({
          ...prev,
          isOpen: true,
          availableCaptains: data as AvailableCaptain[],
        }));
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load available captains",
        });
      }
    } else {
      // Just open the dialog for team_captain
      setCreateDialog((prev) => ({ ...prev, isOpen: true }));
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex-grow text-center">
          <h3 className="text-lg font-medium">Teams</h3>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleIconClick} className="focus:outline-none pr-10">
            <Search className="h-5 w-5 text-muted-foreground" />
          </button>
          {canCreateTeam() && (
            <Button size="sm" onClick={handleCreateClick}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Team
            </Button>
          )}
        </div>
      </div>

      <div
        className={`transition-all duration-300 ease-in-out ${
          isSearchVisible ? "max-h-20" : "max-h-0 overflow-hidden"
        }`}
      >
        <div className="flex justify-center mb-4">
          <div className="w-1/2 md:w-1/3">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search teams..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                handleSearch(e.target.value);
              }}
              className="w-full"
              id="search-teams"
              name="search-teams"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTeams.map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            userRole={userRole}
            onCaptainChange={handleCaptainChange}
            onSecretaryChange={handleSecretaryChange}
            canManageSecretaries={canManageSecretaries(team, user?.id || "", userRole)}
            userId={user?.id || ""}
          />
        ))}
      </div>

      <CaptainDialog
        isOpen={captainDialog.isOpen}
        onOpenChange={(open) => setCaptainDialog((prev) => ({ ...prev, isOpen: open }))}
        onSave={handleSaveCaptain}
        availableCaptains={captainDialog.captains}
        isLoading={captainDialog.isLoading}
      />

      <SecretaryDialog
        isOpen={secretaryDialog.isOpen}
        onOpenChange={(open) => setSecretaryDialog((prev) => ({ ...prev, isOpen: open }))}
        onSave={handleSaveSecretary}
        availableUsers={secretaryDialog.users}
        isLoading={secretaryDialog.isLoading}
      />

      <CreateTeamDialog
        isOpen={createDialog.isOpen}
        onOpenChange={(open) => setCreateDialog((prev) => ({ ...prev, isOpen: open }))}
        onSave={handleCreateTeam}
        isSuperuser={userRole === "superuser"}
        availableCaptains={createDialog.availableCaptains}
        isLoading={createDialog.isLoading}
      />
    </div>
  );
}
