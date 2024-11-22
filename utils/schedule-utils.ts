import { addWeeks } from "date-fns";

export function calculateSeasonLength(numberOfTeams: number): {
  numberOfWeeks: number;
  endDate: Date;
} {
  // In a round-robin tournament, each team plays against every other team
  // For a double round-robin (home and away), multiply by 2
  const gamesPerTeam = (numberOfTeams - 1) * 2; // Double round-robin
  
  // Add 2 weeks as buffer for potential rescheduling/playoffs
  const numberOfWeeks = gamesPerTeam + 2;
  
  const startDate = new Date();
  const endDate = addWeeks(startDate, numberOfWeeks);

  return {
    numberOfWeeks,
    endDate,
  };
}
