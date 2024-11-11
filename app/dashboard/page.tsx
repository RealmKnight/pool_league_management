"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Users, Calendar, Activity } from "lucide-react";
import Link from "next/link";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];
type UserTeam = {
  id: string;
  name: string;
  position: string;
  league: {
    name: string;
  } | null;
};

type NextMatch = {
  match_date: string;
  venue: string | null;
  homeTeam: {
    name: string;
  } | null;
  awayTeam: {
    name: string;
  } | null;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [teams, setTeams] = useState<UserTeam[]>([]);
  const [nextMatch, setNextMatch] = useState<NextMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    async function loadData() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // Fetch user's teams
        const { data: teamData, error: teamError } = await supabase
          .from("team_players")
          .select(
            `
            team_id,
            position,
            teams (
              id,
              name,
              league:league_id (
                name
              )
            )
          `
          )
          .eq("user_id", user.id)
          .eq("status", "active");

        if (teamError) throw teamError;

        const formattedTeams = teamData.map((tp) => ({
          id: tp.teams?.id || "",
          name: tp.teams?.name || "",
          position: tp.position || "player",
          league: tp.teams?.league || null,
        }));

        setTeams(formattedTeams);

        // Fetch next match if user has teams
        if (teamData.length > 0) {
          const teamIds = teamData.map((t) => t.teams?.id).filter(Boolean);

          const { data: matchData, error: matchError } = await supabase
            .from("matches")
            .select(
              `
              match_date,
              venue,
              home_team:teams!matches_home_team_id_fkey(name),
              away_team:teams!matches_away_team_id_fkey(name)
            `
            )
            .or(`home_team_id.in.(${teamIds.join(",")}),away_team_id.in.(${teamIds.join(",")})`)
            .gte("match_date", new Date().toISOString())
            .order("match_date", { ascending: true })
            .limit(1)
            .single();

          if (!matchError && matchData) {
            const formattedMatch: NextMatch = {
              match_date: matchData.match_date,
              venue: matchData.venue,
              homeTeam: matchData.home_team,
              awayTeam: matchData.away_team,
            };
            setNextMatch(formattedMatch);
          }
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, supabase]);

  const getDisplayName = () => {
    if (profile?.use_nickname && profile?.nickname) {
      return profile.nickname;
    }
    if (profile?.first_name) {
      return profile.first_name;
    }
    if (profile?.full_name) {
      return profile.full_name;
    }
    return user?.email?.split("@")[0] || "Guest";
  };

  const formatMatchDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-6">Dashboard</h1>

      {/* Welcome Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Welcome, {getDisplayName()}</CardTitle>
          <CardDescription>Your role: {profile?.role || "Player"}</CardDescription>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Games Played</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">My Teams</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teams.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Next Match</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {nextMatch ? (
              <div className="space-y-2">
                <div className="text-xl font-bold">
                  {nextMatch.homeTeam?.name} vs {nextMatch.awayTeam?.name}
                </div>
                <div className="text-sm text-muted-foreground">{formatMatchDate(nextMatch.match_date)}</div>
                {nextMatch.venue && <div className="text-sm text-muted-foreground">at {nextMatch.venue}</div>}
              </div>
            ) : (
              <div className="text-2xl font-bold">No upcoming matches</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Teams Card */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>My Teams</CardTitle>
          <CardDescription>Teams you are currently a member of</CardDescription>
        </CardHeader>
        <CardContent>
          {teams.length === 0 ? (
            <div className="text-muted-foreground text-center py-8">You are not a member of any teams yet</div>
          ) : (
            <div className="space-y-4">
              {teams.map((team) => (
                <Link key={team.id} href={`/teams/${team.id}`} className="block">
                  <Card className="hover:bg-accent transition-colors">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold">{team.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {team.league?.name || "No League"} • {team.position}
                          </p>
                        </div>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest matches and team updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground text-center py-8">No recent activity to display</div>
        </CardContent>
      </Card>
    </div>
  );
}
