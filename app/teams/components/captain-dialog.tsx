import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { AvailableCaptain } from "../types";

interface CaptainDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (captainId: string) => void;
  availableCaptains: AvailableCaptain[];
  isLoading: boolean;
}

export const CaptainDialog: React.FC<CaptainDialogProps> = ({
  isOpen,
  onOpenChange,
  onSave,
  availableCaptains,
  isLoading,
}) => {
  const [selectedCaptainId, setSelectedCaptainId] = React.useState<string | null>(null);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select a Captain</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {availableCaptains.map((captain) => (
            <div key={captain.id}>
              <input
                type="radio"
                id={captain.id}
                name="captain"
                value={captain.id}
                onChange={() => setSelectedCaptainId(captain.id)}
              />
              <label htmlFor={captain.id} className="ml-2">
                {captain.first_name} {captain.last_name}
              </label>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button
            onClick={() => selectedCaptainId && onSave(selectedCaptainId)}
            disabled={!selectedCaptainId || isLoading}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
