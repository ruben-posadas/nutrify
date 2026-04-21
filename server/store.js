const crypto = require("crypto");
const { pool } = require("./db");
const { buildCheaperAlternatives } = require("./groceryUtils");

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

function mapUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    goals: {
      calories: Number(row.calorie_goal),
      protein: Number(row.protein_goal),
      carbs: Number(row.carb_goal),
      fat: Number(row.fat_goal),
    },
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

async function createUser({ name, email, passwordHash, calorieGoal, proteinGoal, carbGoal, fatGoal }) {
  const id = createId();
  const result = await pool.query(
    `
      INSERT INTO users (
        id, name, email, password_hash,
        calorie_goal, protein_goal, carb_goal, fat_goal
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `,
    [
      id,
      name,
      email,
      passwordHash,
      toNumber(calorieGoal),
      toNumber(proteinGoal),
      toNumber(carbGoal),
      toNumber(fatGoal),
    ],
  );

  return mapUser(result.rows[0]);
}

async function getUserByEmail(email) {
  const result = await pool.query("SELECT * FROM users WHERE email = $1 LIMIT 1", [email]);
  return mapUser(result.rows[0]);
}

async function getUserById(userId) {
  const result = await pool.query("SELECT * FROM users WHERE id = $1 LIMIT 1", [userId]);
  return mapUser(result.rows[0]);
}

async function updateGoals(userId, goals) {
  const result = await pool.query(
    `
      UPDATE users
      SET
        calorie_goal = $1,
        protein_goal = $2,
        carb_goal = $3,
        fat_goal = $4
      WHERE id = $5
      RETURNING *
    `,
    [
      toNumber(goals.calories),
      toNumber(goals.protein),
      toNumber(goals.carbs),
      toNumber(goals.fat),
      userId,
    ],
  );

  return mapUser(result.rows[0]);
}

function mapFoodLog(row) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    mealType: row.meal_type,
    date: row.log_date instanceof Date ? row.log_date.toISOString().slice(0, 10) : String(row.log_date),
    calories: Number(row.calories),
    protein: Number(row.protein),
    carbs: Number(row.carbs),
    fat: Number(row.fat),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

async function createFoodLog(userId, payload) {
  const id = createId();
  const result = await pool.query(
    `
      INSERT INTO food_logs (
        id, user_id, name, meal_type, log_date,
        calories, protein, carbs, fat
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `,
    [
      id,
      userId,
      payload.name.trim(),
      payload.mealType?.trim() || "Meal",
      normalizeDate(payload.date),
      toNumber(payload.calories),
      toNumber(payload.protein),
      toNumber(payload.carbs),
      toNumber(payload.fat),
    ],
  );

  return mapFoodLog(result.rows[0]);
}

async function listFoodLogs(userId, date) {
  if (date) {
    const result = await pool.query(
      `
        SELECT *
        FROM food_logs
        WHERE user_id = $1 AND log_date = $2
        ORDER BY created_at DESC
      `,
      [userId, normalizeDate(date)],
    );
    return result.rows.map(mapFoodLog);
  }

  const result = await pool.query(
    `
      SELECT *
      FROM food_logs
      WHERE user_id = $1
      ORDER BY log_date DESC, created_at DESC
    `,
    [userId],
  );
  return result.rows.map(mapFoodLog);
}

async function deleteFoodLog(userId, foodLogId) {
  const result = await pool.query("DELETE FROM food_logs WHERE id = $1 AND user_id = $2", [foodLogId, userId]);
  return result.rowCount > 0;
}

async function getDailyTotals(userId, date) {
  const selectedDate = normalizeDate(date);
  const result = await pool.query(
    `
      SELECT
        COALESCE(SUM(calories), 0) AS calories,
        COALESCE(SUM(protein), 0) AS protein,
        COALESCE(SUM(carbs), 0) AS carbs,
        COALESCE(SUM(fat), 0) AS fat
      FROM food_logs
      WHERE user_id = $1 AND log_date = $2
    `,
    [userId, selectedDate],
  );

  const row = result.rows[0] || {};
  return {
    calories: Number(row.calories || 0),
    protein: Number(row.protein || 0),
    carbs: Number(row.carbs || 0),
    fat: Number(row.fat || 0),
  };
}

async function getDashboardSummary(userId, date) {
  const selectedDate = normalizeDate(date);
  const [user, totals, logs] = await Promise.all([
    getUserById(userId),
    getDailyTotals(userId, selectedDate),
    listFoodLogs(userId, selectedDate),
  ]);

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

async function mapMealRowsWithIngredients(mealRows) {
  if (mealRows.length === 0) {
    return [];
  }

  const mealIds = mealRows.map((meal) => meal.id);
  const ingredientsResult = await pool.query(
    `
      SELECT *
      FROM meal_ingredients
      WHERE meal_id = ANY($1::text[])
      ORDER BY name ASC
    `,
    [mealIds],
  );

  const ingredientsByMealId = new Map();

  for (const row of ingredientsResult.rows) {
    const entry = ingredientsByMealId.get(row.meal_id) || [];
    entry.push({
      id: row.id,
      name: row.name,
      quantity: Number(row.quantity),
      unit: row.unit,
      pricePerUnit: Number(row.price_per_unit),
    });
    ingredientsByMealId.set(row.meal_id, entry);
  }

  return mealRows.map((meal) => ({
    id: meal.id,
    userId: meal.user_id,
    name: meal.name,
    servings: Number(meal.servings),
    calories: Number(meal.calories),
    protein: Number(meal.protein),
    carbs: Number(meal.carbs),
    fat: Number(meal.fat),
    notes: meal.notes,
    ingredients: ingredientsByMealId.get(meal.id) || [],
    createdAt: meal.created_at instanceof Date ? meal.created_at.toISOString() : meal.created_at,
  }));
}

async function createMeal(userId, payload) {
  const id = createId();
  const ingredients = Array.isArray(payload.ingredients)
    ? payload.ingredients.map(normalizeIngredient).filter(Boolean)
    : [];

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const mealResult = await client.query(
      `
        INSERT INTO meals (
          id, user_id, name, servings, calories, protein, carbs, fat, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `,
      [
        id,
        userId,
        payload.name.trim(),
        Math.max(1, toNumber(payload.servings) || 1),
        toNumber(payload.calories),
        toNumber(payload.protein),
        toNumber(payload.carbs),
        toNumber(payload.fat),
        payload.notes?.trim() || "",
      ],
    );

    for (const ingredient of ingredients) {
      await client.query(
        `
          INSERT INTO meal_ingredients (
            id, meal_id, name, quantity, unit, price_per_unit
          )
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          ingredient.id,
          id,
          ingredient.name,
          ingredient.quantity,
          ingredient.unit,
          ingredient.pricePerUnit,
        ],
      );
    }

    await client.query("COMMIT");

    const mappedMeals = await mapMealRowsWithIngredients([mealResult.rows[0]]);
    return mappedMeals[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function listMeals(userId) {
  const mealsResult = await pool.query(
    `
      SELECT *
      FROM meals
      WHERE user_id = $1
      ORDER BY created_at DESC
    `,
    [userId],
  );

  return mapMealRowsWithIngredients(mealsResult.rows);
}

async function getMealById(userId, mealId) {
  const mealsResult = await pool.query(
    `
      SELECT *
      FROM meals
      WHERE user_id = $1 AND id = $2
      LIMIT 1
    `,
    [userId, mealId],
  );

  if (mealsResult.rows.length === 0) {
    return null;
  }

  const mappedMeals = await mapMealRowsWithIngredients(mealsResult.rows);
  return mappedMeals[0];
}

async function updateMeal(userId, mealId, payload) {
  const existingMeal = await getMealById(userId, mealId);

  if (!existingMeal) {
    return null;
  }

  const nextIngredients = Array.isArray(payload.ingredients)
    ? payload.ingredients.map(normalizeIngredient).filter(Boolean)
    : existingMeal.ingredients;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
        UPDATE meals
        SET
          name = $1,
          servings = $2,
          calories = $3,
          protein = $4,
          carbs = $5,
          fat = $6,
          notes = $7
        WHERE id = $8 AND user_id = $9
      `,
      [
        payload.name?.trim() || existingMeal.name,
        Math.max(1, toNumber(payload.servings) || existingMeal.servings),
        payload.calories === undefined ? existingMeal.calories : toNumber(payload.calories),
        payload.protein === undefined ? existingMeal.protein : toNumber(payload.protein),
        payload.carbs === undefined ? existingMeal.carbs : toNumber(payload.carbs),
        payload.fat === undefined ? existingMeal.fat : toNumber(payload.fat),
        payload.notes === undefined ? existingMeal.notes : String(payload.notes).trim(),
        mealId,
        userId,
      ],
    );

    if (Array.isArray(payload.ingredients)) {
      await client.query("DELETE FROM meal_ingredients WHERE meal_id = $1", [mealId]);

      for (const ingredient of nextIngredients) {
        await client.query(
          `
            INSERT INTO meal_ingredients (
              id, meal_id, name, quantity, unit, price_per_unit
            )
            VALUES ($1, $2, $3, $4, $5, $6)
          `,
          [
            ingredient.id,
            mealId,
            ingredient.name,
            ingredient.quantity,
            ingredient.unit,
            ingredient.pricePerUnit,
          ],
        );
      }
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return getMealById(userId, mealId);
}

async function deleteMeal(userId, mealId) {
  const result = await pool.query("DELETE FROM meals WHERE id = $1 AND user_id = $2", [mealId, userId]);
  return result.rowCount > 0;
}

function mapMealPlan(row) {
  return {
    id: row.id,
    userId: row.user_id,
    mealId: row.meal_id,
    date: row.plan_date instanceof Date ? row.plan_date.toISOString().slice(0, 10) : String(row.plan_date),
    servings: Number(row.servings),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

async function createMealPlan(userId, payload) {
  const meal = await getMealById(userId, payload.mealId);

  if (!meal) {
    return null;
  }

  const id = createId();
  const result = await pool.query(
    `
      INSERT INTO meal_plans (id, user_id, meal_id, plan_date, servings)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [id, userId, meal.id, normalizeDate(payload.date), Math.max(1, toNumber(payload.servings) || 1)],
  );

  return mapMealPlan(result.rows[0]);
}

async function listMealPlans(userId, date) {
  if (date) {
    const result = await pool.query(
      `
        SELECT *
        FROM meal_plans
        WHERE user_id = $1 AND plan_date = $2
        ORDER BY created_at DESC
      `,
      [userId, normalizeDate(date)],
    );

    return result.rows.map(mapMealPlan);
  }

  const result = await pool.query(
    `
      SELECT *
      FROM meal_plans
      WHERE user_id = $1
      ORDER BY plan_date DESC, created_at DESC
    `,
    [userId],
  );

  return result.rows.map(mapMealPlan);
}

async function deleteMealPlan(userId, mealPlanId) {
  const result = await pool.query("DELETE FROM meal_plans WHERE id = $1 AND user_id = $2", [mealPlanId, userId]);
  return result.rowCount > 0;
}

async function getGroceryList(userId, startDate, endDate) {
  const start = normalizeDate(startDate);
  const end = normalizeDate(endDate || startDate || start);

  const mealPlansResult = await pool.query(
    `
      SELECT meal_id, servings
      FROM meal_plans
      WHERE user_id = $1 AND plan_date >= $2 AND plan_date <= $3
    `,
    [userId, start, end],
  );

  const mealPlans = mealPlansResult.rows;

  if (mealPlans.length === 0) {
    return {
      startDate: start,
      endDate: end,
      items: [],
      totalCost: 0,
      mealCount: 0,
    };
  }

  const mealIds = [...new Set(mealPlans.map((plan) => plan.meal_id))];
  const ingredientsResult = await pool.query(
    `
      SELECT meal_id, name, unit, quantity, price_per_unit
      FROM meal_ingredients
      WHERE meal_id = ANY($1::text[])
    `,
    [mealIds],
  );

  const ingredientsByMealId = new Map();
  for (const row of ingredientsResult.rows) {
    const entry = ingredientsByMealId.get(row.meal_id) || [];
    entry.push({
      name: row.name,
      unit: row.unit,
      quantity: Number(row.quantity),
      pricePerUnit: Number(row.price_per_unit),
    });
    ingredientsByMealId.set(row.meal_id, entry);
  }

  const aggregated = new Map();

  for (const mealPlan of mealPlans) {
    const ingredients = ingredientsByMealId.get(mealPlan.meal_id) || [];

    for (const ingredient of ingredients) {
      const key = `${ingredient.name.toLowerCase()}::${ingredient.unit.toLowerCase()}`;
      const quantity = ingredient.quantity * Number(mealPlan.servings);
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

  const catalogResult = await pool.query(
    `
      SELECT mi.name, mi.unit, MIN(mi.price_per_unit) AS min_price_per_unit
      FROM meals m
      JOIN meal_ingredients mi ON mi.meal_id = m.id
      WHERE m.user_id = $1
      GROUP BY mi.name, mi.unit
    `,
    [userId],
  );

  const catalogRows = catalogResult.rows.map((row) => ({
    name: row.name,
    unit: row.unit,
    pricePerUnit: Number(row.min_price_per_unit),
  }));

  const itemsWithAlternatives = buildCheaperAlternatives(items, catalogRows);
  const totalCost = itemsWithAlternatives.reduce((sum, item) => sum + item.cost, 0);
  const potentialSavings = itemsWithAlternatives.reduce((sum, item) => {
    if (!item.cheaperAlternatives || item.cheaperAlternatives.length === 0) {
      return sum;
    }

    return sum + item.cheaperAlternatives[0].estimatedTotalSavings;
  }, 0);

  return {
    startDate: start,
    endDate: end,
    items: itemsWithAlternatives,
    totalCost,
    potentialSavings,
    mealCount: mealPlans.length,
  };
}

module.exports = {
  createUser,
  getUserByEmail,
  getUserById,
  updateGoals,
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
