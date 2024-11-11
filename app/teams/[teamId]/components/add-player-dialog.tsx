"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Search, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface AddPlayerDialogProps {
  teamId: string;
  isOpen: boolean;
  onClose: () => void;
  onPlayerAdded: () => void;
}

type JoinRequest = Database["public"]["Tables"]["team_join_requests"]["Row"] & {
  users: {
    first_name: string;
    last_name: string;
    email: string;
  };
};

type User = Database["public"]["Tables"]["users"]["Row"];

export function AddPlayerDialog({ teamId, isOpen, onClose, onPlayerAdded }: AddPlayerDialogProps) {
  const supabase = createClientComponentClient<Database>();
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchJoinRequests();
      fetchUsers();
    }
  }, [isOpen, teamId]);

  const fetchJoinRequests = async () => {
    const { data, error } = await supabase
      .from("team_join_requests")
      .select(
        `
        *,
        users (
          first_name,
          last_name,
          email
        )
      `
      )
      .eq("team_id", teamId)
      .eq("status", "pending");

    if (!error && data) {
      setJoinRequests(data as JoinRequest[]);
    }
  };

  const fetchUsers = async () => {
    try {
      // First get existing team player user IDs
      const { data: teamPlayers } = await supabase.from("team_players").select("user_id").eq("team_id", teamId);

      // Handle the case where there are no team players yet
      const existingUserIds =
        teamPlayers?.filter((player) => player.user_id !== null).map((player) => player.user_id) || [];

      // Then fetch users not in the team
      const { data: users, error } = await supabase.from("users").select("*").order("first_name", { ascending: true });

      if (error) throw error;

      // Filter out existing team players client-side if there are any
      const filteredUsers =
        existingUserIds.length > 0 ? users?.filter((user) => !existingUserIds.includes(user.id)) : users || [];

      setUsers(filteredUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.first_name?.toLowerCase().includes(searchLower) ||
      user.last_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  });

  const handleAcceptRequest = async (requestId: string, userId: string) => {
    try {
      // Begin transaction
      const { error: teamPlayerError } = await supabase.from("team_players").insert({
        team_id: teamId,
        user_id: userId,
        status: "active",
        join_date: new Date().toISOString(),
      });

      if (teamPlayerError) throw teamPlayerError;

      // Update request status
      const { error: requestError } = await supabase
        .from("team_join_requests")
        .update({ status: "accepted" })
        .eq("id", requestId);

      if (requestError) throw requestError;

      fetchJoinRequests();
      onPlayerAdded();
    } catch (error) {
      console.error("Error accepting request:", error);
    }
  };

  const handleAddSelectedPlayers = async () => {
    try {
      setAddingPlayers(true);
      setError(null);

      // Get team data
      const { data: teamData, error: teamError } = await supabase
        .from("teams")
        .select("league_id")
        .eq("id", teamId)
        .single();

      if (teamError) {
        console.error("Error fetching team:", teamError);
        throw new Error("Failed to fetch team data");
      }

      // Add players one at a time
      for (const userId of selectedUsers) {
        const newPlayer = {
          team_id: teamId,
          user_id: userId,
          league_id: teamData.league_id,
          status: "active",
          position: "forward",
          join_date: new Date().toISOString(),
        };

        const { error: insertError } = await supabase.from("team_players").insert([newPlayer]);

        if (insertError) {
          console.error("Insert error:", insertError);
          throw new Error(insertError.message);
        }
      }

      // Success
      setSelectedUsers([]);
      onPlayerAdded();
      onClose();
    } catch (error: any) {
      console.error("Error in handleAddSelectedPlayers:", error);
      setError(error.message || "Failed to add players");
    } finally {
      setAddingPlayers(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  };

  // Add UI elements to show loading and error states
  const [addingPlayers, setAddingPlayers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Players to Team</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="requests" className="w-full">
          <TabsList>
            <TabsTrigger value="requests">Join Requests</TabsTrigger>
            <TabsTrigger value="add">Add Players</TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            <ScrollArea className="h-[300px]">
              {joinRequests.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No pending join requests</p>
              ) : (
                joinRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-2 hover:bg-accent rounded-lg">
                    <div>
                      <p className="font-medium">
                        {request.users.first_name} {request.users.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{request.users.email}</p>
                    </div>
                    <Button onClick={() => handleAcceptRequest(request.id, request.user_id)}>Accept</Button>
                  </div>
                ))
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="add">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>

              <ScrollArea className="h-[300px] border rounded-md">
                {loading ? (
                  <p className="text-center py-4">Loading users...</p>
                ) : filteredUsers.length === 0 ? (
                  <p className="text-center py-4">No users found</p>
                ) : (
                  <div className="divide-y">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => toggleUserSelection(user.id)}
                        className={cn(
                          "flex items-center gap-2 p-2 cursor-pointer hover:bg-accent",
                          selectedUsers.includes(user.id) && "bg-accent"
                        )}
                      >
                        <div className="w-4">{selectedUsers.includes(user.id) && <Check className="h-4 w-4" />}</div>
                        <div className="flex-1">
                          <p className="font-medium">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <div className="flex flex-col gap-2">
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button onClick={handleAddSelectedPlayers} disabled={selectedUsers.length === 0 || addingPlayers}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {addingPlayers ? "Adding..." : `Add Selected Players (${selectedUsers.length})`}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
