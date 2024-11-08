import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { AvailableCaptain } from "../types";

interface SecretaryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (secretaryId: string) => void;
  availableUsers: AvailableCaptain[];
  isLoading: boolean;
}

export const SecretaryDialog: React.FC<SecretaryDialogProps> = ({
  isOpen,
  onOpenChange,
  onSave,
  availableUsers,
  isLoading,
}) => {
  const [selectedSecretaryId, setSelectedSecretaryId] = React.useState<string | null>(null);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select a Secretary</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {availableUsers.map((user) => (
            <div key={user.id}>
              <input
                type="radio"
                id={user.id}
                name="secretary"
                value={user.id}
                onChange={() => setSelectedSecretaryId(user.id)}
              />
              <label htmlFor={user.id} className="ml-2">
                {user.first_name} {user.last_name}
              </label>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button
            onClick={() => selectedSecretaryId && onSave(selectedSecretaryId)}
            disabled={!selectedSecretaryId || isLoading}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
