import { useMemo, useState } from "react";

import { createPlan, type Plan } from "../db/planRepository";

interface PlansPageProps {
  plans: Plan[];
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
  onToggleCompleted: (planId: number, completed: boolean) => Promise<void>;
}

function getLocalDateString() {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function formatPlanDate(dateString: string) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function PlansPage({
  plans,
  loading,
  error,
  onRefresh,
  onToggleCompleted,
}: PlansPageProps) {
  const [title, setTitle] = useState("");
  const [plannedFor, setPlannedFor] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [updatingPlanId, setUpdatingPlanId] = useState<number | null>(null);

  const tomorrow = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    const offset = date.getTimezoneOffset() * 60_000;

    return new Date(date.getTime() - offset).toISOString().slice(0, 10);
  }, []);

  const handleCreatePlan = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = title.trim();

    if (!trimmedTitle || !plannedFor) {
      setFormError("Add a plan title and choose a future date.");
      return;
    }

    if (plannedFor <= getLocalDateString()) {
      setFormError("Plans must be scheduled for a future date.");
      return;
    }

    try {
      setSaving(true);
      setFormError(null);
      await createPlan(trimmedTitle, plannedFor);
      setTitle("");
      setPlannedFor("");
      await onRefresh();
    } catch (createError) {
      console.error("Failed to create plan:", createError);
      setFormError("Could not save this plan. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (plan: Plan) => {
    try {
      setUpdatingPlanId(plan.id);
      await onToggleCompleted(plan.id, plan.is_completed === 0);
    } catch (toggleError) {
      console.error("Failed to update plan:", toggleError);
      setFormError("Could not update this plan. Please try again.");
    } finally {
      setUpdatingPlanId(null);
    }
  };

  const plannedCount = plans.filter((plan) => plan.is_completed === 0).length;
  const completedCount = plans.length - plannedCount;

  return (
    <div>
      <header className="header">
        <div>
          <p className="eyebrow">FUTURE FOCUS</p>
          <h1>Upcoming plans</h1>
          <p className="subtitle">Make a promise to your future self.</p>
        </div>
      </header>

      <section className="stats-grid">
        <div className="stat-card">
          <span>Upcoming plans</span>
          <strong>{plannedCount}</strong>
          <small>Still to be completed</small>
        </div>
        <div className="stat-card">
          <span>Completed early</span>
          <strong>{completedCount}</strong>
          <small>For upcoming days</small>
        </div>
        <div className="stat-card">
          <span>Next planned day</span>
          <strong>{plans[0] ? formatPlanDate(plans[0].planned_for) : "—"}</strong>
          <small>Your closest commitment</small>
        </div>
      </section>

      <section className="plans-grid">
        <form className="card plan-form" onSubmit={handleCreatePlan}>
          <div className="card-header">
            <div>
              <p className="card-label">NEW PLAN</p>
              <h2>Plan an upcoming day</h2>
            </div>
          </div>

          <label className="form-label" htmlFor="plan-title">
            What do you want to do?
          </label>
          <input
            id="plan-title"
            className="text-input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Complete DSA revision"
            maxLength={120}
          />

          <label className="form-label" htmlFor="planned-for">
            Which day?
          </label>
          <input
            id="planned-for"
            className="text-input"
            type="date"
            min={tomorrow}
            value={plannedFor}
            onChange={(event) => setPlannedFor(event.target.value)}
          />

          {formError && <p className="form-error">{formError}</p>}

          <button className="primary-button" disabled={saving} type="submit">
            {saving ? "Saving plan..." : "Add plan"}
          </button>
        </form>

        <section className="card plans-list-card">
          <div className="card-header">
            <div>
              <p className="card-label">YOUR SCHEDULE</p>
              <h2>What is coming up</h2>
            </div>
          </div>

          {loading ? (
            <p className="empty-text">Loading upcoming plans...</p>
          ) : error ? (
            <p className="form-error">{error}</p>
          ) : plans.length === 0 ? (
            <p className="empty-text">No future plans yet. Add your first one.</p>
          ) : (
            <div className="plans-list">
              {plans.map((plan) => {
                const completed = plan.is_completed === 1;
                const isUpdating = updatingPlanId === plan.id;

                return (
                  <div className={`plan-row ${completed ? "completed" : ""}`} key={plan.id}>
                    <button
                      aria-label={completed ? "Mark plan incomplete" : "Mark plan complete"}
                      className="plan-checkbox"
                      disabled={isUpdating}
                      onClick={() => handleToggle(plan)}
                      type="button"
                    >
                      {completed ? "✓" : ""}
                    </button>
                    <div className="plan-details">
                      <strong>{plan.title}</strong>
                      <span>{formatPlanDate(plan.planned_for)}</span>
                    </div>
                    <span className="plan-status">
                      {isUpdating ? "Saving..." : completed ? "Completed" : "Planned"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </div>
  );
}

export default PlansPage;
