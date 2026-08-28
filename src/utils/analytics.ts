import type { Session } from "../db/sessionRepository";

export type AnalyticsTimeRange = "7d" | "30d" | "90d" | "all";

export interface TimeOfDayBreakdown {
  morning: number; // 06:00 - 12:00 (seconds)
  afternoon: number; // 12:00 - 18:00 (seconds)
  evening: number; // 18:00 - 24:00 (seconds)
  night: number; // 00:00 - 06:00 (seconds)
}

export interface ActivityStat {
  activity: string;
  totalSeconds: number;
  percentage: number;
  sessionCount: number;
}

export interface DailyTrendPoint {
  dateString: string;
  dayLabel: string;
  fullDateLabel: string;
  durationSeconds: number;
  sessionCount: number;
}

export interface AnalyticsSummary {
  totalSeconds: number;
  totalSessions: number;
  activeDaysCount: number;
  daysInRange: number;
  dailyAverageSeconds: number;
  bestDay: { dateString: string; durationSeconds: number } | null;
  currentStreak: number;
  longestStreak: number;
  mostProductiveDayOfWeek: string | null;
  averageSessionSeconds: number;
  activityStats: ActivityStat[];
  timeOfDay: TimeOfDayBreakdown;
  dailyTrend: DailyTrendPoint[];
}

export function getLocalDateString(date: Date): string {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function calculateStreaks(sessions: Session[]): {
  currentStreak: number;
  longestStreak: number;
} {
  if (sessions.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const uniqueDates = Array.from(
    new Set(sessions.map((s) => getLocalDateString(new Date(s.started_at)))),
  ).sort((a, b) => b.localeCompare(a));

  if (uniqueDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const todayStr = getLocalDateString(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  let currentStreak = 0;
  let checkDate: Date | null = null;

  if (uniqueDates.includes(todayStr)) {
    checkDate = new Date();
  } else if (uniqueDates.includes(yesterdayStr)) {
    checkDate = yesterday;
  }

  if (checkDate) {
    const dateSet = new Set(uniqueDates);
    const iterDate = new Date(checkDate.getTime());
    while (true) {
      const dateKey = getLocalDateString(iterDate);
      if (dateSet.has(dateKey)) {
        currentStreak++;
        iterDate.setDate(iterDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Calculate longest streak across history
  const ascDates = [...uniqueDates].sort((a, b) => a.localeCompare(b));
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of ascDates) {
    const currentDate = new Date(`${dateStr}T00:00:00`);
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diffMs = currentDate.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    prevDate = currentDate;
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
  }

  return { currentStreak, longestStreak };
}

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function computeAnalytics(
  allSessions: Session[],
  range: AnalyticsTimeRange,
): AnalyticsSummary {
  const { currentStreak, longestStreak } = calculateStreaks(allSessions);

  // Filter sessions by range
  const now = new Date();
  let startDate: Date;
  let daysInRange = 7;

  if (range === "7d") {
    daysInRange = 7;
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
  } else if (range === "30d") {
    daysInRange = 30;
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
  } else if (range === "90d") {
    daysInRange = 90;
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 89);
  } else {
    // All time
    if (allSessions.length > 0) {
      const earliest = Math.min(
        ...allSessions.map((s) => new Date(s.started_at).getTime()),
      );
      startDate = new Date(earliest);
      const diffTime = Math.abs(now.getTime() - startDate.getTime());
      daysInRange = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      daysInRange = 7;
    }
  }

  const startDateStr = getLocalDateString(startDate);
  const filteredSessions = allSessions.filter((session) => {
    if (range === "all") return true;
    const sessionDateStr = getLocalDateString(new Date(session.started_at));
    return sessionDateStr >= startDateStr;
  });

  const totalSeconds = filteredSessions.reduce(
    (total, s) => total + s.duration_seconds,
    0,
  );
  const totalSessions = filteredSessions.length;

  // Group by date
  const sessionsByDate: Record<string, Session[]> = {};
  for (const session of filteredSessions) {
    const dateStr = getLocalDateString(new Date(session.started_at));
    (sessionsByDate[dateStr] ??= []).push(session);
  }

  const activeDaysCount = Object.keys(sessionsByDate).length;
  const dailyAverageSeconds =
    daysInRange > 0 ? Math.round(totalSeconds / daysInRange) : 0;

  // Best day
  let bestDay: { dateString: string; durationSeconds: number } | null = null;
  for (const [dateStr, daySessions] of Object.entries(sessionsByDate)) {
    const dayTotal = daySessions.reduce(
      (sum, s) => sum + s.duration_seconds,
      0,
    );
    if (!bestDay || dayTotal > bestDay.durationSeconds) {
      bestDay = { dateString: dateStr, durationSeconds: dayTotal };
    }
  }

  // Day of week breakdown
  const weekdayTotals: Record<number, number> = {
    0: 0,
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
  };
  for (const session of filteredSessions) {
    const day = new Date(session.started_at).getDay();
    weekdayTotals[day] += session.duration_seconds;
  }

  let bestWeekday = -1;
  let bestWeekdayTotal = 0;
  for (let i = 0; i < 7; i++) {
    if (weekdayTotals[i] > bestWeekdayTotal) {
      bestWeekdayTotal = weekdayTotals[i];
      bestWeekday = i;
    }
  }
  const mostProductiveDayOfWeek =
    bestWeekday >= 0 ? WEEKDAY_NAMES[bestWeekday] : null;

  // Average session length
  const averageSessionSeconds =
    totalSessions > 0 ? Math.round(totalSeconds / totalSessions) : 0;

  // Activity breakdown
  const activityMap: Record<
    string,
    { totalSeconds: number; sessionCount: number }
  > = {};
  for (const session of filteredSessions) {
    const existing = activityMap[session.activity] ?? {
      totalSeconds: 0,
      sessionCount: 0,
    };
    existing.totalSeconds += session.duration_seconds;
    existing.sessionCount += 1;
    activityMap[session.activity] = existing;
  }

  const activityStats: ActivityStat[] = Object.entries(activityMap)
    .map(([activity, data]) => ({
      activity,
      totalSeconds: data.totalSeconds,
      percentage:
        totalSeconds > 0 ? (data.totalSeconds / totalSeconds) * 100 : 0,
      sessionCount: data.sessionCount,
    }))
    .sort((a, b) => b.totalSeconds - a.totalSeconds);

  // Time of Day
  const timeOfDay: TimeOfDayBreakdown = {
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0,
  };
  for (const session of filteredSessions) {
    const hour = new Date(session.started_at).getHours();
    if (hour >= 6 && hour < 12) {
      timeOfDay.morning += session.duration_seconds;
    } else if (hour >= 12 && hour < 18) {
      timeOfDay.afternoon += session.duration_seconds;
    } else if (hour >= 18 && hour < 24) {
      timeOfDay.evening += session.duration_seconds;
    } else {
      timeOfDay.night += session.duration_seconds;
    }
  }

  // Daily Trend Points
  const dailyTrend: DailyTrendPoint[] = [];
  const trendDaysCount = Math.min(daysInRange, range === "90d" ? 90 : 30);
  const trendStartDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - (trendDaysCount - 1),
  );

  for (let i = 0; i < trendDaysCount; i++) {
    const d = new Date(
      trendStartDate.getFullYear(),
      trendStartDate.getMonth(),
      trendStartDate.getDate() + i,
    );
    const dStr = getLocalDateString(d);
    const daySessions = sessionsByDate[dStr] ?? [];
    const duration = daySessions.reduce(
      (sum, s) => sum + s.duration_seconds,
      0,
    );

    const isCompact = trendDaysCount > 14;
    const dayLabel = isCompact
      ? `${d.getMonth() + 1}/${d.getDate()}`
      : d.toLocaleDateString([], { weekday: "short" });

    const fullDateLabel = d.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
    });

    dailyTrend.push({
      dateString: dStr,
      dayLabel,
      fullDateLabel,
      durationSeconds: duration,
      sessionCount: daySessions.length,
    });
  }

  return {
    totalSeconds,
    totalSessions,
    activeDaysCount,
    daysInRange,
    dailyAverageSeconds,
    bestDay,
    currentStreak,
    longestStreak,
    mostProductiveDayOfWeek,
    averageSessionSeconds,
    activityStats,
    timeOfDay,
    dailyTrend,
  };
}
