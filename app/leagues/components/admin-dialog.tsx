import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import * as Icons from "@/components/icons";
import type { AvailableAdmin } from "../types";

interface AdminDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (adminId: string) => Promise<void>;
  availableAdmins: AvailableAdmin[];
  isLoading: boolean;
}

export function AdminDialog({ isOpen, onOpenChange, onSave, availableAdmins, isLoading }: AdminDialogProps) {
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedAdminId(null);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (selectedAdminId) {
      await onSave(selectedAdminId);
      setSelectedAdminId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change League Administrator</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center p-4">
            <Icons.spinner className="h-6 w-6" />
          </div>
        ) : (
          <>
            <Select value={selectedAdminId || undefined} onValueChange={setSelectedAdminId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an administrator" />
              </SelectTrigger>
              <SelectContent>
                {availableAdmins.map((admin) => (
                  <SelectItem key={admin.id} value={admin.id}>
                    {`${admin.first_name} ${admin.last_name}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!selectedAdminId}>
                Save
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
