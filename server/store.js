const crypto = require("crypto");

const users = [];
const foodLogs = [];
const meals = [];
const mealPlans = [];

function createId() {
  return crypto.randomUUID();
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeDate(value) {
  if (!value) {
    return todayIso();
  }

  return String(value).slice(0, 10);
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sanitizeUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

function createUser({ name, email, passwordHash, calorieGoal, proteinGoal, carbGoal, fatGoal }) {
  const user = {
    id: createId(),
    name,
    email,
    passwordHash,
    goals: {
      calories: toNumber(calorieGoal),
      protein: toNumber(proteinGoal),
      carbs: toNumber(carbGoal),
      fat: toNumber(fatGoal),
    },
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  return user;
}

function getUserByEmail(email) {
  return users.find((user) => user.email === email) || null;
}

function getUserById(userId) {
  return users.find((user) => user.id === userId) || null;
}

function createFoodLog(userId, payload) {
  const foodLog = {
    id: createId(),
    userId,
    name: payload.name.trim(),
    mealType: payload.mealType?.trim() || "Meal",
    date: normalizeDate(payload.date),
    calories: toNumber(payload.calories),
    protein: toNumber(payload.protein),
    carbs: toNumber(payload.carbs),
    fat: toNumber(payload.fat),
    createdAt: new Date().toISOString(),
  };

  foodLogs.push(foodLog);
  return foodLog;
}

function listFoodLogs(userId, date) {
  return foodLogs.filter((foodLog) => {
    if (foodLog.userId !== userId) {
      return false;
    }

    if (!date) {
      return true;
    }

    return foodLog.date === normalizeDate(date);
  });
}

function deleteFoodLog(userId, foodLogId) {
  const index = foodLogs.findIndex(
    (foodLog) => foodLog.id === foodLogId && foodLog.userId === userId,
  );

  if (index === -1) {
    return false;
  }

  foodLogs.splice(index, 1);
  return true;
}

function getDailyTotals(userId, date) {
  const logs = listFoodLogs(userId, date);

  return logs.reduce(
    (totals, foodLog) => {
      totals.calories += foodLog.calories;
      totals.protein += foodLog.protein;
      totals.carbs += foodLog.carbs;
      totals.fat += foodLog.fat;
      return totals;
    },
    {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    },
  );
}

function getDashboardSummary(userId, date) {
  const user = getUserById(userId);
  const selectedDate = normalizeDate(date);
  const logs = listFoodLogs(userId, selectedDate);
  const totals = getDailyTotals(userId, selectedDate);
  const goals = user ? user.goals : null;

  return {
    date: selectedDate,
    totals,
    goals,
    remaining: goals
      ? {
          calories: Math.max(goals.calories - totals.calories, 0),
          protein: Math.max(goals.protein - totals.protein, 0),
          carbs: Math.max(goals.carbs - totals.carbs, 0),
          fat: Math.max(goals.fat - totals.fat, 0),
        }
      : null,
    logs,
  };
}

function normalizeIngredient(payload = {}) {
  const name = payload.name?.trim();

  if (!name) {
    return null;
  }

  return {
    id: createId(),
    name,
    quantity: toNumber(payload.quantity),
    unit: payload.unit?.trim() || "unit",
    pricePerUnit: toNumber(payload.pricePerUnit),
  };
}

function createMeal(userId, payload) {
  const ingredients = Array.isArray(payload.ingredients)
    ? payload.ingredients.map(normalizeIngredient).filter(Boolean)
    : [];

  const meal = {
    id: createId(),
    userId,
    name: payload.name.trim(),
    servings: Math.max(1, toNumber(payload.servings) || 1),
    calories: toNumber(payload.calories),
    protein: toNumber(payload.protein),
    carbs: toNumber(payload.carbs),
    fat: toNumber(payload.fat),
    notes: payload.notes?.trim() || "",
    ingredients,
    createdAt: new Date().toISOString(),
  };

  meals.push(meal);
  return meal;
}

function listMeals(userId) {
  return meals.filter((meal) => meal.userId === userId);
}

function getMealById(userId, mealId) {
  return meals.find((meal) => meal.userId === userId && meal.id === mealId) || null;
}

function updateMeal(userId, mealId, payload) {
  const meal = getMealById(userId, mealId);

  if (!meal) {
    return null;
  }

  meal.name = payload.name?.trim() || meal.name;
  meal.servings = Math.max(1, toNumber(payload.servings) || meal.servings);
  meal.calories = toNumber(payload.calories ?? meal.calories);
  meal.protein = toNumber(payload.protein ?? meal.protein);
  meal.carbs = toNumber(payload.carbs ?? meal.carbs);
  meal.fat = toNumber(payload.fat ?? meal.fat);
  meal.notes = payload.notes?.trim() ?? meal.notes;

  if (Array.isArray(payload.ingredients)) {
    meal.ingredients = payload.ingredients.map(normalizeIngredient).filter(Boolean);
  }

  return meal;
}

function deleteMeal(userId, mealId) {
  const index = meals.findIndex((meal) => meal.userId === userId && meal.id === mealId);

  if (index === -1) {
    return false;
  }

  meals.splice(index, 1);
  return true;
}

function createMealPlan(userId, payload) {
  const meal = getMealById(userId, payload.mealId);

  if (!meal) {
    return null;
  }

  const mealPlan = {
    id: createId(),
    userId,
    mealId: meal.id,
    date: normalizeDate(payload.date),
    servings: Math.max(1, toNumber(payload.servings) || 1),
    createdAt: new Date().toISOString(),
  };

  mealPlans.push(mealPlan);
  return mealPlan;
}

function listMealPlans(userId, date) {
  return mealPlans.filter((mealPlan) => {
    if (mealPlan.userId !== userId) {
      return false;
    }

    if (!date) {
      return true;
    }

    return mealPlan.date === normalizeDate(date);
  });
}

function deleteMealPlan(userId, mealPlanId) {
  const index = mealPlans.findIndex(
    (mealPlan) => mealPlan.userId === userId && mealPlan.id === mealPlanId,
  );

  if (index === -1) {
    return false;
  }

  mealPlans.splice(index, 1);
  return true;
}

function getGroceryList(userId, startDate, endDate) {
  const start = normalizeDate(startDate);
  const end = normalizeDate(endDate || startDate);
  const relevantMealPlans = mealPlans.filter(
    (mealPlan) =>
      mealPlan.userId === userId && mealPlan.date >= start && mealPlan.date <= end,
  );

  const aggregated = new Map();

  for (const mealPlan of relevantMealPlans) {
    const meal = getMealById(userId, mealPlan.mealId);

    if (!meal) {
      continue;
    }

    for (const ingredient of meal.ingredients) {
      const key = `${ingredient.name.toLowerCase()}::${ingredient.unit.toLowerCase()}`;
      const quantity = ingredient.quantity * mealPlan.servings;
      const cost = quantity * ingredient.pricePerUnit;
      const current = aggregated.get(key) || {
        name: ingredient.name,
        unit: ingredient.unit,
        quantity: 0,
        pricePerUnit: ingredient.pricePerUnit,
        cost: 0,
        mealCount: 0,
      };

      current.quantity += quantity;
      current.cost += cost;
      current.mealCount += 1;
      current.pricePerUnit = Math.max(current.pricePerUnit, ingredient.pricePerUnit);
      aggregated.set(key, current);
    }
  }

  const items = Array.from(aggregated.values()).sort((first, second) =>
    first.name.localeCompare(second.name),
  );

  const totalCost = items.reduce((sum, item) => sum + item.cost, 0);

  return {
    startDate: start,
    endDate: end,
    items,
    totalCost,
    mealCount: relevantMealPlans.length,
  };
}

module.exports = {
  createUser,
  getUserByEmail,
  getUserById,
  sanitizeUser,
  createFoodLog,
  listFoodLogs,
  deleteFoodLog,
  getDailyTotals,
  getDashboardSummary,
  createMeal,
  listMeals,
  getMealById,
  updateMeal,
  deleteMeal,
  createMealPlan,
  listMealPlans,
  deleteMealPlan,
  getGroceryList,
};