import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select";
import type { Database } from "@/lib/database.types";
import { cn } from "@/lib/utils";

type PlayerPosition = Database["public"]["Enums"]["player_position_enum"] | "remove";

interface PlayerRoleSelectProps {
  value: PlayerPosition;
  onChange: (value: PlayerPosition) => void;
  showAdminRoles?: boolean;
  canRemovePlayer?: boolean;
}

export function PlayerRoleSelect({
  value,
  onChange,
  showAdminRoles = false,
  canRemovePlayer = false,
}: PlayerRoleSelectProps) {
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
            <SelectSeparator className="my-2" />
            <SelectItem value="team_captain">Team Captain</SelectItem>
            <SelectItem value="team_secretary">Team Secretary</SelectItem>
          </>
        )}

        {canRemovePlayer && (
          <>
            <SelectSeparator className="my-2" />
            <SelectItem
              value="remove"
              className={cn(
                "text-destructive font-semibold",
                "focus:text-destructive focus:font-semibold",
                "data-[highlighted]:text-destructive data-[highlighted]:font-semibold"
              )}
            >
              Remove from Team
            </SelectItem>
          </>
        )}
      </SelectContent>
    </Select>
  );
}
