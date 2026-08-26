import { useMemo, useState } from "react";

import {
  createPlan,
  type Plan,
  type PlanCategory,
  type PlanPriority,
} from "../db/planRepository";

interface PlansPageProps {
  plans: Plan[];
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
  onToggleCompleted: (planId: number, completed: boolean) => Promise<void>;
  onDeletePlan: (planId: number) => Promise<void>;
}

function getLocalDateString(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function getTomorrowDateString() {
  const date = new Date();

  date.setDate(date.getDate() + 1);

  return getLocalDateString(date);
}

function formatPlanDate(dateString: string) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString([], {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function formatDuration(minutes: number) {
  if (minutes <= 0) {
    return "No estimate";
  }

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

function PlansPage({
  plans,
  loading,
  error,
  onRefresh,
  onToggleCompleted,
  onDeletePlan,
}: PlansPageProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [plannedFor, setPlannedFor] = useState(getTomorrowDateString());

  const [priority, setPriority] = useState<PlanPriority>("medium");

  const [category, setCategory] = useState<PlanCategory>("DSA");

  const [estimatedMinutes, setEstimatedMinutes] = useState("60");

  const [formError, setFormError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  const [updatingPlanId, setUpdatingPlanId] = useState<number | null>(null);

  const [deletingPlanId, setDeletingPlanId] = useState<number | null>(null);

  const today = getLocalDateString();

  const upcomingPlans = useMemo(
    () =>
      plans.filter(
        (plan) => plan.planned_for > today && plan.is_completed === 0,
      ),
    [plans, today],
  );

  const todayPlans = useMemo(
    () =>
      plans.filter(
        (plan) => plan.planned_for === today && plan.is_completed === 0,
      ),
    [plans, today],
  );

  const completedPlans = useMemo(
    () => plans.filter((plan) => plan.is_completed === 1),
    [plans],
  );

  const plannedMinutes = plans
    .filter((plan) => plan.is_completed === 0)
    .reduce((total, plan) => total + plan.estimated_minutes, 0);

  const handleCreatePlan = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    const parsedMinutes = Number(estimatedMinutes);

    if (!trimmedTitle) {
      setFormError("Give your plan a title.");
      return;
    }

    if (!plannedFor) {
      setFormError("Choose a date.");
      return;
    }

    if (plannedFor < today) {
      setFormError("Plans cannot be scheduled in the past.");
      return;
    }

    if (
      !Number.isFinite(parsedMinutes) ||
      parsedMinutes < 0 ||
      parsedMinutes > 1440
    ) {
      setFormError("Estimated duration must be between 0 and 1440 minutes.");
      return;
    }

    try {
      setSaving(true);
      setFormError(null);

      await createPlan({
        title: trimmedTitle,
        description: trimmedDescription,
        planned_for: plannedFor,
        priority,
        category,
        estimated_minutes: Math.floor(parsedMinutes),
      });

      setTitle("");
      setDescription("");
      setPlannedFor(getTomorrowDateString());
      setPriority("medium");
      setCategory("DSA");
      setEstimatedMinutes("60");

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
      setFormError(null);

      await onToggleCompleted(plan.id, plan.is_completed === 0);
    } catch (toggleError) {
      console.error("Failed to update plan:", toggleError);

      setFormError("Could not update this plan. Please try again.");
    } finally {
      setUpdatingPlanId(null);
    }
  };

  const handleDelete = async (plan: Plan) => {
    const confirmed = window.confirm(`Delete "${plan.title}"?`);

    if (!confirmed) {
      return;
    }

    try {
      setDeletingPlanId(plan.id);
      setFormError(null);

      await onDeletePlan(plan.id);
    } catch (deleteError) {
      console.error("Failed to delete plan:", deleteError);

      setFormError("Could not delete this plan. Please try again.");
    } finally {
      setDeletingPlanId(null);
    }
  };

  return (
    <div>
      <header className="header">
        <div>
          <p className="eyebrow">PERSONAL PLANNING</p>

          <h1>Plans</h1>

          <p className="subtitle">Decide what matters before the day begins.</p>
        </div>
      </header>

      <section className="stats-grid">
        <div className="stat-card">
          <span>Today's plans</span>

          <strong>{todayPlans.length}</strong>

          <small>Things you want to accomplish today</small>
        </div>

        <div className="stat-card">
          <span>Upcoming</span>

          <strong>{upcomingPlans.length}</strong>

          <small>{formatDuration(plannedMinutes)} estimated</small>
        </div>

        <div className="stat-card">
          <span>Completed</span>

          <strong>{completedPlans.length}</strong>

          <small>Plans you've already finished</small>
        </div>
      </section>

      <section className="plans-grid">
        <form className="card plan-form" onSubmit={handleCreatePlan}>
          <div className="card-header">
            <div>
              <p className="card-label">NEW PLAN</p>

              <h2>Plan something</h2>
            </div>
          </div>

          <label className="form-label" htmlFor="plan-title">
            What do you want to accomplish?
          </label>

          <input
            id="plan-title"
            className="text-input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Complete DSA revision"
            maxLength={120}
          />

          <label className="form-label" htmlFor="plan-description">
            Notes
          </label>

          <textarea
            id="plan-description"
            className="text-input plan-description-input"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Optional details..."
            maxLength={300}
            rows={3}
          />

          <label className="form-label" htmlFor="planned-for">
            Which day?
          </label>

          <input
            id="planned-for"
            className="text-input"
            type="date"
            min={today}
            value={plannedFor}
            onChange={(event) => setPlannedFor(event.target.value)}
          />

          <div className="plan-form-row">
            <div>
              <label className="form-label" htmlFor="plan-category">
                Category
              </label>

              <select
                id="plan-category"
                className="text-input"
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value as PlanCategory)
                }
              >
                <option value="DSA">DSA</option>
                <option value="Development">Development</option>
                <option value="Placement">Placement</option>
                <option value="Academics">Academics</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="form-label" htmlFor="plan-priority">
                Priority
              </label>

              <select
                id="plan-priority"
                className="text-input"
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value as PlanPriority)
                }
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <label className="form-label" htmlFor="estimated-minutes">
            Estimated duration (minutes)
          </label>

          <input
            id="estimated-minutes"
            className="text-input"
            type="number"
            min="0"
            max="1440"
            step="15"
            value={estimatedMinutes}
            onChange={(event) => setEstimatedMinutes(event.target.value)}
          />

          {formError && <p className="form-error">{formError}</p>}

          <button className="primary-button" disabled={saving} type="submit">
            {saving ? "Saving plan..." : "Add plan"}
          </button>
        </form>

        <section className="card plans-list-card">
          <div className="card-header">
            <div>
              <p className="card-label">YOUR PLAN</p>

              <h2>Today</h2>
            </div>
          </div>

          {loading ? (
            <p className="empty-text">Loading plans...</p>
          ) : error ? (
            <p className="form-error">{error}</p>
          ) : todayPlans.length === 0 ? (
            <p className="empty-text">Nothing planned for today.</p>
          ) : (
            <div className="plans-list">
              {todayPlans.map((plan) => (
                <PlanRow
                  key={plan.id}
                  plan={plan}
                  updatingPlanId={updatingPlanId}
                  deletingPlanId={deletingPlanId}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          <div className="plans-section-divider" />

          <div className="card-header">
            <div>
              <p className="card-label">NEXT</p>

              <h2>Upcoming</h2>
            </div>
          </div>

          {!loading && upcomingPlans.length === 0 && (
            <p className="empty-text">No upcoming plans yet.</p>
          )}

          {!loading && upcomingPlans.length > 0 && (
            <div className="plans-list">
              {upcomingPlans.map((plan) => (
                <PlanRow
                  key={plan.id}
                  plan={plan}
                  updatingPlanId={updatingPlanId}
                  deletingPlanId={deletingPlanId}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          <div className="plans-section-divider" />

          <div className="card-header">
            <div>
              <p className="card-label">DONE</p>

              <h2>Completed</h2>
            </div>
          </div>

          {!loading && completedPlans.length === 0 && (
            <p className="empty-text">Completed plans will appear here.</p>
          )}

          {!loading && completedPlans.length > 0 && (
            <div className="plans-list">
              {completedPlans.map((plan) => (
                <PlanRow
                  key={plan.id}
                  plan={plan}
                  updatingPlanId={updatingPlanId}
                  deletingPlanId={deletingPlanId}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </section>
      </section>
    </div>
  );
}

interface PlanRowProps {
  plan: Plan;
  updatingPlanId: number | null;
  deletingPlanId: number | null;
  onToggle: (plan: Plan) => Promise<void>;
  onDelete: (plan: Plan) => Promise<void>;
}

function PlanRow({
  plan,
  updatingPlanId,
  deletingPlanId,
  onToggle,
  onDelete,
}: PlanRowProps) {
  const completed = plan.is_completed === 1;

  const isUpdating = updatingPlanId === plan.id;
  const isDeleting = deletingPlanId === plan.id;

  return (
    <div className={`plan-row ${completed ? "completed" : ""}`}>
      <button
        aria-label={completed ? "Mark plan incomplete" : "Mark plan complete"}
        className="plan-checkbox"
        disabled={isUpdating || isDeleting}
        onClick={() => onToggle(plan)}
        type="button"
      >
        {completed ? "✓" : ""}
      </button>

      <div className="plan-details">
        <strong>{plan.title}</strong>

        <span>
          {formatPlanDate(plan.planned_for)}
          {" · "}
          {plan.category}
          {" · "}
          {formatDuration(plan.estimated_minutes)}
        </span>

        {plan.description && (
          <small className="plan-description">{plan.description}</small>
        )}
      </div>

      <div className="plan-row-right">
        <span className={`priority-badge priority-${plan.priority}`}>
          {plan.priority}
        </span>

        <span className="plan-status">
          {isUpdating
            ? "Saving..."
            : isDeleting
              ? "Deleting..."
              : completed
                ? "Completed"
                : "Planned"}
        </span>

        <button
          className="delete-plan-button"
          disabled={isUpdating || isDeleting}
          onClick={() => onDelete(plan)}
          type="button"
          aria-label={`Delete ${plan.title}`}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default PlansPage;
