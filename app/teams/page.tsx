"use client";

import { useState, useEffect, useRef, Suspense, useMemo } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { toast, useToast } from "@/hooks/use-toast";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TeamCard } from "@/components/team/team-card";
import { useTeams } from "@/hooks/use-teams";
import type { TeamWithRelations, AvailableCaptain } from "@/lib/teams";
import { CaptainDialog } from "@/components/team/captain-dialog";
import { SecretaryDialog } from "@/components/team/secretary-dialog";
import { CreateTeamDialog, type CreateTeamData } from "@/components/team/create-team-dialog";
import { LoadingTeams } from "@/components/team/loading-teams";

const handleError = (error: unknown, message: string) => {
  console.error(error);
  toast({
    variant: "destructive",
    title: "Error",
    description: message,
  });
};

export default function TeamsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = createClientComponentClient<Database>();
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [userTeamMemberships, setUserTeamMemberships] = useState<Record<string, boolean>>({});

  // Dialog states
  const [captainDialog, setCaptainDialog] = useState<{
    isOpen: boolean;
    teamId: string | null;
    isLoading: boolean;
    captains: AvailableCaptain[];
    currentCaptainId: string | null;
  }>({
    isOpen: false,
    teamId: null,
    isLoading: false,
    captains: [],
    currentCaptainId: null,
  });

  const [secretaryDialog, setSecretaryDialog] = useState({
    isOpen: false,
    teamId: null as string | null,
    isLoading: false,
    users: [] as AvailableCaptain[],
  });

  const [createDialog, setCreateDialog] = useState({
    isOpen: false,
    isLoading: false,
    availableCaptains: [] as AvailableCaptain[],
  });

  // Use the custom hook
  const { teams, filteredTeams, loading, error, userRole, loadInitialData, handleSearch } = useTeams(user?.id);

  // Initial data loading
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // If there's an error, show it
  useEffect(() => {
    if (error instanceof Error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load teams data",
      });
    }
  }, [error, toast]);

  // Handler functions
  const handleCaptainChange = async (teamId: string) => {
    setCaptainDialog((prev) => ({ ...prev, isOpen: true, teamId, isLoading: true }));
    try {
      // Get current captain - use maybeSingle() instead of single() to handle no captain case
      const { data: currentCaptain } = await supabase
        .from("team_permissions")
        .select("user_id")
        .eq("team_id", teamId)
        .eq("permission_type", "team_captain")
        .maybeSingle();

      // Get available users
      const { data, error } = await supabase
        .from("users")
        .select("id, first_name, last_name")
        .order("first_name");

      if (error) throw error;

      setCaptainDialog((prev) => ({
        ...prev,
        isLoading: false,
        captains: data.map((user) => ({
          id: user.id,
          name: `${user.first_name} ${user.last_name}`.trim(),
        })),
        currentCaptainId: currentCaptain?.user_id || null,
      }));
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load available users",
      });
      setCaptainDialog((prev) => ({ ...prev, isOpen: false, isLoading: false }));
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

  const handleCreateTeam = async (data: CreateTeamData) => {
    if (!user?.id) return;

    setCreateDialog((prev) => ({ ...prev, isLoading: true }));
    try {
      // Prepare the team data
      const teamData: Database["public"]["Tables"]["teams"]["Insert"] = {
        name: data.name,
        format: data.format,
        home_venue: data.home_venue || null,
        max_players: data.max_players,
        created_by: user.id,
        league_id: data.league_id || null,
        status: data.status,
      };

      // Create the team
      const { data: createdTeam, error: teamError } = await supabase.from("teams").insert(teamData).select().single();

      if (teamError) throw teamError;

      // Refresh teams list
      await loadInitialData();

      toast({
        title: "Success",
        description: "Team created successfully",
      });
      setCreateDialog((prev) => ({ ...prev, isOpen: false }));

      // Automatically open the captain dialog for the new team
      handleCaptainChange(createdTeam.id);
    } catch (error: any) {
      console.error("Error creating team:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to create team",
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

  const canCreateTeam = () => {
    return (
      userRole === "superuser" ||
      userRole === "league_admin" ||
      userRole === "league_secretary" ||
      userRole === "team_captain"
    );
  };

  const canManageSecretaries = (team: TeamWithRelations, userId: string, userRole: string | null) => {
    return userRole === "superuser" || isTeamCaptain(team, userId);
  };

  const isTeamCaptain = (team: TeamWithRelations, userId: string) => {
    return team.team_permissions?.some((p) => p.permission_type === "team_captain" && p.user_id === userId);
  };

  // Fetch user team memberships
  useEffect(() => {
    const fetchUserTeamMemberships = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase.from("team_players").select("team_id, league_id").eq("user_id", user.id);

        if (error) throw error;

        const memberships: Record<string, boolean> = {};
        data.forEach((membership) => {
          if (membership.team_id) memberships[membership.team_id] = true;
          if (membership.league_id) memberships[membership.league_id] = true;
        });

        setUserTeamMemberships(memberships);
      } catch (error) {
        console.error("Error fetching user team memberships:", error);
      }
    };

    fetchUserTeamMemberships();
  }, [user?.id, supabase]);

  // Memoize team cards to prevent unnecessary re-renders
  const teamCards = useMemo(() => {
    return filteredTeams.map((team) => (
      <TeamCard
        key={team.id}
        team={team}
        userRole={userRole}
        onCaptainChange={handleCaptainChange}
        onSecretaryChange={handleSecretaryChange}
        canManageSecretaries={canManageSecretaries}
        userId={user?.id || ""}
        isTeamMember={!!userTeamMemberships[team.id]}
        isInLeague={!!userTeamMemberships[team.league_id || ""]}
      />
    ));
  }, [filteredTeams, userRole, userTeamMemberships, user?.id]);

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

  const handleCaptainSave = async (captainId: string) => {
    if (!captainDialog.teamId) return;

    try {
      setIsUpdating(true);

      // Start a transaction
      const { data: currentCaptain } = await supabase
        .from("team_permissions")
        .select("user_id")
        .eq("team_id", captainDialog.teamId)
        .eq("permission_type", "team_captain")
        .maybeSingle();

      // 1. Update team permissions using RPC function
      const { error: captainError } = await supabase.rpc("manage_team_captain", {
        p_team_id: captainDialog.teamId,
        p_user_id: captainId,
      });

      if (captainError) throw captainError;

      // 2. Update new captain's role in public.users table
      const { error: newCaptainError } = await supabase
        .from("users")
        .update({ role: "team_captain" })
        .eq("id", captainId);

      if (newCaptainError) throw newCaptainError;

      // 3. Update previous captain's role to player if exists
      if (currentCaptain?.user_id && currentCaptain.user_id !== captainId) {
        const { error: prevCaptainError } = await supabase
          .from("users")
          .update({ role: "player" })
          .eq("id", currentCaptain.user_id);

        if (prevCaptainError) throw prevCaptainError;
      }

      await loadInitialData();

      toast({
        title: "Success",
        description: "Team captain updated successfully",
      });
    } catch (error) {
      handleError(error, "Failed to update team captain");
    } finally {
      setIsUpdating(false);
      setCaptainDialog((prev) => ({
        ...prev,
        isOpen: false,
        isLoading: false,
      }));
    }
  };

  const handleSaveSecretary = async (secretaryId: string) => {
    if (!secretaryDialog.teamId) return;

    try {
      setSecretaryDialog((prev) => ({ ...prev, isLoading: true }));

      // Start a transaction
      const { data: currentSecretary } = await supabase
        .from("team_permissions")
        .select("user_id")
        .eq("team_id", secretaryDialog.teamId)
        .eq("permission_type", "team_secretary")
        .single();

      // 1. Update team permissions using RPC function
      const { error: secretaryError } = await supabase.rpc("manage_team_secretary", {
        p_team_id: secretaryDialog.teamId,
        p_user_id: secretaryId,
      });

      if (secretaryError) throw secretaryError;

      // 2. Update new secretary's role in public.users table
      const { error: newSecretaryError } = await supabase
        .from("users")
        .update({ role: "team_secretary" })
        .eq("id", secretaryId);

      if (newSecretaryError) throw newSecretaryError;

      // 3. Update previous secretary's role to player if exists
      if (currentSecretary?.user_id && currentSecretary.user_id !== secretaryId) {
        const { error: prevSecretaryError } = await supabase
          .from("users")
          .update({ role: "player" })
          .eq("id", currentSecretary.user_id);

        if (prevSecretaryError) throw prevSecretaryError;
      }

      await loadInitialData();

      toast({
        title: "Success",
        description: "Team secretary updated successfully",
      });
    } catch (error) {
      handleError(error, "Failed to update team secretary");
    } finally {
      setSecretaryDialog((prev) => ({ ...prev, isLoading: false, isOpen: false }));
    }
  };

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

      <Suspense fallback={<LoadingTeams />}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{teamCards}</div>
      </Suspense>

      <CreateTeamDialog
        isOpen={createDialog.isOpen}
        onOpenChange={(open) => setCreateDialog((prev) => ({ ...prev, isOpen: open }))}
        onSave={handleCreateTeam}
        isSuperuser={userRole === "superuser"}
        availableCaptains={createDialog.availableCaptains}
        isLoading={createDialog.isLoading}
      />

      <CaptainDialog
        isOpen={captainDialog.isOpen}
        onOpenChange={(open) => setCaptainDialog((prev) => ({ ...prev, isOpen: open }))}
        teamId={captainDialog.teamId}
        availableCaptains={captainDialog.captains}
        isLoading={captainDialog.isLoading}
        onSave={handleCaptainSave}
        currentCaptainId={captainDialog.currentCaptainId}
      />

      <SecretaryDialog
        isOpen={secretaryDialog.isOpen}
        onOpenChange={(open) => setSecretaryDialog((prev) => ({ ...prev, isOpen: open }))}
        teamId={secretaryDialog.teamId}
        availableUsers={secretaryDialog.users}
        isLoading={secretaryDialog.isLoading}
        onSave={handleSaveSecretary}
      />
    </div>
  );
}
