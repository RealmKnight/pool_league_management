"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/lib/database.types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { AvailableAdmin } from "@/app/leagues/types";

interface SecretaryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (secretaryId: string) => void;
  isLoading: boolean;
  availableUsers: AvailableAdmin[];
}

export function SecretaryDialog({
  isOpen,
  onOpenChange,
  onSave,
  isLoading,
  availableUsers,
}: SecretaryDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change League Secretary</DialogTitle>
          <DialogDescription>
            Select a new secretary for this league. The current secretary will be removed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Select onValueChange={onSave}>
              <SelectTrigger>
                <SelectValue placeholder="Select a secretary" />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.first_name} {user.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
