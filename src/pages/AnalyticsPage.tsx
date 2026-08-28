import { useState, useMemo } from "react";
import type { Session } from "../db/sessionRepository";
import { formatMinutes } from "../utils/time";
import {
  computeAnalytics,
  type AnalyticsTimeRange,
} from "../utils/analytics";

interface AnalyticsPageProps {
  sessions: Session[];
  loading?: boolean;
}

function formatDurationSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  return formatMinutes(minutes);
}

function AnalyticsPage({ sessions, loading }: AnalyticsPageProps) {
  const [timeRange, setTimeRange] = useState<AnalyticsTimeRange>("7d");
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  const analytics = useMemo(() => {
    return computeAnalytics(sessions, timeRange);
  }, [sessions, timeRange]);

  const {
    totalSeconds,
    totalSessions,
    activeDaysCount,
    daysInRange,
    dailyAverageSeconds,
    currentStreak,
    longestStreak,
    mostProductiveDayOfWeek,
    averageSessionSeconds,
    activityStats,
    timeOfDay,
    dailyTrend,
  } = analytics;

  const maxDailyDuration = useMemo(() => {
    const max = Math.max(...dailyTrend.map((d) => d.durationSeconds), 0);
    return max > 0 ? max : 3600; // default 1h scale
  }, [dailyTrend]);

  const activeDaysPercentage =
    daysInRange > 0 ? Math.round((activeDaysCount / daysInRange) * 100) : 0;

  const totalTimeOfDaySeconds =
    timeOfDay.morning + timeOfDay.afternoon + timeOfDay.evening + timeOfDay.night;

  return (
    <div className="analytics-page">
      {/* ================================================
          HEADER
          ================================================ */}
      <header className="header">
        <div>
          <p className="eyebrow">INSIGHTS & TRENDS</p>
          <h1>Analytics</h1>
          <p className="subtitle">
            Understand your focus patterns and productivity over time.
          </p>
        </div>

        {/* Range Selector */}
        <div className="analytics-range-selector">
          <button
            className={`range-button ${timeRange === "7d" ? "active" : ""}`}
            onClick={() => setTimeRange("7d")}
            type="button"
          >
            7 Days
          </button>
          <button
            className={`range-button ${timeRange === "30d" ? "active" : ""}`}
            onClick={() => setTimeRange("30d")}
            type="button"
          >
            30 Days
          </button>
          <button
            className={`range-button ${timeRange === "90d" ? "active" : ""}`}
            onClick={() => setTimeRange("90d")}
            type="button"
          >
            90 Days
          </button>
          <button
            className={`range-button ${timeRange === "all" ? "active" : ""}`}
            onClick={() => setTimeRange("all")}
            type="button"
          >
            All Time
          </button>
        </div>
      </header>

      {/* ================================================
          TOP STATS GRID (4 KPIs)
          ================================================ */}
      <section className="analytics-stats-grid">
        <div className="stat-card">
          <span>Total focused time</span>
          <strong>{formatDurationSeconds(totalSeconds)}</strong>
          <small>
            {totalSessions} {totalSessions === 1 ? "session" : "sessions"} tracked
          </small>
        </div>

        <div className="stat-card">
          <span>Daily average</span>
          <strong>{formatDurationSeconds(dailyAverageSeconds)}</strong>
          <small>Per day in this window</small>
        </div>

        <div className="stat-card">
          <span>Active days</span>
          <strong>
            {activeDaysCount} <span className="stat-denom">/ {daysInRange}</span>
          </strong>
          <small>{activeDaysPercentage}% tracking consistency</small>
        </div>

        <div className="stat-card">
          <span>Current streak</span>
          <strong>{currentStreak} {currentStreak === 1 ? "day" : "days"} 🔥</strong>
          <small>
            {longestStreak > 0
              ? `Best record: ${longestStreak} ${longestStreak === 1 ? "day" : "days"}`
              : "Start a daily habit"}
          </small>
        </div>
      </section>

      {/* ================================================
          FOCUS TREND BAR CHART
          ================================================ */}
      <section className="card analytics-chart-card">
        <div className="card-header">
          <div>
            <p className="card-label">FOCUS TREND</p>
            <h2>Daily focus time</h2>
          </div>
          <span className="chart-max-label">
            Peak: {formatDurationSeconds(maxDailyDuration)}
          </span>
        </div>

        {loading ? (
          <p className="empty-text">Loading analytics data...</p>
        ) : dailyTrend.length === 0 ? (
          <p className="empty-text">No session data recorded in this period.</p>
        ) : (
          <div className="analytics-bar-chart-container">
            <div className="analytics-bar-chart">
              {dailyTrend.map((point, index) => {
                const heightPercent =
                  maxDailyDuration > 0
                    ? Math.max(
                        point.durationSeconds > 0 ? 8 : 2,
                        Math.round((point.durationSeconds / maxDailyDuration) * 100),
                      )
                    : 2;

                const isHovered = hoveredBarIndex === index;

                return (
                  <div
                    key={point.dateString}
                    className={`analytics-bar-column ${isHovered ? "hovered" : ""}`}
                    onMouseEnter={() => setHoveredBarIndex(index)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                  >
                    {/* Tooltip */}
                    {isHovered && (
                      <div className="analytics-bar-tooltip">
                        <p className="tooltip-date">{point.fullDateLabel}</p>
                        <p className="tooltip-value">
                          {formatDurationSeconds(point.durationSeconds)}
                        </p>
                        <p className="tooltip-sub">
                          {point.sessionCount}{" "}
                          {point.sessionCount === 1 ? "session" : "sessions"}
                        </p>
                      </div>
                    )}

                    {/* Bar graphic */}
                    <div className="bar-track">
                      <div
                        className={`bar-fill ${point.durationSeconds > 0 ? "active" : "zero"}`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>

                    {/* X-axis label */}
                    <span className="bar-label">{point.dayLabel}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ================================================
          BOTTOM 2-COLUMN GRID (Activities & Focus Patterns)
          ================================================ */}
      <section className="analytics-bottom-grid">
        {/* Activity Distribution */}
        <div className="card">
          <div className="card-header">
            <div>
              <p className="card-label">ACTIVITIES</p>
              <h2>Activity distribution</h2>
            </div>
            <span className="card-meta">
              {activityStats.length}{" "}
              {activityStats.length === 1 ? "category" : "categories"}
            </span>
          </div>

          <div className="analytics-activity-list">
            {activityStats.length === 0 ? (
              <p className="empty-text">No activity data in this period.</p>
            ) : (
              activityStats.map((stat) => (
                <div className="analytics-activity-row" key={stat.activity}>
                  <div className="analytics-activity-header">
                    <div className="analytics-activity-info">
                      <strong>{stat.activity}</strong>
                      <span className="analytics-session-tag">
                        {stat.sessionCount}{" "}
                        {stat.sessionCount === 1 ? "session" : "sessions"}
                      </span>
                    </div>
                    <div className="analytics-activity-values">
                      <strong>{formatDurationSeconds(stat.totalSeconds)}</strong>
                      <span className="analytics-percent">
                        {Math.round(stat.percentage)}%
                      </span>
                    </div>
                  </div>

                  <div className="analytics-progress-bar">
                    <div
                      className="analytics-progress-fill"
                      style={{ width: `${stat.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Focus Patterns & Insights */}
        <div className="card analytics-patterns-card">
          <div className="card-header">
            <div>
              <p className="card-label">FOCUS PATTERNS</p>
              <h2>Time of day & insights</h2>
            </div>
          </div>

          <div className="time-of-day-grid">
            <div className="time-block-card">
              <div className="time-block-header">
                <span>🌅 Morning</span>
                <small>06:00 – 12:00</small>
              </div>
              <strong>{formatDurationSeconds(timeOfDay.morning)}</strong>
              <div className="analytics-mini-progress">
                <div
                  style={{
                    width: `${
                      totalTimeOfDaySeconds > 0
                        ? (timeOfDay.morning / totalTimeOfDaySeconds) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="time-block-card">
              <div className="time-block-header">
                <span>☀️ Afternoon</span>
                <small>12:00 – 18:00</small>
              </div>
              <strong>{formatDurationSeconds(timeOfDay.afternoon)}</strong>
              <div className="analytics-mini-progress">
                <div
                  style={{
                    width: `${
                      totalTimeOfDaySeconds > 0
                        ? (timeOfDay.afternoon / totalTimeOfDaySeconds) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="time-block-card">
              <div className="time-block-header">
                <span>🌆 Evening</span>
                <small>18:00 – 24:00</small>
              </div>
              <strong>{formatDurationSeconds(timeOfDay.evening)}</strong>
              <div className="analytics-mini-progress">
                <div
                  style={{
                    width: `${
                      totalTimeOfDaySeconds > 0
                        ? (timeOfDay.evening / totalTimeOfDaySeconds) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="time-block-card">
              <div className="time-block-header">
                <span>🌙 Night</span>
                <small>00:00 – 06:00</small>
              </div>
              <strong>{formatDurationSeconds(timeOfDay.night)}</strong>
              <div className="analytics-mini-progress">
                <div
                  style={{
                    width: `${
                      totalTimeOfDaySeconds > 0
                        ? (timeOfDay.night / totalTimeOfDaySeconds) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="analytics-insights-summary">
            <div className="insight-item">
              <span className="insight-icon">📅</span>
              <div>
                <small>Most focused day</small>
                <strong>
                  {mostProductiveDayOfWeek
                    ? `${mostProductiveDayOfWeek}s`
                    : "Not enough data"}
                </strong>
              </div>
            </div>

            <div className="insight-item">
              <span className="insight-icon">⏱️</span>
              <div>
                <small>Avg session duration</small>
                <strong>
                  {averageSessionSeconds > 0
                    ? formatDurationSeconds(averageSessionSeconds)
                    : "0m"}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AnalyticsPage;
