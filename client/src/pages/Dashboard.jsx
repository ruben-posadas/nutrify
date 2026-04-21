import { useEffect, useMemo, useState } from "react";
import {
  createFoodLog,
  deleteFoodLog,
  getDashboardSummary,
  getWeeklySummary,
  updateGoals,
} from "../services/api";

function Dashboard() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [summary, setSummary] = useState(null);
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    mealType: "Breakfast",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });
  const [goalsForm, setGoalsForm] = useState({
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
  });

  async function loadSummary(selectedDate) {
    setIsLoading(true);
    setError("");

    try {
      const [dailySummary, weekly] = await Promise.all([
        getDashboardSummary(selectedDate),
        getWeeklySummary(selectedDate),
      ]);
      setSummary(dailySummary);
      setWeeklySummary(weekly);
      setGoalsForm({
        calories: String(dailySummary.goals?.calories ?? ""),
        protein: String(dailySummary.goals?.protein ?? ""),
        carbs: String(dailySummary.goals?.carbs ?? ""),
        fat: String(dailySummary.goals?.fat ?? ""),
      });
    } catch (requestError) {
      setError(requestError.message || "Unable to load dashboard");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSummary(date);
  }, [date]);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  }

  function handleGoalsChange(event) {
    const { name, value } = event.target;
    setGoalsForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleUpdateGoals(event) {
    event.preventDefault();
    setError("");

    try {
      await updateGoals(goalsForm);
      await loadSummary(date);
    } catch (requestError) {
      setError(requestError.message || "Failed to update goals");
    }
  }

  async function handleCreateFoodLog(event) {
    event.preventDefault();
    setError("");

    try {
      await createFoodLog({ ...formData, date });
      setFormData({
        name: "",
        mealType: "Breakfast",
        calories: "",
        protein: "",
        carbs: "",
        fat: "",
      });
      await loadSummary(date);
    } catch (requestError) {
      setError(requestError.message || "Failed to add food log");
    }
  }

  async function handleDeleteFoodLog(foodLogId) {
    try {
      await deleteFoodLog(foodLogId);
      await loadSummary(date);
    } catch (requestError) {
      setError(requestError.message || "Failed to delete food log");
    }
  }

  const cards = useMemo(() => {
    if (!summary) {
      return [];
    }

    return [
      {
        label: "Calories",
        total: summary.totals.calories,
        goal: summary.goals?.calories,
        unit: "kcal",
      },
      {
        label: "Protein",
        total: summary.totals.protein,
        goal: summary.goals?.protein,
        unit: "g",
      },
      {
        label: "Carbs",
        total: summary.totals.carbs,
        goal: summary.goals?.carbs,
        unit: "g",
      },
      {
        label: "Fat",
        total: summary.totals.fat,
        goal: summary.goals?.fat,
        unit: "g",
      },
    ];
  }, [summary]);

  const weeklyMaxCalories = useMemo(() => {
    if (!weeklySummary?.days?.length) {
      return 1;
    }

    const highestDailyCalories = Math.max(...weeklySummary.days.map((day) => day.calories));
    return Math.max(highestDailyCalories, weeklySummary.goals?.calories || 0, 1);
  }, [weeklySummary]);

  function getDayLabel(isoDate) {
    const dateValue = new Date(`${isoDate}T00:00:00`);
    return dateValue.toLocaleDateString(undefined, { weekday: "short" });
  }

  return (
    <section className="page">
      <header className="page__header">
        <h1>Dashboard</h1>
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </header>

      {error && <p className="message message--error">{error}</p>}
      {isLoading && <p>Loading dashboard...</p>}

      {summary && !isLoading && (
        <>
          <div className="card-grid">
            {cards.map((card) => (
              <article className="card" key={card.label}>
                <h2>{card.label}</h2>
                <p>
                  {card.total} {card.unit}
                </p>
                {card.goal ? (
                  <small>
                    Goal: {card.goal} {card.unit}
                  </small>
                ) : null}
              </article>
            ))}
          </div>

          {weeklySummary ? (
            <section className="panel panel--full">
              <h2>7-day trend</h2>
              <p>
                Avg daily intake: {weeklySummary.averages.calories} kcal | Protein {weeklySummary.averages.protein}
                g | Carbs {weeklySummary.averages.carbs}g | Fat {weeklySummary.averages.fat}g
              </p>
              <p>
                Logged days: {weeklySummary.loggedDays}/7 | Goal-hit days: {weeklySummary.goalHitDays?.all || 0}
                /7 | Adherence: {weeklySummary.adherenceScore ?? 0}%
              </p>

              <div className="weekly-bars" aria-label="7 day calorie trend">
                {weeklySummary.days.map((day) => {
                  const height = Math.max((day.calories / weeklyMaxCalories) * 100, 5);

                  return (
                    <article key={day.date} className="weekly-bars__item">
                      <div className="weekly-bars__track">
                        <div className="weekly-bars__fill" style={{ height: `${height}%` }} />
                      </div>
                      <strong>{Math.round(day.calories)}</strong>
                      <small>{getDayLabel(day.date)}</small>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}

          <div className="panel-grid">
            <section className="panel">
              <h2>Daily goals</h2>
              <form onSubmit={handleUpdateGoals} className="stack-form">
                <input
                  type="number"
                  name="calories"
                  placeholder="Calories goal"
                  value={goalsForm.calories}
                  onChange={handleGoalsChange}
                />
                <input
                  type="number"
                  name="protein"
                  placeholder="Protein goal (g)"
                  value={goalsForm.protein}
                  onChange={handleGoalsChange}
                />
                <input
                  type="number"
                  name="carbs"
                  placeholder="Carb goal (g)"
                  value={goalsForm.carbs}
                  onChange={handleGoalsChange}
                />
                <input
                  type="number"
                  name="fat"
                  placeholder="Fat goal (g)"
                  value={goalsForm.fat}
                  onChange={handleGoalsChange}
                />
                <button type="submit">Save goals</button>
              </form>
            </section>

            <section className="panel">
              <h2>Add meal log</h2>
              <form onSubmit={handleCreateFoodLog} className="stack-form">
                <input
                  type="text"
                  name="name"
                  placeholder="Food name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                <select name="mealType" value={formData.mealType} onChange={handleChange}>
                  <option>Breakfast</option>
                  <option>Lunch</option>
                  <option>Dinner</option>
                  <option>Snack</option>
                </select>
                <input
                  type="number"
                  name="calories"
                  placeholder="Calories"
                  value={formData.calories}
                  onChange={handleChange}
                />
                <input
                  type="number"
                  name="protein"
                  placeholder="Protein (g)"
                  value={formData.protein}
                  onChange={handleChange}
                />
                <input
                  type="number"
                  name="carbs"
                  placeholder="Carbs (g)"
                  value={formData.carbs}
                  onChange={handleChange}
                />
                <input
                  type="number"
                  name="fat"
                  placeholder="Fat (g)"
                  value={formData.fat}
                  onChange={handleChange}
                />
                <button type="submit">Add log</button>
              </form>
            </section>

            <section className="panel">
              <h2>Logged meals</h2>
              {summary.logs.length === 0 ? (
                <p>No entries for this day.</p>
              ) : (
                <ul className="list">
                  {summary.logs.map((log) => (
                    <li key={log.id}>
                      <div>
                        <strong>{log.name}</strong>
                        <p>
                          {log.mealType} • {log.calories} kcal • P:{log.protein} C:{log.carbs} F:{log.fat}
                        </p>
                      </div>
                      <button type="button" onClick={() => handleDeleteFoodLog(log.id)}>
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </section>
  );
}

export default Dashboard;