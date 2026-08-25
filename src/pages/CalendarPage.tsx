import { useMemo, useState } from "react";

import type { Plan } from "../db/planRepository";
import type { Session } from "../db/sessionRepository";
import { formatMinutes } from "../utils/time";

interface CalendarPageProps {
  sessions: Session[];
  plans: Plan[];
}

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getLocalDateString(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function getDateFromSession(session: Session) {
  return getLocalDateString(new Date(session.started_at));
}

function formatMonth(date: Date) {
  return date.toLocaleDateString([], { month: "long", year: "numeric" });
}

function formatSelectedDate(dateString: string) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function CalendarPage({ sessions, plans }: CalendarPageProps) {
  const today = getLocalDateString(new Date());
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(today);

  const sessionsByDate = useMemo(() => {
    return sessions.reduce<Record<string, Session[]>>((grouped, session) => {
      const date = getDateFromSession(session);
      (grouped[date] ??= []).push(session);

      return grouped;
    }, {});
  }, [sessions]);

  const plansByDate = useMemo(() => {
    return plans.reduce<Record<string, Plan[]>>((grouped, plan) => {
      (grouped[plan.planned_for] ??= []).push(plan);

      return grouped;
    }, {});
  }, [plans]);

  const calendarDays = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return [
      ...Array.from({ length: firstWeekday }, () => null),
      ...Array.from({ length: daysInMonth }, (_, index) => {
        const date = new Date(year, month, index + 1);

        return { day: index + 1, dateString: getLocalDateString(date) };
      }),
    ];
  }, [visibleMonth]);

  const selectedSessions = sessionsByDate[selectedDate] ?? [];
  const selectedPlans = plansByDate[selectedDate] ?? [];
  const selectedSeconds = selectedSessions.reduce(
    (total, session) => total + session.duration_seconds,
    0,
  );

  const changeMonth = (monthOffset: number) => {
    const nextMonth = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() + monthOffset,
      1,
    );

    setVisibleMonth(nextMonth);
    setSelectedDate(getLocalDateString(nextMonth));
  };

  return (
    <div>
      <header className="header">
        <div>
          <p className="eyebrow">TIME OVERVIEW</p>
          <h1>Calendar</h1>
          <p className="subtitle">Your sessions and plans, day by day.</p>
        </div>
      </header>

      <section className="calendar-layout">
        <div className="card calendar-card">
          <div className="calendar-toolbar">
            <button
              aria-label="Previous month"
              className="month-button"
              onClick={() => changeMonth(-1)}
              type="button"
            >
              ←
            </button>
            <h2>{formatMonth(visibleMonth)}</h2>
            <button
              aria-label="Next month"
              className="month-button"
              onClick={() => changeMonth(1)}
              type="button"
            >
              →
            </button>
          </div>

          <div className="calendar-weekdays">
            {weekdayLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <div className="calendar-grid">
            {calendarDays.map((calendarDay, index) => {
              if (!calendarDay) {
                return <div className="calendar-empty-day" key={`empty-${index}`} />;
              }

              const daySessions = sessionsByDate[calendarDay.dateString] ?? [];
              const dayPlans = plansByDate[calendarDay.dateString] ?? [];
              const isSelected = calendarDay.dateString === selectedDate;
              const isToday = calendarDay.dateString === today;

              return (
                <button
                  className={`calendar-day ${isSelected ? "selected" : ""} ${
                    isToday ? "today" : ""
                  }`}
                  key={calendarDay.dateString}
                  onClick={() => setSelectedDate(calendarDay.dateString)}
                  type="button"
                >
                  <span className="calendar-day-number">{calendarDay.day}</span>
                  <span className="calendar-day-indicators">
                    {daySessions.length > 0 && <i className="session-indicator" />}
                    {dayPlans.length > 0 && <i className="plan-indicator" />}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="calendar-legend">
            <span><i className="session-indicator" /> Focus sessions</span>
            <span><i className="plan-indicator" /> Plans</span>
          </div>
        </div>

        <aside className="card calendar-details">
          <p className="card-label">SELECTED DAY</p>
          <h2>{formatSelectedDate(selectedDate)}</h2>

          <div className="selected-day-total">
            <strong>{formatMinutes(Math.floor(selectedSeconds / 60))}</strong>
            <span>Focused time</span>
          </div>

          <div className="day-detail-section">
            <p className="card-label">SESSIONS</p>
            {selectedSessions.length === 0 ? (
              <p className="empty-text">No sessions tracked.</p>
            ) : (
              selectedSessions.map((session) => (
                <div className="day-item" key={session.id}>
                  <span>{session.activity}</span>
                  <strong>{formatMinutes(Math.floor(session.duration_seconds / 60))}</strong>
                </div>
              ))
            )}
          </div>

          <div className="day-detail-section">
            <p className="card-label">PLANS</p>
            {selectedPlans.length === 0 ? (
              <p className="empty-text">No plans scheduled.</p>
            ) : (
              selectedPlans.map((plan) => (
                <div className="day-item" key={plan.id}>
                  <span className={plan.is_completed ? "completed-plan-title" : ""}>
                    {plan.title}
                  </span>
                  <strong>{plan.is_completed ? "Done" : "Planned"}</strong>
                </div>
              ))
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}

export default CalendarPage;
