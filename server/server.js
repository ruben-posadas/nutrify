const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const store = require("./store");

const app = express();
const PORT = process.env.PORT || 5001;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const JWT_SECRET = process.env.JWT_SECRET || "dev-only-secret";
const AUTH_COOKIE_NAME = "nutrify_token";

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

function setAuthCookie(res, userId) {
  const token = jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "7d" });

  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
  });
}

function getCurrentUser(req) {
  const token = req.cookies[AUTH_COOKIE_NAME];

  if (!token) {
    return null;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return store.getUserById(payload.sub);
  } catch (error) {
    return null;
  }
}

function requireAuth(req, res, next) {
  const user = getCurrentUser(req);

  if (!user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  req.user = user;
  return next();
}

app.get("/", (req, res) => {
  res.send("API is running");
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "nutrify-api" });
});

app.post("/api/signup", async (req, res) => {
  const { name, email, password, calorieGoal, proteinGoal, carbGoal, fatGoal } = req.body;
  const normalizedName = String(name || "").trim();
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!normalizedName || !normalizedEmail || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const existingUser = store.getUserByEmail(normalizedEmail);

  if (existingUser) {
    return res.status(409).json({ message: "An account with that email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = store.createUser({
    name: normalizedName,
    email: normalizedEmail,
    passwordHash,
    calorieGoal,
    proteinGoal,
    carbGoal,
    fatGoal,
  });

  setAuthCookie(res, user.id);

  return res.status(201).json({
    message: "Account created",
    user: store.sanitizeUser(user),
  });
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!normalizedEmail || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = store.getUserByEmail(normalizedEmail);

  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  setAuthCookie(res, user.id);

  return res.status(200).json({
    message: "Login successful",
    user: store.sanitizeUser(user),
  });
});

app.post("/api/logout", (req, res) => {
  clearAuthCookie(res);
  return res.json({ message: "Logged out" });
});

app.get("/api/me", (req, res) => {
  const user = getCurrentUser(req);

  if (!user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  return res.json({ user: store.sanitizeUser(user) });
});

app.get("/api/dashboard/summary", requireAuth, (req, res) => {
  return res.json(store.getDashboardSummary(req.user.id, req.query.date));
});

app.get("/api/food-logs", requireAuth, (req, res) => {
  return res.json({ foodLogs: store.listFoodLogs(req.user.id, req.query.date) });
});

app.post("/api/food-logs", requireAuth, (req, res) => {
  const { name, mealType, date, calories, protein, carbs, fat } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Food name is required" });
  }

  const foodLog = store.createFoodLog(req.user.id, {
    name,
    mealType,
    date,
    calories,
    protein,
    carbs,
    fat,
  });

  return res.status(201).json({ message: "Food log created", foodLog });
});

app.delete("/api/food-logs/:id", requireAuth, (req, res) => {
  const deleted = store.deleteFoodLog(req.user.id, req.params.id);

  if (!deleted) {
    return res.status(404).json({ message: "Food log not found" });
  }

  return res.json({ message: "Food log deleted" });
});

app.get("/api/meals", requireAuth, (req, res) => {
  return res.json({ meals: store.listMeals(req.user.id) });
});

app.post("/api/meals", requireAuth, (req, res) => {
  const { name, servings, calories, protein, carbs, fat, notes, ingredients } = req.body;

  if (!name) {
    return res.status(400).json({ message: "Meal name is required" });
  }

  const meal = store.createMeal(req.user.id, {
    name,
    servings,
    calories,
    protein,
    carbs,
    fat,
    notes,
    ingredients,
  });

  return res.status(201).json({ message: "Meal created", meal });
});

app.put("/api/meals/:id", requireAuth, (req, res) => {
  const meal = store.updateMeal(req.user.id, req.params.id, req.body);

  if (!meal) {
    return res.status(404).json({ message: "Meal not found" });
  }

  return res.json({ message: "Meal updated", meal });
});

app.delete("/api/meals/:id", requireAuth, (req, res) => {
  const deleted = store.deleteMeal(req.user.id, req.params.id);

  if (!deleted) {
    return res.status(404).json({ message: "Meal not found" });
  }

  return res.json({ message: "Meal deleted" });
});

app.get("/api/meal-plans", requireAuth, (req, res) => {
  return res.json({ mealPlans: store.listMealPlans(req.user.id, req.query.date) });
});

app.post("/api/meal-plans", requireAuth, (req, res) => {
  const { mealId, date, servings } = req.body;

  if (!mealId) {
    return res.status(400).json({ message: "Meal id is required" });
  }

  const mealPlan = store.createMealPlan(req.user.id, { mealId, date, servings });

  if (!mealPlan) {
    return res.status(404).json({ message: "Meal not found" });
  }

  return res.status(201).json({ message: "Meal plan created", mealPlan });
});

app.delete("/api/meal-plans/:id", requireAuth, (req, res) => {
  const deleted = store.deleteMealPlan(req.user.id, req.params.id);

  if (!deleted) {
    return res.status(404).json({ message: "Meal plan not found" });
  }

  return res.json({ message: "Meal plan deleted" });
});

app.get("/api/grocery-list", requireAuth, (req, res) => {
  return res.json(store.getGroceryList(req.user.id, req.query.startDate, req.query.endDate));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});