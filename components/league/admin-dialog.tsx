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

interface AdminDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (adminId: string) => void;
  isLoading: boolean;
  availableAdmins: AvailableAdmin[];
}

export function AdminDialog({ isOpen, onOpenChange, onSave, isLoading, availableAdmins }: AdminDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change League Administrator</DialogTitle>
          <DialogDescription>
            Select a new administrator for this league. The current administrator will be removed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Select onValueChange={onSave}>
              <SelectTrigger>
                <SelectValue placeholder="Select an administrator" />
              </SelectTrigger>
              <SelectContent>
                {availableAdmins.map((admin) => (
                  <SelectItem key={admin.id} value={admin.id}>
                    {admin.first_name} {admin.last_name}
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
