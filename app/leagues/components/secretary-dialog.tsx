"use client";

import { useState, useEffect } from "react";
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
import * as Icons from "@/components/icons";
import type { Database } from "@/lib/database.types";
import type { AvailableAdmin } from "../types";

interface SecretaryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (secretaryId: string) => Promise<void>;
  availableUsers: AvailableAdmin[];
  isLoading: boolean;
}

export function SecretaryDialog({ isOpen, onOpenChange, onSave, availableUsers, isLoading }: SecretaryDialogProps) {
  const [selectedSecretaryId, setSelectedSecretaryId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedSecretaryId(null);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (selectedSecretaryId) {
      try {
        await onSave(selectedSecretaryId);
        setSelectedSecretaryId(null);
        onOpenChange(false);
      } catch (error) {
        console.error("Error saving secretary:", error);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change League Secretary</DialogTitle>
          <DialogDescription>Select a user to assign as the league secretary.</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center p-4">
            <Icons.spinner className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
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
                    <SelectItem key={user.id} value={user.id}>
                      {`${user.first_name} ${user.last_name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!selectedSecretaryId || isLoading}>
                {isLoading ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
