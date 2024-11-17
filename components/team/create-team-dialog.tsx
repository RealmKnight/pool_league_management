import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AvailableCaptain } from "../types";
import { Database } from "@/lib/database.types";

interface CreateTeamDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: CreateTeamData) => void;
  isSuperuser: boolean;
  availableCaptains: AvailableCaptain[];
  isLoading: boolean;
}

export type CreateTeamData = {
  name: string;
  format: string;
  home_venue?: string;
  max_players: number;
  league_id?: string;
  status: Database["public"]["Enums"]["team_status_enum"];
};

export const CreateTeamDialog: React.FC<CreateTeamDialogProps> = ({
  isOpen,
  onOpenChange,
  onSave,
  isSuperuser,
  availableCaptains,
  isLoading,
}) => {
  const [formData, setFormData] = useState<CreateTeamData>({
    name: "",
    format: "singles",
    max_players: 11,
    status: "pending" as Database["public"]["Enums"]["team_status_enum"],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a New Team</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This will create a new team and add you as the captain.
            <br />
            You can manage the team, join a league, and add players after you create the team.
          </p>
          <p>Team Name:</p>
          <Input name="name" placeholder="Team Name" value={formData.name} onChange={handleChange} required />
          <p>Format:</p>
          <select
            name="format"
            value={formData.format}
            onChange={handleChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
          >
            <option value="singles">Singles</option>
            <option value="doubles">Doubles</option>
            <option value="scotch-doubles">Scotch Doubles</option>
          </select>
          <p>Home Play Site:</p>
          <Input name="home_venue" placeholder="Home Venue" value={formData.home_venue || ""} onChange={handleChange} />
          <p>Max Players:</p>
          <Input
            name="max_players"
            type="number"
            placeholder="Max Players"
            value={formData.max_players}
            onChange={handleChange}
            required
          />
          <p>Team Status:</p>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <DialogFooter>
          <Button onClick={() => onSave(formData)} disabled={isLoading}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
