import type { LeagueFormat } from "../types";

export const formatLeagueFormat = (format: LeagueFormat): string => {
  const formatMap: Record<LeagueFormat, string> = {
    round_robin: "Round Robin",
    bracket: "Bracket",
    swiss: "Swiss System",
  };

  return formatMap[format] || format;
};
