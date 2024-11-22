"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CreateSeasonDialog } from "./create-season-dialog";
import type { League } from "@/app/leagues/types";

interface Season {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
}

interface SeasonsTabProps {
  league: League;
  userRole: string | null;
}

export function SeasonsTab({ league, userRole }: SeasonsTabProps) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialog, setCreateDialog] = useState({
    isOpen: false,
  });

  const supabase = createClientComponentClient<Database>();
  const { toast } = useToast();

  const canManageSeasons = userRole && ["superuser", "league_admin", "league_secretary"].includes(userRole);

  const fetchSeasons = async () => {
    try {
      const { data, error } = await supabase
        .from("seasons")
        .select("*")
        .eq("league_id", league.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setSeasons(data);
    } catch (error) {
      console.error("Error fetching seasons:", error);
      toast({
        title: "Error",
        description: "Failed to load seasons",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeasons();
  }, [league.id]);

  const handleStatusChange = async (seasonId: string, newStatus: string) => {
    try {
      // If activating a season, deactivate all other seasons first
      if (newStatus === "active") {
        await supabase
          .from("seasons")
          .update({ status: "completed" })
          .eq("league_id", league.id)
          .eq("status", "active");
      }

      const { error } = await supabase
        .from("seasons")
        .update({ status: newStatus })
        .eq("id", seasonId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Season status updated successfully",
      });

      fetchSeasons();
    } catch (error) {
      console.error("Error updating season status:", error);
      toast({
        title: "Error",
        description: "Failed to update season status",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div>Loading seasons...</div>;
  }

  return (
    <div className="space-y-8">
      {canManageSeasons && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setCreateDialog({ isOpen: true })}>
            <Plus className="h-4 w-4 mr-2" />
            Add Season
          </Button>
        </div>
      )}

      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Status</TableHead>
              {canManageSeasons && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {seasons.map((season) => (
              <TableRow key={season.id}>
                <TableCell>{season.name}</TableCell>
                <TableCell>{format(new Date(season.start_date), "PPP")}</TableCell>
                <TableCell>{format(new Date(season.end_date), "PPP")}</TableCell>
                <TableCell>
                  <Badge variant={season.status === "active" ? "default" : "secondary"}>
                    {season.status}
                  </Badge>
                </TableCell>
                {canManageSeasons && (
                  <TableCell>
                    {season.status !== "active" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(season.id, "active")}
                      >
                        Activate
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(season.id, "completed")}
                      >
                        Complete
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CreateSeasonDialog
        isOpen={createDialog.isOpen}
        onOpenChange={(open) => setCreateDialog({ isOpen: open })}
        onSuccess={fetchSeasons}
        leagueId={league.id}
      />
    </div>
  );
}
