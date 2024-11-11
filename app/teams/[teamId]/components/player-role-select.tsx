import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PlayerRoleSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function PlayerRoleSelect({ value, onChange }: PlayerRoleSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select role" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="player">Player</SelectItem>
        <SelectItem value="substitute">Substitute</SelectItem>
        <SelectItem value="reserve">Reserve</SelectItem>
      </SelectContent>
    </Select>
  );
}
