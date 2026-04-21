import { useEffect, useMemo, useState } from "react";
import { createMeal, createMealPlan, deleteMeal, deleteMealPlan, getMealPlans, getMeals } from "../services/api";

function MealPlanner() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [meals, setMeals] = useState([]);
  const [mealPlans, setMealPlans] = useState([]);
  const [error, setError] = useState("");
  const [mealForm, setMealForm] = useState({
    name: "",
    servings: "1",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    notes: "",
    ingredientName: "",
    ingredientQuantity: "",
    ingredientUnit: "g",
    ingredientPricePerUnit: "",
  });
  const [planForm, setPlanForm] = useState({ mealId: "", servings: "1" });

  async function loadData(selectedDate) {
    setError("");

    try {
      const [mealsData, mealPlansData] = await Promise.all([
        getMeals(),
        getMealPlans(selectedDate),
      ]);

      setMeals(mealsData.meals);
      setMealPlans(mealPlansData.mealPlans);

      if (!planForm.mealId && mealsData.meals.length > 0) {
        setPlanForm((previous) => ({ ...previous, mealId: mealsData.meals[0].id }));
      }
    } catch (requestError) {
      setError(requestError.message || "Unable to load planner data");
    }
  }

  useEffect(() => {
    loadData(date);
  }, [date]);

  function updateMealForm(event) {
    const { name, value } = event.target;
    setMealForm((previous) => ({ ...previous, [name]: value }));
  }

  function updatePlanForm(event) {
    const { name, value } = event.target;
    setPlanForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleCreateMeal(event) {
    event.preventDefault();

    const ingredients = mealForm.ingredientName
      ? [
          {
            name: mealForm.ingredientName,
            quantity: mealForm.ingredientQuantity,
            unit: mealForm.ingredientUnit,
            pricePerUnit: mealForm.ingredientPricePerUnit,
          },
        ]
      : [];

    try {
      await createMeal({
        name: mealForm.name,
        servings: mealForm.servings,
        calories: mealForm.calories,
        protein: mealForm.protein,
        carbs: mealForm.carbs,
        fat: mealForm.fat,
        notes: mealForm.notes,
        ingredients,
      });

      setMealForm({
        name: "",
        servings: "1",
        calories: "",
        protein: "",
        carbs: "",
        fat: "",
        notes: "",
        ingredientName: "",
        ingredientQuantity: "",
        ingredientUnit: "g",
        ingredientPricePerUnit: "",
      });
      await loadData(date);
    } catch (requestError) {
      setError(requestError.message || "Failed to create meal");
    }
  }

  async function handleCreateMealPlan(event) {
    event.preventDefault();

    if (!planForm.mealId) {
      setError("Select a meal first");
      return;
    }

    try {
      await createMealPlan({
        mealId: planForm.mealId,
        date,
        servings: planForm.servings,
      });
      await loadData(date);
    } catch (requestError) {
      setError(requestError.message || "Failed to create meal plan entry");
    }
  }

  async function handleDeleteMeal(mealId) {
    try {
      await deleteMeal(mealId);
      await loadData(date);
    } catch (requestError) {
      setError(requestError.message || "Failed to delete meal");
    }
  }

  async function handleDeleteMealPlan(mealPlanId) {
    try {
      await deleteMealPlan(mealPlanId);
      await loadData(date);
    } catch (requestError) {
      setError(requestError.message || "Failed to delete plan");
    }
  }

  const mealById = useMemo(() => {
    return new Map(meals.map((meal) => [meal.id, meal]));
  }, [meals]);

  return (
    <section className="page">
      <header className="page__header">
        <h1>Meal Planner</h1>
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      </header>

      {error && <p className="message message--error">{error}</p>}

      <div className="panel-grid">
        <section className="panel">
          <h2>Create meal</h2>
          <form className="stack-form" onSubmit={handleCreateMeal}>
            <input name="name" placeholder="Meal name" value={mealForm.name} onChange={updateMealForm} required />
            <input name="servings" type="number" placeholder="Servings" value={mealForm.servings} onChange={updateMealForm} />
            <input name="calories" type="number" placeholder="Calories" value={mealForm.calories} onChange={updateMealForm} />
            <input name="protein" type="number" placeholder="Protein (g)" value={mealForm.protein} onChange={updateMealForm} />
            <input name="carbs" type="number" placeholder="Carbs (g)" value={mealForm.carbs} onChange={updateMealForm} />
            <input name="fat" type="number" placeholder="Fat (g)" value={mealForm.fat} onChange={updateMealForm} />
            <textarea name="notes" placeholder="Notes" value={mealForm.notes} onChange={updateMealForm} />
            <input name="ingredientName" placeholder="Ingredient" value={mealForm.ingredientName} onChange={updateMealForm} />
            <input name="ingredientQuantity" type="number" placeholder="Ingredient quantity" value={mealForm.ingredientQuantity} onChange={updateMealForm} />
            <input name="ingredientUnit" placeholder="Ingredient unit" value={mealForm.ingredientUnit} onChange={updateMealForm} />
            <input name="ingredientPricePerUnit" type="number" step="0.01" placeholder="Price per unit" value={mealForm.ingredientPricePerUnit} onChange={updateMealForm} />
            <button type="submit">Save meal</button>
          </form>
        </section>

        <section className="panel">
          <h2>Assign meal to day</h2>
          <form className="stack-form" onSubmit={handleCreateMealPlan}>
            <select name="mealId" value={planForm.mealId} onChange={updatePlanForm}>
              <option value="">Select meal</option>
              {meals.map((meal) => (
                <option key={meal.id} value={meal.id}>
                  {meal.name}
                </option>
              ))}
            </select>
            <input name="servings" type="number" value={planForm.servings} onChange={updatePlanForm} />
            <button type="submit">Add to plan</button>
          </form>

          <h2>Planned meals</h2>
          {mealPlans.length === 0 ? (
            <p>No meals planned for this day.</p>
          ) : (
            <ul className="list">
              {mealPlans.map((plan) => {
                const meal = mealById.get(plan.mealId);
                return (
                  <li key={plan.id}>
                    <div>
                      <strong>{meal ? meal.name : "Unknown meal"}</strong>
                      <p>
                        {plan.date} • {plan.servings} serving(s)
                      </p>
                    </div>
                    <button type="button" onClick={() => handleDeleteMealPlan(plan.id)}>
                      Remove
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <section className="panel">
        <h2>Saved meals</h2>
        {meals.length === 0 ? (
          <p>No meals created yet.</p>
        ) : (
          <ul className="list">
            {meals.map((meal) => (
              <li key={meal.id}>
                <div>
                  <strong>{meal.name}</strong>
                  <p>
                    {meal.calories} kcal • P:{meal.protein} C:{meal.carbs} F:{meal.fat}
                  </p>
                </div>
                <button type="button" onClick={() => handleDeleteMeal(meal.id)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}

export default MealPlanner;