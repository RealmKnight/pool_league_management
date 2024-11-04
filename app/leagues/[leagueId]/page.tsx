"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Settings, Users, Calendar, Trophy } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";

// Define available tabs
type TabType = "teams" | "schedule" | "standings" | "settings" | "requests";

// Define the League type
type League = Database["public"]["Tables"]["leagues"]["Row"] & {
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

export default function LeaguePage() {
  const searchParams = useSearchParams();
  const leagueId = searchParams.get("id");
  const initialTab = (searchParams.get("tab") as TabType) || "teams";

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [league, setLeague] = useState<League | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const supabase = createClientComponentClient<Database>();

  // Helper functions for permissions
  const isLeagueAdmin = (userId: string) => {
    return league?.league_permissions?.some((p) => p.permission_type === "league_admin" && p.user_id === userId);
  };

  const isLeagueSecretary = (userId: string) => {
    return league?.league_permissions?.some((p) => p.permission_type === "league_secretary" && p.user_id === userId);
  };

  useEffect(() => {
    const fetchLeagueData = async () => {
      if (!leagueId) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
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
          .eq("id", leagueId)
          .single();

        if (error) throw error;

        setLeague(data);
      } catch (error) {
        console.error("Error fetching league data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load league data",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLeagueData();
  }, [leagueId, supabase, toast]);

  const renderTabContent = () => {
    switch (activeTab) {
      case "teams":
        return <div>Teams Content</div>;
      case "schedule":
        return <div>Schedule Content</div>;
      case "standings":
        return <div>Standings Content</div>;
      case "settings":
        return <div>Settings Content</div>;
      case "requests":
        return <div>Requests Content</div>;
      default:
        return null;
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!league) return <div>League not found.</div>;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
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
                {league.league_permissions.find((p) => p.permission_type === "league_admin")?.users.first_name ||
                  "Not Assigned"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Content */}
      <div className="mt-4">{renderTabContent()}</div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t">
        <div className="container mx-auto flex justify-around p-4">
          <Button variant={activeTab === "teams" ? "default" : "ghost"} onClick={() => setActiveTab("teams")}>
            <Users className="h-5 w-5" />
          </Button>
          <Button variant={activeTab === "schedule" ? "default" : "ghost"} onClick={() => setActiveTab("schedule")}>
            <Calendar className="h-5 w-5" />
          </Button>
          <Button variant={activeTab === "standings" ? "default" : "ghost"} onClick={() => setActiveTab("standings")}>
            <Trophy className="h-5 w-5" />
          </Button>
          {user && (isLeagueAdmin(user.id) || isLeagueSecretary(user.id)) && (
            <Button variant={activeTab === "settings" ? "default" : "ghost"} onClick={() => setActiveTab("settings")}>
              <Settings className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
