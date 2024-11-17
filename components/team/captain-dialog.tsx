"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";
import type { AvailableCaptain } from "../types";
import { useToast } from "@/hooks/use-toast";
import * as Icons from "@/components/icons";

interface CaptainDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  teamId?: string | null;
  currentCaptainId?: string | null;
  onSave: (captainId: string) => Promise<void>;
  availableCaptains: AvailableCaptain[];
  isLoading: boolean;
}

export function CaptainDialog({
  isOpen,
  onOpenChange,
  teamId,
  currentCaptainId,
  onSave,
  availableCaptains = [],
  isLoading,
}: CaptainDialogProps) {
  const [selectedCaptainId, setSelectedCaptainId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    if (!isOpen) {
      setSelectedCaptainId(null);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!selectedCaptainId || !teamId) return;

    try {
      setIsSaving(true);

      // Use the stored procedure to manage team captain
      const { error: captainError } = await supabase.rpc("manage_team_captain", {
        p_team_id: teamId,
        p_user_id: selectedCaptainId,
      });

      if (captainError) throw captainError;

      // Update user's role
      await supabase.from("users").update({ role: "team_captain" }).eq("id", selectedCaptainId);

      // Update previous captain's role if exists
      if (currentCaptainId) {
        await supabase.from("users").update({ role: "player" }).eq("id", currentCaptainId);
      }

      await onSave(selectedCaptainId);
      setSelectedCaptainId(null);
      onOpenChange(false);

      toast({
        title: "Success",
        description: "Team captain updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating captain:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update team captain",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Team Captain</DialogTitle>
          <DialogDescription>
            Select a team member to assign as team captain. This will update their role and permissions.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Select value={selectedCaptainId || undefined} onValueChange={(value: string) => setSelectedCaptainId(value)}>
            <SelectTrigger>
              <SelectValue placeholder={availableCaptains.length === 0 ? "No available users" : "Select a captain"} />
            </SelectTrigger>
            <SelectContent>
              {availableCaptains?.length > 0 ? (
                availableCaptains.map((user) => (
                  <SelectItem key={user.id} value={user.id} disabled={user.id === currentCaptainId}>
                    {`${user.first_name || ""} ${user.last_name || ""}`}
                    {user.id === currentCaptainId && " (Current)"}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-users" disabled>
                  No available users
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedCaptainId || isSaving || isLoading || availableCaptains.length === 0}
          >
            {isSaving ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
