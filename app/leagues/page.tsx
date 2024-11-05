"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LeagueCard } from "./components/league-card";
import { useLeagues } from "./hooks/use-leagues";
import type { League } from "./types";
import { AdminDialog } from "./components/admin-dialog";
import { SecretaryDialog } from "./components/secretary-dialog";
import type { AvailableAdmin } from "./types";

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
    </div>
  );
}
