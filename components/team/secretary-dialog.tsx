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

interface SecretaryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  teamId?: string | null;
  currentSecretaryId?: string | null;
  onSave: (secretaryId: string) => Promise<void>;
  availableUsers: AvailableCaptain[];
  isLoading: boolean;
}

export function SecretaryDialog({
  isOpen,
  onOpenChange,
  teamId,
  currentSecretaryId,
  onSave,
  availableUsers,
  isLoading,
}: SecretaryDialogProps) {
  const [selectedSecretaryId, setSelectedSecretaryId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) {
      setSelectedSecretaryId(null);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!selectedSecretaryId || !teamId) return;

    try {
      setIsSaving(true);

      const supabase = createClientComponentClient<Database>();

      // Update both permissions and user role
      await supabase.rpc("manage_team_secretary", {
        p_team_id: teamId,
        p_user_id: selectedSecretaryId,
      });

      // Update user's role
      await supabase.from("users").update({ role: "team_secretary" }).eq("id", selectedSecretaryId);

      await onSave(selectedSecretaryId);
      setSelectedSecretaryId(null);
      onOpenChange(false);

      toast({
        title: "Success",
        description: "Team secretary updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating secretary:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update team secretary",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Team Secretary</DialogTitle>
          <DialogDescription>
            Select a team member to assign as team secretary. This will update their role and permissions.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Select
            value={selectedSecretaryId || undefined}
            onValueChange={(value: string) => setSelectedSecretaryId(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a secretary" />
            </SelectTrigger>
            <SelectContent>
              {availableUsers.map((user) => (
                <SelectItem key={user.id} value={user.id} disabled={user.id === currentSecretaryId}>
                  {`${user.first_name} ${user.last_name}`}
                  {user.id === currentSecretaryId && " (Current)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!selectedSecretaryId || isSaving || isLoading}>
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
