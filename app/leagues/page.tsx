"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { LeagueCard } from "./components/league-card";
import { useLeagues } from "./hooks/use-leagues";
import type { League, LeagueFormat, LeagueRules, WeekDay } from "./types";
import { AdminDialog } from "./components/admin-dialog";
import { SecretaryDialog } from "./components/secretary-dialog";
import type { AvailableAdmin } from "./types";
import { CreateLeagueDialog } from "./components/create-league-dialog";

// Define the DB insert type
type LeagueInsert = Database["public"]["Tables"]["leagues"]["Insert"];

interface CreateLeagueFormData {
  name: string;
  description: string;
  format: LeagueFormat;
  rules: {
    allowed: LeagueRules[];
  };
  team_count: number;
  requires_approval: boolean;
  open_registration: boolean;
  created_by: string;
  estimated_weeks: number;
  season_start: string | null;
  season_end: string | null;
  schedule: {
    type: "multiple_days";
    days: Array<{
      day: string;
      start_time: string;
      end_time: string;
    }>;
  };
  admin_id?: string;
}

export default function LeaguesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = createClientComponentClient<Database>();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
  const [selectedSecretaryId, setSelectedSecretaryId] = useState<string | null>(null);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Use the custom hook
  const { leagues, filteredLeagues, loading, userRole, loadInitialData, handleSearch } = useLeagues(user?.id);

  // Initial data loading
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Helper functions for permissions
  const isLeagueAdmin = (league: League, userId: string) => {
    return league.league_permissions?.some((p) => p.permission_type === "league_admin" && p.user_id === userId);
  };

  const canManageSecretaries = (league: League, userId: string, userRole: string | null) => {
    return userRole === "superuser" || isLeagueAdmin(league, userId);
  };

  const [adminDialog, setAdminDialog] = useState({
    isOpen: false,
    leagueId: null as string | null,
    isLoading: false,
    admins: [] as AvailableAdmin[],
  });

  const [secretaryDialog, setSecretaryDialog] = useState({
    isOpen: false,
    leagueId: null as string | null,
    isLoading: false,
    users: [] as AvailableAdmin[],
  });

  const handleAdminChange = async (leagueId: string) => {
    setAdminDialog((prev) => ({ ...prev, isOpen: true, leagueId, isLoading: true }));
    try {
      const { data, error } = await supabase.from("users").select("id, first_name, last_name").order("first_name");

      if (error) throw error;

      setAdminDialog((prev) => ({
        ...prev,
        isLoading: false,
        admins: data as AvailableAdmin[],
      }));
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch users",
      });
      setAdminDialog((prev) => ({ ...prev, isOpen: false }));
    }
  };

  const handleSecretaryChange = async (leagueId: string) => {
    setSecretaryDialog((prev) => ({ ...prev, isOpen: true, leagueId, isLoading: true }));
    try {
      const { data, error } = await supabase.from("users").select("id, first_name, last_name").order("first_name");

      if (error) throw error;

      setSecretaryDialog((prev) => ({
        ...prev,
        isLoading: false,
        users: data as AvailableAdmin[],
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

  const handleSaveAdmin = async (adminId: string) => {
    if (!adminDialog.leagueId) return;

    try {
      // First check if the new admin already has this permission
      const { data: existingPermissions, error: checkError } = await supabase
        .from("league_permissions")
        .select("*")
        .eq("league_id", adminDialog.leagueId)
        .eq("user_id", adminId)
        .eq("permission_type", "league_admin");

      if (checkError) throw checkError;

      if (existingPermissions && existingPermissions.length > 0) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "This user is already an administrator for this league",
        });
        return;
      }

      // Remove old admin permissions
      const { error: deleteError } = await supabase
        .from("league_permissions")
        .delete()
        .eq("league_id", adminDialog.leagueId)
        .eq("permission_type", "league_admin");

      if (deleteError) throw deleteError;

      // Add new admin permission
      const { error: insertError } = await supabase.from("league_permissions").insert({
        league_id: adminDialog.leagueId,
        user_id: adminId,
        permission_type: "league_admin",
      });

      if (insertError) throw insertError;

      // Refresh the league data
      await loadInitialData();

      toast({
        title: "Success",
        description: "League administrator changed successfully",
      });
      setAdminDialog((prev) => ({ ...prev, isOpen: false }));
    } catch (error) {
      console.error("Error changing league admin:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to change league administrator",
      });
    }
  };

  const handleSaveSecretary = async (secretaryId: string) => {
    if (!secretaryDialog.leagueId) return;

    try {
      // Use the stored procedure for managing league secretary
      const { error: procedureError } = await supabase.rpc("manage_league_secretary", {
        p_league_id: secretaryDialog.leagueId,
        p_user_id: secretaryId,
      });

      if (procedureError) throw procedureError;

      // Refresh the league data
      await loadInitialData();

      toast({
        title: "Success",
        description: "League secretary changed successfully",
      });
      setSecretaryDialog((prev) => ({ ...prev, isOpen: false }));
    } catch (error) {
      console.error("Error changing league secretary:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to change league secretary",
      });
    }
  };

  const canCreateLeague = () => {
    return userRole === "superuser" || userRole === "league_admin";
  };

  const [createDialog, setCreateDialog] = useState({
    isOpen: false,
    isLoading: false,
  });

  const handleCreateLeague = async (data: CreateLeagueFormData) => {
    setCreateDialog((prev) => ({ ...prev, isLoading: true }));
    try {
      if (!user?.id) throw new Error("User not authenticated");

      // Transform the data to match the database schema exactly
      const leagueData: Database["public"]["Tables"]["leagues"]["Insert"] = {
        name: data.name,
        description: data.description || null,
        format: data.format,
        rules: {
          allowed: data.rules.allowed,
        },
        team_count: data.team_count,
        open_registration: !data.requires_approval,
        season_start: data.season_start,
        season_end: data.season_end,
        created_by: user.id,
        estimated_weeks: data.estimated_weeks || 12,
        schedule: data.schedule,
      };

      console.log("Creating league with data:", leagueData);

      // Create the league with explicit schema reference
      const { data: newLeague, error: leagueError } = await supabase
        .from("leagues")
        .insert(leagueData)
        .select(
          `
          *,
          league_permissions (
            id,
            user_id,
            permission_type,
            created_at,
            users (
              first_name,
              last_name
            )
          )
        `
        )
        .single();

      if (leagueError) {
        console.error("League creation error:", leagueError);
        throw leagueError;
      }

      console.log("League created:", newLeague);

      // Create the league permission
      const adminId = data.admin_id || user.id;
      const { error: permissionError } = await supabase.from("league_permissions").insert({
        league_id: newLeague.id,
        user_id: adminId,
        permission_type: "league_admin",
        created_at: new Date().toISOString(),
      });

      if (permissionError) {
        console.error("Permission creation error:", permissionError);
        throw permissionError;
      }

      // If superuser creating for someone else, add superuser as admin too
      if (userRole === "superuser" && data.admin_id && data.admin_id !== user.id) {
        const { error: superuserPermissionError } = await supabase.from("league_permissions").insert({
          league_id: newLeague.id,
          user_id: user.id,
          permission_type: "league_admin",
          created_at: new Date().toISOString(),
        });

        if (superuserPermissionError) {
          console.error("Superuser permission error:", superuserPermissionError);
          throw superuserPermissionError;
        }
      }

      await loadInitialData();
      toast({
        title: "Success",
        description: "League created successfully",
      });
      setCreateDialog((prev) => ({ ...prev, isOpen: false }));
    } catch (error: any) {
      console.error("Error creating league:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create league",
      });
    } finally {
      setCreateDialog((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleCreateClick = () => {
    // Just open the dialog - admin loading is now handled in the dialog component
    setCreateDialog((prev) => ({ ...prev, isOpen: true }));
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex-grow text-center">
          <h3 className="text-lg font-medium">Pool Leagues</h3>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleIconClick} className="focus:outline-none pr-10">
            <Search className="h-5 w-5 text-muted-foreground" />
          </button>
          {canCreateLeague() && (
            <Button size="sm" onClick={handleCreateClick}>
              <Plus className="h-4 w-4 mr-2" />
              Create New League
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
              placeholder="Search leagues..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                handleSearch(e.target.value);
              }}
              className="w-full"
              id="search-leagues"
              name="search-leagues"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredLeagues.map((league) => (
          <LeagueCard
            key={league.id}
            league={league}
            userRole={userRole}
            onAdminChange={handleAdminChange}
            onSecretaryChange={handleSecretaryChange}
            canManageSecretaries={canManageSecretaries(league, user?.id || "", userRole)}
            userId={user?.id || ""}
          />
        ))}
      </div>

      <AdminDialog
        isOpen={adminDialog.isOpen}
        onOpenChange={(open) => setAdminDialog((prev) => ({ ...prev, isOpen: open }))}
        onSave={handleSaveAdmin}
        availableAdmins={adminDialog.admins}
        isLoading={adminDialog.isLoading}
      />

      <SecretaryDialog
        isOpen={secretaryDialog.isOpen}
        onOpenChange={(open) => setSecretaryDialog((prev) => ({ ...prev, isOpen: open }))}
        onSave={handleSaveSecretary}
        availableUsers={secretaryDialog.users}
        isLoading={secretaryDialog.isLoading}
      />

      <CreateLeagueDialog
        isOpen={createDialog.isOpen}
        onOpenChange={(open) => setCreateDialog((prev) => ({ ...prev, isOpen: open }))}
        onSave={handleCreateLeague}
        isSuperuser={userRole === "superuser"}
        isLoading={createDialog.isLoading}
      />
    </div>
  );
}
