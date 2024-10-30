"use client";

import { useState, useEffect } from "react";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type League = Database["public"]["Tables"]["leagues"]["Row"];

type LeagueScheduleType = "single_day" | "multiple_days";
type LeagueFormat = "round_robin" | "bracket" | "swiss";
type WeekDay = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

interface LeagueSchedule {
  type: LeagueScheduleType;
  days: WeekDay[];
  start_time: string;
}

type LeagueRules = "BCA" | "APA" | "Bar" | "House";

export default function LeaguesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [filteredLeagues, setFilteredLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

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
  });

  const supabase = createClientComponentClient<Database>();

  // Add state for selected league secretary ID
  const [selectedSecretaryId, setSelectedSecretaryId] = useState<string | null>(null);

  // Check user role and fetch leagues
  useEffect(() => {
    async function loadUserRoleAndLeagues() {
      if (!user?.id) return;

      try {
        // Fetch user role
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (userError) throw userError;
        setUserRole(userData.role);

        // Fetch leagues based on role
        let query = supabase.from("leagues").select("*");

        if (userData.role === "superuser") {
          // Superusers can see all leagues
          const { data: leaguesData, error: leaguesError } = await query.select(`
              *,
              league_secretaries (
                user_id,
                users (first_name, last_name)
              )
            `);

          if (leaguesError) throw leaguesError;
          setLeagues(leaguesData || []);
          setFilteredLeagues(leaguesData || []);
        } else {
          // League admins can only see leagues they created
          const { data: leaguesData, error: leaguesError } = await query.or(`created_by.eq.${user.id}`);

          if (leaguesError) throw leaguesError;
          setLeagues(leaguesData || []);
          setFilteredLeagues(leaguesData || []);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load leagues",
        });
      } finally {
        setLoading(false);
      }
    }

    loadUserRoleAndLeagues();
  }, [user, supabase, toast]);

  const canCreateLeague = userRole === "superuser" || userRole === "league_admin";

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

      const { data, error } = await supabase
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
        })
        .select()
        .single();

      if (error) {
        console.error("Supabase error:", error);
        throw new Error(error.message);
      }

      setLeagues([...leagues, data]);
      setFilteredLeagues([...leagues, data]);
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
      });
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

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim() === "") {
      setFilteredLeagues(leagues);
    } else {
      setFilteredLeagues(leagues.filter((league) => league.name.toLowerCase().includes(term.toLowerCase())));
    }
  };

  // Add this function to fetch users for selection
  const fetchUsers = async () => {
    const { data, error } = await supabase.from("users").select("*");
    if (error) {
      console.error("Error fetching users:", error);
      return [];
    }
    return data || [];
  };

  // Add a state to hold users
  const [users, setUsers] = useState([]);

  // Fetch users when the component mounts
  useEffect(() => {
    const loadUsers = async () => {
      const fetchedUsers = await fetchUsers();
      setUsers(fetchedUsers);
    };
    loadUsers();
  }, []);

  // Add state for the dialog
  const [assignSecretaryDialogOpen, setAssignSecretaryDialogOpen] = useState(false);
  const [currentLeagueId, setCurrentLeagueId] = useState<string | null>(null);

  // Function to open the dialog
  const openAssignSecretaryDialog = (leagueId: string) => {
    setCurrentLeagueId(leagueId);
    setAssignSecretaryDialogOpen(true);
  };

  // Dialog for assigning a league secretary
  <Dialog open={assignSecretaryDialogOpen} onOpenChange={setAssignSecretaryDialogOpen}>
    <DialogTrigger asChild>
      <Button>Assign League Secretary</Button>
    </DialogTrigger>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Assign League Secretary</DialogTitle>
        <DialogDescription>Select a user to assign as the league secretary.</DialogDescription>
      </DialogHeader>
      <Select
        id="league-secretary-select"
        value={selectedSecretaryId}
        onValueChange={(value) => setSelectedSecretaryId(value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a user" />
        </SelectTrigger>
        // Start of Selection
        <SelectContent>
          {users.map((user: { id: string; first_name: string; last_name: string }) => (
            <SelectItem key={user.id} value={user.id}>
              {user.first_name} {user.last_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        onClick={async () => {
          if (selectedSecretaryId && currentLeagueId) {
            const { error } = await supabase.from("league_secretaries").insert({
              league_id: currentLeagueId,
              user_id: selectedSecretaryId,
            });

            if (error) {
              console.error("Error assigning league secretary:", error);
              toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to assign league secretary",
              });
            } else {
              toast({
                title: "Success",
                description: "League secretary assigned successfully",
              });
              // Optionally refresh the list of secretaries or leagues
              setAssignSecretaryDialogOpen(false);
            }
          }
        }}
      >
        Assign Secretary
      </Button>
    </DialogContent>
  </Dialog>;

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">League Management</h3>
          <p className="text-sm text-muted-foreground">Create and manage your pool leagues.</p>
        </div>
        {canCreateLeague && (
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create League
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4 mx-2">
                <DialogTitle className="text-center">Create New League</DialogTitle>
                <DialogDescription className="text-center">Enter the details for your new league.</DialogDescription>
              </DialogHeader>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreateLeague();
                }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="league-name">League Name</Label>
                    <Input
                      id="league-name"
                      name="league-name"
                      autoComplete="organization"
                      value={newLeague.name}
                      onChange={(e) => setNewLeague({ ...newLeague, name: e.target.value })}
                      placeholder="Enter league name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="league-description">Description</Label>
                    <Textarea
                      id="league-description"
                      name="league-description"
                      autoComplete="off"
                      value={newLeague.description}
                      onChange={(e) => setNewLeague({ ...newLeague, description: e.target.value })}
                      placeholder="Enter league description"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="league-rules">League Rules</Label>
                  <Select
                    value={newLeague.rules.type}
                    onValueChange={(value: LeagueRules) =>
                      setNewLeague({
                        ...newLeague,
                        rules: {
                          ...newLeague.rules,
                          type: value,
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select rules" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BCA">BCA Rules</SelectItem>
                      <SelectItem value="APA">APA Rules</SelectItem>
                      <SelectItem value="Bar">Bar Rules</SelectItem>
                      <SelectItem value="House">House Rules</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {newLeague.rules.type === "BCA" && "Billiards Congress of America official rules"}
                    {newLeague.rules.type === "APA" && "American Poolplayers Association handicap system"}
                    {newLeague.rules.type === "Bar" && "Standard bar rules with local modifications"}
                    {newLeague.rules.type === "House" && "House rules agreed upon by league members"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="league-format">League Format</Label>
                  <Select
                    value={newLeague.format}
                    onValueChange={(value: LeagueFormat) =>
                      setNewLeague({
                        ...newLeague,
                        format: value,
                        estimated_weeks: calculateEstimatedWeeks(value, 8), // Assuming 8 teams for now
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="round_robin">Round Robin</SelectItem>
                      <SelectItem value="bracket">Bracket</SelectItem>
                      <SelectItem value="swiss">Swiss System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="team-count">Number of Teams</Label>
                    <div className="flex items-center space-x-2">
                      <Select
                        value={newLeague.team_count.toString()}
                        onValueChange={(value) => handleTeamCountChange(value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select number of teams" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px] overflow-y-auto">
                          {Array.from({ length: 122 }, (_, i) => i + 7).map((count) => (
                            <SelectItem key={count} value={count.toString()}>
                              {count} Teams {count % 2 !== 0 && "(+1 bye team)"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {newLeague.rules.has_bye_team && (
                        <span className="text-sm text-muted-foreground whitespace-nowrap">(+1 bye team)</span>
                      )}
                    </div>
                    {newLeague.rules.has_bye_team && (
                      <p className="text-sm text-muted-foreground">
                        A bye team will be added to enable scheduling. Teams playing against the bye team will
                        automatically win.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Schedule Type</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        type="button"
                        variant={newLeague.schedule.type === "single_day" ? "default" : "outline"}
                        onClick={() =>
                          setNewLeague({
                            ...newLeague,
                            schedule: { ...newLeague.schedule, type: "single_day", days: [] },
                          })
                        }
                      >
                        Single Day
                      </Button>
                      <Button
                        type="button"
                        variant={newLeague.schedule.type === "multiple_days" ? "default" : "outline"}
                        onClick={() =>
                          setNewLeague({
                            ...newLeague,
                            schedule: { ...newLeague.schedule, type: "multiple_days", days: [] },
                          })
                        }
                      >
                        Multiple Days
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>League Days</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {(
                        ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as WeekDay[]
                      ).map((day) => (
                        <Button
                          key={day}
                          type="button"
                          variant={newLeague.schedule.days.includes(day) ? "default" : "outline"}
                          onClick={() => {
                            const maxDays = newLeague.schedule.type === "single_day" ? 1 : 3;
                            setNewLeague({
                              ...newLeague,
                              schedule: {
                                ...newLeague.schedule,
                                days: newLeague.schedule.days.includes(day)
                                  ? newLeague.schedule.days.filter((d) => d !== day)
                                  : newLeague.schedule.days.length < maxDays
                                  ? [...newLeague.schedule.days, day]
                                  : newLeague.schedule.days,
                              },
                            });
                          }}
                          disabled={
                            !newLeague.schedule.days.includes(day) &&
                            newLeague.schedule.days.length >= (newLeague.schedule.type === "single_day" ? 1 : 3)
                          }
                        >
                          {day}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="start-time">Start Time</Label>
                    <Select
                      value={newLeague.schedule.start_time}
                      onValueChange={(value) =>
                        setNewLeague({
                          ...newLeague,
                          schedule: { ...newLeague.schedule, start_time: value },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select start time" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="season-start">Season Start</Label>
                    <DatePicker
                      date={newLeague.season_start}
                      onChange={(date) => {
                        if (date) {
                          // Calculate suggested end date based on estimated weeks
                          const suggestedEndDate = calculateEndDate(date, newLeague.estimated_weeks);
                          setNewLeague({
                            ...newLeague,
                            season_start: date,
                            season_end: suggestedEndDate,
                          });
                        } else {
                          setNewLeague({
                            ...newLeague,
                            season_start: null,
                            season_end: null,
                          });
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="season-end">Season End</Label>
                    <DatePicker
                      date={newLeague.season_end}
                      onChange={(date) => setNewLeague({ ...newLeague, season_end: date })}
                      disabled={!newLeague.season_start} // Disable if no start date
                      minDate={newLeague.season_start || undefined} // Can't pick date before start
                    />
                    {newLeague.season_start && newLeague.estimated_weeks > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Suggested end date based on {newLeague.estimated_weeks} weeks of play. You can adjust this for
                        additional events.
                      </p>
                    )}
                  </div>
                </div>

                {newLeague.estimated_weeks > 0 && (
                  <div className="text-sm space-y-1">
                    <p className="font-medium">League Duration Details:</p>
                    <ul className="text-muted-foreground list-disc list-inside">
                      <li>
                        Teams: {newLeague.team_count}
                        {newLeague.rules.has_bye_team && ` (+1 bye team)`}
                      </li>
                      <li>
                        Format:{" "}
                        {newLeague.format === "round_robin"
                          ? "Round Robin (home & away)"
                          : newLeague.format === "bracket"
                          ? "Single Elimination Bracket"
                          : "Swiss System"}
                      </li>
                      <li>Estimated Duration: {newLeague.estimated_weeks} weeks</li>
                      {newLeague.format === "round_robin" && (
                        <>
                          <li>Games per Team: {(newLeague.rules.actual_team_count - 1) * 2}</li>
                          {newLeague.rules.has_bye_team && (
                            <li className="text-yellow-500">
                              Note: Teams will automatically win when scheduled against the bye team
                            </li>
                          )}
                        </>
                      )}
                    </ul>
                  </div>
                )}

                <div className="sticky bottom-0 bg-background pt-4">
                  <Button type="submit" className="w-full">
                    Create League
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {userRole === "superuser" && (
        <div className="flex items-center space-x-2 mb-4">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search leagues..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full"
          />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredLeagues.map((league) => (
          <Card key={league.id}>
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
                  <span>League Secretary: </span>
                  <span>
                    {league.secretary_id
                      ? `${league.secretary_first_name} ${league.secretary_last_name}`
                      : "Not Assigned"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="w-full" onClick={() => openAssignSecretaryDialog(league.id)}>
                    Assign Secretary
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Users className="mr-2 h-4 w-4" />
                    Teams
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Trophy className="mr-2 h-4 w-4" />
                    Standings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
