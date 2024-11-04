"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Plus, Settings, Users, Calendar, Trophy, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as Icons from "@/components/icons";
import { useRouter } from "next/navigation";

// Base type from database
type BaseLeague = Database["public"]["Tables"]["leagues"]["Row"];

// Update League type to match the database structure
type League = BaseLeague & {
  league_permissions: Array<{
    id: string;
    user_id: string;
    permission_type: string;
    created_at: string;
    users: {
      first_name: string | null;
      last_name: string | null;
    };
  }>;
};

type LeagueScheduleType = "single_day" | "multiple_days";
type LeagueFormat = "round_robin" | "bracket" | "swiss";
type WeekDay = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

interface LeagueSchedule {
  type: LeagueScheduleType;
  days: WeekDay[];
  start_time: string;
}

type LeagueRules = "BCA" | "APA" | "Bar" | "House";

// Move LeagueAdminDisplay component outside of loadInitialData
const LeagueAdminDisplay = ({ league }: { league: League }) => {
  return (
    <div className="flex justify-between text-sm">
      <span>Administrator: </span>
      <span>
        {league.league_permissions && league.league_permissions.find((p) => p.permission_type === "league_admin")?.users
          ? (() => {
              const admin = league.league_permissions.find((p) => p.permission_type === "league_admin");
              const adminName = `${admin?.users.first_name || ""} ${admin?.users.last_name || ""}`.trim();
              return adminName || "Not Found";
            })()
          : "Not Found"}
      </span>
    </div>
  );
};

// First, define the types at the top
type AvailableAdmin = {
  id: string;
  first_name: string;
  last_name: string;
};

type AdminDialogState = {
  isOpen: boolean;
  leagueId: string | null;
  isLoading: boolean;
  admins: AvailableAdmin[];
};

export default function LeaguesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [filteredLeagues, setFilteredLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);
  const [changeAdminDialogOpen, setChangeAdminDialogOpen] = useState(false);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | null>(null);
  // Add state for selected league secretary ID
  const [selectedSecretaryId, setSelectedSecretaryId] = useState<string | null>(null);
  // Add state for the dialog
  const [assignSecretaryDialogOpen, setAssignSecretaryDialogOpen] = useState(false);
  const [currentLeagueId, setCurrentLeagueId] = useState<string | null>(null);
  const [availableAdmins, setAvailableAdmins] = useState<
    Array<{
      id: string;
      first_name: string | null;
      last_name: string | null;
    }>
  >([]);

  const [newLeague, setNewLeague] = useState({
    name: "",
    description: "",
    rules: {
      has_bye_team: false,
      actual_team_count: 8,
      type: "BCA" as LeagueRules,
    },
    season_start: null as Date | null,
    season_end: null as Date | null,
    format: "round_robin" as LeagueFormat,
    schedule: {
      type: "single_day" as LeagueScheduleType,
      days: [] as WeekDay[],
      start_time: "19:00", // Default to 7 PM
    },
    estimated_weeks: 0,
    team_count: 8, // Default to 8 teams
    registration_type: "invite_only" as Database["public"]["Enums"]["league_registration_type"],
  });

  const supabase = createClientComponentClient<Database>();

  const loadInitialData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const [userResponse, leaguesResponse] = await Promise.all([
        supabase.from("users").select("role").eq("id", user.id).single(),
        supabase.from("leagues").select(`
          *,
          league_permissions!league_permissions_league_id_fkey (
            id,
            user_id,
            permission_type,
            created_at,
            users!league_permissions_user_id_fkey (
              first_name,
              last_name
            )
          )
        `),
      ]);

      if (userResponse.error) throw userResponse.error;
      if (leaguesResponse.error) throw leaguesResponse.error;

      setUserRole(userResponse.data.role);
      // Remove the filtering - show all leagues to all users
      const leaguesData = leaguesResponse.data;
      setLeagues(leaguesData);
      setFilteredLeagues(leaguesData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load data",
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, supabase, toast]);

  // Use a single useEffect for initial data loading
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Load available admins when dialog opens
  useEffect(() => {
    if (userRole === "superuser" && changeAdminDialogOpen) {
      fetchAvailableAdmins();
    }
  }, [userRole, changeAdminDialogOpen]);

  const canCreateLeague = userRole === "superuser" || userRole === "league_admin";

  // Add function to fetch available admins
  const fetchAvailableAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select(
          `
          id,
          first_name,
          last_name,
          email,
          role
        `
        )
        .order("first_name");
      if (error) {
        console.error("Error fetching users:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch users",
        });
        return;
      }

      setAvailableAdmins(data || []);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleCreateLeague = async () => {
    try {
      if (!user?.id) throw new Error("User not authenticated");
      if (!newLeague.name) throw new Error("League name is required");
      if (!userRole) throw new Error("User role not found");
      if (newLeague.schedule.days.length === 0) throw new Error("Please select at least one league day");

      // Validate user has correct role
      if (userRole !== "superuser" && userRole !== "league_admin") {
        throw new Error("You don't have permission to create leagues");
      }

      // Validate dates
      if (newLeague.season_start && newLeague.season_end) {
        if (new Date(newLeague.season_start) > new Date(newLeague.season_end)) {
          throw new Error("Season end date must be after start date");
        }
      }

      // Validate schedule
      if (newLeague.schedule.type === "single_day" && newLeague.schedule.days.length > 1) {
        throw new Error("Single day leagues can only have one day selected");
      }

      if (newLeague.schedule.type === "multiple_days" && newLeague.schedule.days.length > 3) {
        throw new Error("Multiple day leagues can have up to three days selected");
      }

      // Create the league
      const { data: leagueData, error: leagueError } = await supabase
        .from("leagues")
        .insert({
          name: newLeague.name,
          description: newLeague.description || null,
          rules: newLeague.rules || {},
          season_start: newLeague.season_start?.toISOString() || null,
          season_end: newLeague.season_end?.toISOString() || null,
          created_by: user.id,
          updated_at: new Date().toISOString(),
          format: newLeague.format,
          schedule: newLeague.schedule,
          estimated_weeks: newLeague.estimated_weeks,
          team_count: newLeague.team_count,
          registration_type: newLeague.registration_type,
        })
        .select()
        .single();

      if (leagueError) throw leagueError;

      // If superuser is creating the league and selected an admin
      if (userRole === "superuser" && selectedAdminId) {
        const { error: permissionError } = await supabase.from("league_permissions").insert({
          league_id: leagueData.id,
          user_id: selectedAdminId,
          permission_type: "league_admin",
        });

        if (permissionError) throw permissionError;
      }

      // Fetch the updated league data
      const { data: updatedLeague, error: fetchError } = await supabase
        .from("leagues")
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
        .eq("id", leagueData.id)
        .single();

      if (fetchError) throw fetchError;

      // Update states
      setLeagues([...leagues, updatedLeague]);
      setFilteredLeagues([...filteredLeagues, updatedLeague]);

      toast({
        title: "Success",
        description: "League created successfully",
      });

      // Reset form
      setNewLeague({
        name: "",
        description: "",
        rules: {
          has_bye_team: false,
          actual_team_count: 8,
          type: "BCA" as LeagueRules,
        },
        season_start: null,
        season_end: null,
        format: "round_robin",
        schedule: {
          type: "single_day",
          days: [],
          start_time: "19:00",
        },
        estimated_weeks: 0,
        team_count: 8,
        registration_type: "invite_only" as Database["public"]["Enums"]["league_registration_type"],
      });

      // Reset the admin selection
      setSelectedAdminId(null);
    } catch (error) {
      console.error("Error creating league:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create league",
      });
    }
  };

  const calculateEstimatedWeeks = (format: LeagueFormat, teamCount: number) => {
    switch (format) {
      case "round_robin":
        // Each team plays every other team twice (home and away)
        // Number of rounds = (n-1) * 2, where n is number of teams
        return (teamCount - 1) * 2;
      case "bracket":
        // Simple single elimination bracket, round up to next power of 2
        const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(teamCount)));
        return Math.ceil(Math.log2(nextPowerOf2));
      case "swiss":
        // Typically 5-7 rounds depending on team count
        return Math.min(7, Math.ceil(Math.log2(teamCount)) + 2);
      default:
        return 0;
    }
  };

  const TIME_OPTIONS = Array.from({ length: 24 * 2 }).map((_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? "00" : "30";
    return `${hour.toString().padStart(2, "0")}:${minute}`;
  });

  const handleTeamCountChange = (value: string) => {
    const teamCount = parseInt(value);
    if (isNaN(teamCount) || teamCount < 4) return; // Minimum 4 teams

    const actualTeamCount = teamCount % 2 === 0 ? teamCount : teamCount + 1; // Add bye team if odd
    const displayTeamCount = teamCount;

    setNewLeague({
      ...newLeague,
      team_count: displayTeamCount,
      rules: {
        ...newLeague.rules,
        has_bye_team: teamCount % 2 !== 0,
        actual_team_count: actualTeamCount,
      },
      estimated_weeks: calculateEstimatedWeeks(newLeague.format, actualTeamCount),
    });
  };

  // Add this helper function at component level
  const calculateEndDate = (startDate: Date, weeks: number) => {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + weeks * 7); // Add weeks * 7 days
    return endDate;
  };

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const searchTerm = e.target.value.toLowerCase();
      setSearchTerm(searchTerm);

      const filtered = leagues.filter(
        (league) =>
          league.name.toLowerCase().includes(searchTerm) || league.description?.toLowerCase().includes(searchTerm)
      );
      setFilteredLeagues(filtered);
    },
    [leagues]
  );

  // Function to open the dialog
  const openAssignSecretaryDialog = async (leagueId: string) => {
    setCurrentLeagueId(leagueId);

    try {
      const { data, error } = await supabase
        .from("users")
        .select(
          `
          id,
          first_name,
          last_name
        `
        )
        .order("first_name");

      if (error) {
        console.error("Error fetching users:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch users",
        });
        return;
      }

      setAvailableAdmins(data || []);
      setAssignSecretaryDialogOpen(true);
    } catch (error) {
      console.error("Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch users",
      });
    }
  };

  // Add new types
  type Permission = "league_admin" | "league_secretary" | "team_captain" | "team_secretary";

  type LeaguePermission = {
    id: string;
    league_id: string;
    user_id: string;
    permission_type: Permission;
    created_at: string;
  };

  // Update the handleChangeAdmin function to use new permissions
  const handleChangeAdmin = async (leagueId: string, newAdminId: string) => {
    try {
      // First check if the new admin already has this permission
      const { data: existingPermissions, error: checkError } = await supabase
        .from("league_permissions")
        .select("*")
        .eq("league_id", leagueId)
        .eq("user_id", newAdminId)
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
        .eq("league_id", leagueId)
        .eq("permission_type", "league_admin");

      if (deleteError) throw deleteError;

      // Add new admin permission
      const { error: insertError } = await supabase.from("league_permissions").insert({
        league_id: leagueId,
        user_id: newAdminId,
        permission_type: "league_admin",
      });

      if (insertError) throw insertError;

      // Refresh the league data
      await loadInitialData();

      toast({
        title: "Success",
        description: "League administrator changed successfully",
      });
      setChangeAdminDialogOpen(false);
      setSelectedAdminId(null);
    } catch (error) {
      console.error("Error changing league admin:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to change league administrator",
      });
    }
  };

  // Combine the related state
  const [adminDialog, setAdminDialog] = useState<AdminDialogState>({
    isOpen: false,
    leagueId: null,
    isLoading: false,
    admins: [],
  });

  // Replace the separate open function with a single handler
  const handleAdminDialogOpen = useCallback(
    async (leagueId: string) => {
      if (userRole !== "superuser") return;

      setAdminDialog((prev) => ({
        ...prev,
        isOpen: true,
        leagueId,
        isLoading: true,
        admins: [],
      }));

      try {
        const { data, error } = await supabase
          .from("users")
          .select(
            `
          id,
          first_name,
          last_name
        `
          )
          .order("first_name");

        if (error) throw error;

        const validAdmins = (data || []).filter(
          (admin): admin is AvailableAdmin => admin.first_name !== null && admin.last_name !== null
        );

        setAdminDialog((prev) => ({
          ...prev,
          isLoading: false,
          admins: validAdmins,
        }));
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch users",
        });
        handleAdminDialogClose();
      }
    },
    [userRole, supabase, toast]
  );

  // Add a close handler
  const handleAdminDialogClose = useCallback(() => {
    setAdminDialog((prev) => ({
      ...prev,
      isOpen: false,
      leagueId: null,
      admins: [],
    }));
    setSelectedAdminId(null);
  }, []);

  // Create a memoized dialog component
  const AdminDialog = useMemo(() => {
    const handleSave = async () => {
      if (!adminDialog.leagueId || !selectedAdminId) return;
      await handleChangeAdmin(adminDialog.leagueId, selectedAdminId);
      handleAdminDialogClose();
    };

    return (
      <Dialog open={adminDialog.isOpen} onOpenChange={(open) => !open && handleAdminDialogClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change League Administrator</DialogTitle>
          </DialogHeader>
          {adminDialog.isLoading ? (
            <div className="flex justify-center p-4">
              <Icons.spinner className="h-6 w-6" />
            </div>
          ) : (
            <>
              <Select value={selectedAdminId || undefined} onValueChange={setSelectedAdminId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an administrator" />
                </SelectTrigger>
                <SelectContent>
                  {adminDialog.admins.map((admin) => (
                    <SelectItem key={admin.id} value={admin.id}>
                      {`${admin.first_name} ${admin.last_name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <DialogFooter>
                <Button variant="outline" onClick={handleAdminDialogClose}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={!selectedAdminId}>
                  Save
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    );
  }, [adminDialog, selectedAdminId, handleAdminDialogClose, handleChangeAdmin]);

  // First, add these helper functions near the top of the component
  const isLeagueAdmin = (league: League, userId: string) => {
    return league.league_permissions?.some((p) => p.permission_type === "league_admin" && p.user_id === userId);
  };

  const isLeagueSecretary = (league: League, userId: string) => {
    return league.league_permissions?.some((p) => p.permission_type === "league_secretary" && p.user_id === userId);
  };

  const canManageSecretaries = (league: League, userId: string, userRole: string | null) => {
    return userRole === "superuser" || isLeagueAdmin(league, userId);
  };

  const canManageLeague = (league: League, userId: string, userRole: string | null) => {
    return userRole === "superuser" || isLeagueAdmin(league, userId) || isLeagueSecretary(league, userId);
  };

  // Add state for secretary dialog
  const [secretaryDialog, setSecretaryDialog] = useState<{
    isOpen: boolean;
    leagueId: string | null;
    isLoading: boolean;
    availableUsers: Array<{ id: string; first_name: string | null; last_name: string | null }>;
  }>({
    isOpen: false,
    leagueId: null,
    isLoading: false,
    availableUsers: [],
  });

  // Add secretary management functions
  const handleSecretaryDialogOpen = useCallback(
    async (leagueId: string) => {
      setSecretaryDialog((prev) => ({
        ...prev,
        isOpen: true,
        leagueId,
        isLoading: true,
      }));

      try {
        const { data, error } = await supabase.from("users").select("id, first_name, last_name").order("first_name");

        if (error) throw error;

        setSecretaryDialog((prev) => ({
          ...prev,
          isLoading: false,
          availableUsers: data || [],
        }));
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch users",
        });
        handleSecretaryDialogClose();
      }
    },
    [supabase, toast]
  );

  const handleSecretaryDialogClose = () => {
    setSecretaryDialog({
      isOpen: false,
      leagueId: null,
      isLoading: false,
      availableUsers: [],
    });
    setSelectedSecretaryId(null);
  };

  const handleChangeSecretary = async (leagueId: string, newSecretaryId: string) => {
    try {
      // Start a transaction using single supabase call
      const { error: permissionError } = await supabase.rpc("manage_league_secretary", {
        p_league_id: leagueId,
        p_user_id: newSecretaryId,
      });

      if (permissionError) throw permissionError;

      // Refresh the league data
      await loadInitialData();

      toast({
        title: "Success",
        description: "League secretary changed successfully",
      });
      handleSecretaryDialogClose();
    } catch (error) {
      console.error("Error changing league secretary:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to change league secretary",
      });
    }
  };

  // Add the Secretary Dialog component
  const SecretaryDialog = useMemo(() => {
    const handleSave = async () => {
      if (!secretaryDialog.leagueId || !selectedSecretaryId) return;
      await handleChangeSecretary(secretaryDialog.leagueId, selectedSecretaryId);
    };

    return (
      <Dialog open={secretaryDialog.isOpen} onOpenChange={(open) => !open && handleSecretaryDialogClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change League Secretary</DialogTitle>
            <DialogDescription>Select a user to assign as the league secretary.</DialogDescription>
          </DialogHeader>
          {secretaryDialog.isLoading ? (
            <div className="flex justify-center p-4">
              <Icons.spinner className="h-6 w-6" />
            </div>
          ) : (
            <>
              <Select value={selectedSecretaryId || undefined} onValueChange={setSelectedSecretaryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a secretary" />
                </SelectTrigger>
                <SelectContent>
                  {secretaryDialog.availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {`${user.first_name || ""} ${user.last_name || ""}`.trim() || "Unnamed User"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <DialogFooter>
                <Button variant="outline" onClick={handleSecretaryDialogClose}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={!selectedSecretaryId}>
                  Save
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    );
  }, [secretaryDialog, selectedSecretaryId]);

  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

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

  const router = useRouter();

  const handleNavigation = (leagueId: string, tab?: string) => {
    const baseUrl = `/leagues/${leagueId}`;
    const url = tab ? `${baseUrl}?tab=${tab}` : baseUrl;
    router.push(url);
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
        <button onClick={handleIconClick} className="focus:outline-none">
          <Search className="h-5 w-5 text-muted-foreground" />
        </button>
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
              onChange={handleSearchChange}
              onBlur={() => setIsSearchVisible(false)} // Hide input on blur
              className="w-full"
              id="search-leagues"
              name="search-leagues"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredLeagues.map((league) => (
          <Card key={league.id} className="cursor-pointer" onClick={() => handleNavigation(league.id)}>
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
                  <span>
                    {league.league_permissions &&
                    league.league_permissions.find((p) => p.permission_type === "league_admin")?.users
                      ? (() => {
                          const admin = league.league_permissions.find((p) => p.permission_type === "league_admin");
                          const adminName = `${admin?.users.first_name || ""} ${admin?.users.last_name || ""}`.trim();
                          return adminName || "Not Found";
                        })()
                      : "Not Found"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Secretary: </span>
                  <span>
                    {league.league_permissions &&
                    league.league_permissions.find((p) => p.permission_type === "league_secretary")?.users
                      ? (() => {
                          const secretary = league.league_permissions.find(
                            (p) => p.permission_type === "league_secretary"
                          );
                          const secretaryName = `${secretary?.users.first_name || ""} ${
                            secretary?.users.last_name || ""
                          }`.trim();
                          return secretaryName || "Not Assigned";
                        })()
                      : "Not Assigned"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
                  {userRole === "superuser" && (
                    <Button variant="outline" className="w-full" onClick={() => handleAdminDialogOpen(league.id)}>
                      Change Admin
                    </Button>
                  )}
                  {canManageSecretaries(league, user?.id || "", userRole) && (
                    <Button variant="outline" className="w-full" onClick={() => handleSecretaryDialogOpen(league.id)}>
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
        ))}
      </div>
      {AdminDialog}
      {SecretaryDialog}
    </div>
  );
}
