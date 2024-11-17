"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { LoadingState } from "@/components/shared/loading-state";
import { ErrorState } from "@/components/shared/error-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";

interface ScheduleTabProps {
  leagueId: string;
  userId: string;
  userRole: string | null;
}

interface Match {
  id: string;
  league_id: string;
  home_team_id: string;
  away_team_id: string;
  match_date: string;
  start_time: string;
  venue_id: string | null;
  home_team: {
    name: string;
  };
  away_team: {
    name: string;
  };
  venue: {
    name: string;
  } | null;
}

interface Team {
  id: string;
  name: string;
}

interface Venue {
  id: string;
  name: string;
}

export function ScheduleTab({ leagueId, userId, userRole }: ScheduleTabProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHomeTeam, setSelectedHomeTeam] = useState<string | null>(null);
  const [selectedAwayTeam, setSelectedAwayTeam] = useState<string | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("19:00");

  const supabase = createClientComponentClient<Database>();
  const { toast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch matches
      const { data: matchesData, error: matchesError } = await supabase
        .from("matches")
        .select(
          `
          id,
          league_id,
          home_team_id,
          away_team_id,
          match_date,
          start_time,
          venue_id,
          home_team:home_team_id(name),
          away_team:away_team_id(name),
          venue:venue_id(name)
        `
        )
        .eq("league_id", leagueId)
        .order("match_date", { ascending: true });

      if (matchesError) throw matchesError;

      // Fetch teams in this league
      const { data: teamsData, error: teamsError } = await supabase
        .from("league_teams")
        .select(
          `
          team:teams(
            id,
            name
          )
        `
        )
        .eq("league_id", leagueId);

      if (teamsError) throw teamsError;

      // Fetch venues
      const { data: venuesData, error: venuesError } = await supabase
        .from("venues")
        .select("id, name")
        .order("name");

      if (venuesError) throw venuesError;

      setMatches(matchesData as Match[]);
      setTeams(teamsData.map((lt) => lt.team) as Team[]);
      setVenues(venuesData as Venue[]);
    } catch (err) {
      console.error("Error loading schedule data:", err);
      setError("Failed to load schedule data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [leagueId]);

  const handleAddMatch = async () => {
    if (!selectedHomeTeam || !selectedAwayTeam || !selectedDate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (selectedHomeTeam === selectedAwayTeam) {
      toast({
        title: "Error",
        description: "Home team and away team cannot be the same",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("matches").insert({
        league_id: leagueId,
        home_team_id: selectedHomeTeam,
        away_team_id: selectedAwayTeam,
        match_date: format(selectedDate, "yyyy-MM-dd"),
        start_time: startTime,
        venue_id: selectedVenue,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Match added successfully",
      });

      // Reset form
      setSelectedHomeTeam(null);
      setSelectedAwayTeam(null);
      setSelectedVenue(null);
      setSelectedDate(undefined);
      setStartTime("19:00");

      // Reload data
      loadData();
    } catch (err) {
      console.error("Error adding match:", err);
      toast({
        title: "Error",
        description: "Failed to add match",
        variant: "destructive",
      });
    }
  };

  const canManageSchedule = userRole === "superuser" || userRole === "league_admin";

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="space-y-8">
      {canManageSchedule && (
        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="text-lg font-medium">Add Match</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="home-team">Home Team</Label>
              <Select onValueChange={setSelectedHomeTeam} value={selectedHomeTeam || undefined}>
                <SelectTrigger>
                  <SelectValue placeholder="Select home team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="away-team">Away Team</Label>
              <Select onValueChange={setSelectedAwayTeam} value={selectedAwayTeam || undefined}>
                <SelectTrigger>
                  <SelectValue placeholder="Select away team" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="venue">Venue</Label>
              <Select onValueChange={setSelectedVenue} value={selectedVenue || undefined}>
                <SelectTrigger>
                  <SelectValue placeholder="Select venue" />
                </SelectTrigger>
                <SelectContent>
                  {venues.map((venue) => (
                    <SelectItem key={venue.id} value={venue.id}>
                      {venue.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                type="time"
                id="start-time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button onClick={handleAddMatch} className="w-full">
                Add Match
              </Button>
            </div>
          </div>
        </div>
      )}

      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Home Team</TableHead>
              <TableHead>Away Team</TableHead>
              <TableHead>Venue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {matches.map((match) => (
              <TableRow key={match.id}>
                <TableCell>{format(new Date(match.match_date), "PP")}</TableCell>
                <TableCell>{match.start_time}</TableCell>
                <TableCell>{match.home_team.name}</TableCell>
                <TableCell>{match.away_team.name}</TableCell>
                <TableCell>{match.venue?.name || "TBD"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
