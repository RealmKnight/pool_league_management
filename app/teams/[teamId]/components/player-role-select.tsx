import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Database } from "@/lib/database.types";

type PlayerPosition = Database["public"]["Enums"]["player_position_enum"];

interface PlayerRoleSelectProps {
  value: PlayerPosition;
  onChange: (value: PlayerPosition) => void;
  showAdminRoles?: boolean;
}

export function PlayerRoleSelect({ value, onChange, showAdminRoles = false }: PlayerRoleSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select role" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="player">Player</SelectItem>
        <SelectItem value="substitute">Substitute</SelectItem>
        <SelectItem value="reserve">Reserve</SelectItem>
        {showAdminRoles && (
          <>
            <SelectItem value="team_captain">Team Captain</SelectItem>
            <SelectItem value="team_secretary">Team Secretary</SelectItem>
          </>
        )}
      </SelectContent>
    </Select>
  );
}
