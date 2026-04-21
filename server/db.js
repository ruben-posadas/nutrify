const { Pool } = require("pg");

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://localhost:5432/nutrify";

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      calorie_goal NUMERIC NOT NULL DEFAULT 0,
      protein_goal NUMERIC NOT NULL DEFAULT 0,
      carb_goal NUMERIC NOT NULL DEFAULT 0,
      fat_goal NUMERIC NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS meals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      servings NUMERIC NOT NULL DEFAULT 1,
      calories NUMERIC NOT NULL DEFAULT 0,
      protein NUMERIC NOT NULL DEFAULT 0,
      carbs NUMERIC NOT NULL DEFAULT 0,
      fat NUMERIC NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS meal_ingredients (
      id TEXT PRIMARY KEY,
      meal_id TEXT NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      quantity NUMERIC NOT NULL DEFAULT 0,
      unit TEXT NOT NULL DEFAULT 'unit',
      price_per_unit NUMERIC NOT NULL DEFAULT 0
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS food_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      meal_type TEXT NOT NULL DEFAULT 'Meal',
      log_date DATE NOT NULL,
      calories NUMERIC NOT NULL DEFAULT 0,
      protein NUMERIC NOT NULL DEFAULT 0,
      carbs NUMERIC NOT NULL DEFAULT 0,
      fat NUMERIC NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS meal_plans (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      meal_id TEXT NOT NULL REFERENCES meals(id) ON DELETE CASCADE,
      plan_date DATE NOT NULL,
      servings NUMERIC NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(
    "CREATE INDEX IF NOT EXISTS idx_food_logs_user_date ON food_logs(user_id, log_date)",
  );
  await pool.query(
    "CREATE INDEX IF NOT EXISTS idx_meal_plans_user_date ON meal_plans(user_id, plan_date)",
  );
}

module.exports = {
  pool,
  initDb,
};