import { League, LeagueSchedule, WeekDay, LeagueScheduleType, TimeDisplayFormat } from "../types";

export type ScheduleMatch = {
  week: number;
  matchDate: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  matchNumber?: number; // For tournament tracking
  round?: number; // For tournament brackets
  bracket?: "winners" | "losers" | "finals"; // For double elimination
};

export type WeekSchedule = {
  week: number;
  matchDate: string;
  matches: ScheduleMatch[];
  byeTeam?: string;
  roundName?: string; // For tournament rounds (e.g., "Quarter Finals")
};

function getNextScheduledDay(currentDate: Date, scheduleDays: LeagueSchedule["days"]): Date {
  // Ensure we have a valid date object
  const validCurrentDate = new Date(currentDate.getTime());
  if (isNaN(validCurrentDate.getTime())) {
    // If invalid date, use current date
    validCurrentDate.setTime(Date.now());
  }

  // If no schedule days provided, use default day (Monday) and time (19:00)
  if (!scheduleDays?.length) {
    const nextDate = new Date(validCurrentDate.getTime());
    const daysUntilMonday = (8 - validCurrentDate.getDay()) % 7;
    nextDate.setDate(validCurrentDate.getDate() + daysUntilMonday);
    nextDate.setHours(19, 0, 0, 0);
    return nextDate;
  }

  const currentDay = validCurrentDate.getDay();
  const dayMap: Record<WeekDay, number> = {
    [WeekDay.SUNDAY]: 0,
    [WeekDay.MONDAY]: 1,
    [WeekDay.TUESDAY]: 2,
    [WeekDay.WEDNESDAY]: 3,
    [WeekDay.THURSDAY]: 4,
    [WeekDay.FRIDAY]: 5,
    [WeekDay.SATURDAY]: 6,
  };

  // Sort schedule days by their numeric day value
  const sortedDays = [...scheduleDays].sort((a, b) => dayMap[a.day] - dayMap[b.day]);
  
  // Find the next scheduled day
  const nextDay = sortedDays.find(d => dayMap[d.day] > currentDay) || sortedDays[0];
  
  const daysToAdd = nextDay ? 
    (dayMap[nextDay.day] > currentDay ? 
      dayMap[nextDay.day] - currentDay : 
      7 - (currentDay - dayMap[nextDay.day])) : 
    7;

  const nextDate = new Date(validCurrentDate.getTime());
  nextDate.setDate(validCurrentDate.getDate() + daysToAdd);
  
  // Set time from schedule or use default (19:00)
  if (nextDay?.startTime) {
    try {
      const [hours, minutes] = nextDay.startTime.split(':').map(Number);
      if (!isNaN(hours) && !isNaN(minutes) && hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
        nextDate.setHours(hours, minutes, 0, 0);
      } else {
        nextDate.setHours(19, 0, 0, 0);
      }
    } catch {
      nextDate.setHours(19, 0, 0, 0);
    }
  } else {
    nextDate.setHours(19, 0, 0, 0);
  }

  return nextDate;
}

export function generateSchedule(league: League): WeekSchedule[] {
  const { team_count, season_start, season_end, league_format, schedule: schedulePreferences } = league;

  // Validate required fields
  if (!team_count || team_count < 2) {
    console.error("Invalid team count:", team_count);
    return [];
  }

  try {
    // Set default dates if not provided
    const startDate = season_start ? new Date(season_start) : new Date();
    const endDate = season_end ? new Date(season_end) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.error("Invalid dates:", { season_start, season_end });
      return [];
    }

    // Ensure schedulePreferences.days exists and has at least one day
    const scheduleDays = schedulePreferences?.days || [{
      day: WeekDay.MONDAY,
      startTime: "19:00"
    }];

    // Validate schedule days
    if (!Array.isArray(scheduleDays) || !scheduleDays.length) {
      console.error("Invalid schedule days:", scheduleDays);
      return [];
    }

    // Validate each schedule day
    for (const day of scheduleDays) {
      if (!day.day || !Object.values(WeekDay).includes(day.day)) {
        console.error("Invalid day in schedule:", day);
        return [];
      }
      if (!day.startTime || !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(day.startTime)) {
        console.error("Invalid time format in schedule:", day);
        return [];
      }
    }

    const teams = Array.from({ length: team_count }, (_, i) => `Team ${String.fromCharCode(65 + i)}`);

    // Create validated schedule preferences
    const validatedPreferences: LeagueSchedule = {
      type: schedulePreferences?.type || LeagueScheduleType.single_day,
      days: scheduleDays,
      displayFormat: schedulePreferences?.displayFormat || TimeDisplayFormat["12Hour"],
      isHandicapped: schedulePreferences?.isHandicapped || false
    };

    switch (league_format) {
      case "Single Round Robin":
        return generateSingleRoundRobin(teams, startDate, validatedPreferences);
      case "Round Robin":
        return generateDoubleRoundRobin(teams, startDate, validatedPreferences);
      case "Single Elimination":
        return generateSingleElimination(teams, startDate, validatedPreferences);
      case "Double Elimination":
        return generateDoubleElimination(teams, startDate, validatedPreferences);
      case "Swiss":
        return generateSwiss(teams, startDate, validatedPreferences);
      case "Swiss with Knockouts":
        return generateSwissWithKnockouts(teams, startDate, validatedPreferences);
      default:
        return generateDoubleRoundRobin(teams, startDate, validatedPreferences);
    }
  } catch (error) {
    console.error("Error generating schedule:", error);
    return [];
  }
}

function generateDoubleRoundRobin(teams: string[], startDate: Date, preferences: any): WeekSchedule[] {
  return generateRoundRobin(teams, startDate, preferences, true);
}

function generateSingleElimination(teams: string[], startDate: Date, preferences: any): WeekSchedule[] {
  const weeklySchedule: WeekSchedule[] = [];
  const numberOfRounds = Math.ceil(Math.log2(teams.length));
  const roundNames = ["First Round", "Round of 32", "Round of 16", "Quarter Finals", "Semi Finals", "Finals"];

  // Pad the teams array to nearest power of 2
  const paddedTeams = [...teams];
  while (paddedTeams.length < Math.pow(2, numberOfRounds)) {
    paddedTeams.push("BYE");
  }

  let currentTeams = [...paddedTeams];

  for (let round = 0; round < numberOfRounds; round++) {
    const roundDate = new Date(startDate);
    roundDate.setDate(startDate.getDate() + round * 7);
    const weekMatches: ScheduleMatch[] = [];
    const matchesInRound = currentTeams.length / 2;

    for (let i = 0; i < matchesInRound; i++) {
      const homeTeam = currentTeams[i * 2];
      const awayTeam = currentTeams[i * 2 + 1];

      if (homeTeam !== "BYE" && awayTeam !== "BYE") {
        weekMatches.push({
          week: round + 1,
          matchDate: roundDate.toISOString(),
          homeTeam,
          awayTeam,
          venue: `${homeTeam} Home Venue`,
          matchNumber: i + 1,
          round: round + 1,
        });
      }
    }

    // Prepare next round's teams
    currentTeams = Array.from({ length: matchesInRound }, (_, i) => `Winner Match ${i + 1} (Round ${round + 1})`);

    weeklySchedule.push({
      week: round + 1,
      matchDate: roundDate.toISOString(),
      matches: weekMatches,
      roundName: roundNames[numberOfRounds - round - 1] || `Round ${round + 1}`,
    });
  }

  return weeklySchedule;
}

function generateDoubleElimination(teams: string[], startDate: Date, preferences: any): WeekSchedule[] {
  const weeklySchedule: WeekSchedule[] = [];
  const numberOfWinnersRounds = Math.ceil(Math.log2(teams.length));
  const numberOfLosersRounds = numberOfWinnersRounds * 2 - 1;

  let winnersTeams = [...teams];
  let losersTeams: string[] = [];
  let currentWeek = 1;

  // Winners bracket
  for (let round = 0; round < numberOfWinnersRounds; round++) {
    const roundDate = new Date(startDate);
    roundDate.setDate(startDate.getDate() + (currentWeek - 1) * 7);
    const weekMatches: ScheduleMatch[] = [];

    for (let i = 0; i < winnersTeams.length; i += 2) {
      if (i + 1 < winnersTeams.length) {
        const matchNumber = weekMatches.length + 1;
        weekMatches.push({
          week: currentWeek,
          matchDate: roundDate.toISOString(),
          homeTeam: winnersTeams[i],
          awayTeam: winnersTeams[i + 1],
          venue: `Tournament Venue`,
          matchNumber,
          round: round + 1,
          bracket: "winners",
        });

        // Track losers for losers bracket
        losersTeams.push(`Loser W${round + 1}-M${matchNumber}`);
      }
    }

    weeklySchedule.push({
      week: currentWeek,
      matchDate: roundDate.toISOString(),
      matches: weekMatches,
      roundName: `Winners Round ${round + 1}`,
    });

    // Update winners for next round
    winnersTeams = weekMatches.map((m, i) => `Winner W${round + 1}-M${i + 1}`);
    currentWeek++;
  }

  // Losers bracket
  for (let round = 0; round < numberOfLosersRounds; round++) {
    const roundDate = new Date(startDate);
    roundDate.setDate(startDate.getDate() + (currentWeek - 1) * 7);
    const weekMatches: ScheduleMatch[] = [];

    for (let i = 0; i < losersTeams.length; i += 2) {
      if (i + 1 < losersTeams.length) {
        const matchNumber = weekMatches.length + 1;
        weekMatches.push({
          week: currentWeek,
          matchDate: roundDate.toISOString(),
          homeTeam: losersTeams[i],
          awayTeam: losersTeams[i + 1],
          venue: `Tournament Venue`,
          matchNumber,
          round: round + 1,
          bracket: "losers",
        });
      }
    }

    weeklySchedule.push({
      week: currentWeek,
      matchDate: roundDate.toISOString(),
      matches: weekMatches,
      roundName: `Losers Round ${round + 1}`,
    });

    // Update losers for next round
    losersTeams = weekMatches.map((m, i) => `Winner L${round + 1}-M${i + 1}`);
    currentWeek++;
  }

  // Finals
  const finalsDate = new Date(startDate);
  finalsDate.setDate(startDate.getDate() + (currentWeek - 1) * 7);
  weeklySchedule.push({
    week: currentWeek,
    matchDate: finalsDate.toISOString(),
    matches: [
      {
        week: currentWeek,
        matchDate: finalsDate.toISOString(),
        homeTeam: winnersTeams[0],
        awayTeam: losersTeams[0],
        venue: `Tournament Venue`,
        matchNumber: 1,
        round: 1,
        bracket: "finals",
      },
    ],
    roundName: "Finals",
  });

  return weeklySchedule;
}

function generateSwiss(teams: string[], startDate: Date, preferences: any): WeekSchedule[] {
  const weeklySchedule: WeekSchedule[] = [];
  const numberOfRounds = Math.ceil(Math.log2(teams.length));
  let currentTeams = teams.map((team) => ({ team, points: 0 }));

  for (let round = 0; round < numberOfRounds; round++) {
    const roundDate = new Date(startDate);
    roundDate.setDate(startDate.getDate() + round * 7);
    const weekMatches: ScheduleMatch[] = [];
    let byeTeam: string | undefined;

    // Sort teams by points
    currentTeams.sort((a, b) => b.points - a.points);

    // If odd number of teams, assign bye to lowest scoring team
    if (currentTeams.length % 2 !== 0) {
      const byeTeamObj = currentTeams.pop();
      if (byeTeamObj) {
        byeTeam = byeTeamObj.team;
        byeTeamObj.points += 1; // Award 1 point for bye
      }
    }

    // Pair teams with similar scores
    for (let i = 0; i < currentTeams.length; i += 2) {
      if (i + 1 < currentTeams.length) {
        weekMatches.push({
          week: round + 1,
          matchDate: roundDate.toISOString(),
          homeTeam: currentTeams[i].team,
          awayTeam: currentTeams[i + 1].team,
          venue: `${currentTeams[i].team} Home Venue`,
          matchNumber: i / 2 + 1,
          round: round + 1,
        });
      }
    }

    weeklySchedule.push({
      week: round + 1,
      matchDate: roundDate.toISOString(),
      matches: weekMatches,
      byeTeam,
      roundName: `Swiss Round ${round + 1}`,
    });

    // Simulate results for next round pairing
    weekMatches.forEach((match) => {
      const homeTeamObj = currentTeams.find((t) => t.team === match.homeTeam);
      const awayTeamObj = currentTeams.find((t) => t.team === match.awayTeam);
      if (homeTeamObj) homeTeamObj.points += 2; // Simulate win
      if (awayTeamObj) awayTeamObj.points += 1; // Simulate loss
    });
  }

  return weeklySchedule;
}

function generateSwissWithKnockouts(teams: string[], startDate: Date, preferences: any): WeekSchedule[] {
  // Generate Swiss rounds
  const swissRounds = generateSwiss(teams, startDate, preferences);
  const lastSwissWeek = swissRounds[swissRounds.length - 1].week;

  // Take top 8 teams and generate single elimination bracket
  const qualifiedTeams = teams.slice(0, 8).map((team) => `${team} (Qualified)`);
  const knockoutStartDate = new Date(startDate);
  knockoutStartDate.setDate(startDate.getDate() + lastSwissWeek * 7);

  const knockoutRounds = generateSingleElimination(qualifiedTeams, knockoutStartDate, preferences).map((week) => ({
    ...week,
    week: week.week + lastSwissWeek,
    roundName: `Knockout ${week.roundName}`,
  }));

  return [...swissRounds, ...knockoutRounds];
}

function generateRoundRobin(
  teams: string[], 
  startDate: Date, 
  preferences: LeagueSchedule, 
  isDouble: boolean
): WeekSchedule[] {
  const weeklySchedule: WeekSchedule[] = [];
  const numberOfTeams = teams.length;
  const actualNumberOfTeams = numberOfTeams % 2 === 0 ? numberOfTeams : numberOfTeams + 1;
  const roundsPerHalf = actualNumberOfTeams - 1;
  const totalRounds = isDouble ? roundsPerHalf * 2 : roundsPerHalf;
  const matchesPerRound = Math.floor(actualNumberOfTeams / 2);

  let teamsList = [...teams];
  if (teamsList.length % 2 !== 0) {
    teamsList.push("BYE");
  }

  let currentDate = new Date(startDate);

  for (let round = 0; round < totalRounds; round++) {
    currentDate = getNextScheduledDay(currentDate, preferences.days);
    const weekMatches: ScheduleMatch[] = [];
    let byeTeam: string | undefined;
    const isSecondHalf = round >= roundsPerHalf;

    for (let match = 0; match < matchesPerRound; match++) {
      const firstTeam = teamsList[match];
      const secondTeam = teamsList[teamsList.length - 1 - match];

      if (firstTeam === "BYE") {
        byeTeam = secondTeam;
      } else if (secondTeam === "BYE") {
        byeTeam = firstTeam;
      } else {
        const shouldSwap = isDouble ? isSecondHalf : (round + match) % 2 === 1;
        const [homeTeam, awayTeam] = shouldSwap ? [secondTeam, firstTeam] : [firstTeam, secondTeam];

        weekMatches.push({
          week: round + 1,
          matchDate: currentDate.toISOString(),
          homeTeam,
          awayTeam,
          venue: `${homeTeam} Home Venue`,
          matchNumber: match + 1,
          round: round + 1,
        });
      }
    }

    weeklySchedule.push({
      week: round + 1,
      matchDate: currentDate.toISOString(),
      matches: weekMatches,
      byeTeam: byeTeam !== "BYE" ? byeTeam : undefined,
      roundName: `Round ${round + 1}${isSecondHalf ? " (Return)" : ""}`,
    });

    // Rotate teams for next round (first team stays fixed)
    teamsList = [teamsList[0], ...teamsList.slice(-1), ...teamsList.slice(1, -1)];
  }

  return weeklySchedule;
}

function generateSingleRoundRobin(teams: string[], startDate: Date, preferences: any): WeekSchedule[] {
  return generateRoundRobin(teams, startDate, preferences, false);
}
