const request = require("supertest");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

jest.mock("./store", () => ({
  getUserById: jest.fn(),
  getUserByEmail: jest.fn(),
  createUser: jest.fn(),
  sanitizeUser: jest.fn(),
  getDashboardSummary: jest.fn(),
  updateGoals: jest.fn(),
  listFoodLogs: jest.fn(),
  createFoodLog: jest.fn(),
  deleteFoodLog: jest.fn(),
  listMeals: jest.fn(),
  createMeal: jest.fn(),
  updateMeal: jest.fn(),
  deleteMeal: jest.fn(),
  listMealPlans: jest.fn(),
  createMealPlan: jest.fn(),
  deleteMealPlan: jest.fn(),
  getGroceryList: jest.fn(),
}));

const store = require("./store");
const { app, AUTH_COOKIE_NAME } = require("./server");

const JWT_SECRET = process.env.JWT_SECRET || "dev-only-secret";

describe("API tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("POST /api/signup returns 201 and sets auth cookie", async () => {
    const user = {
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
      passwordHash: "hash",
      goals: { calories: 2200, protein: 140, carbs: 240, fat: 70 },
      createdAt: new Date().toISOString(),
    };

    store.getUserByEmail.mockResolvedValue(null);
    store.createUser.mockResolvedValue(user);
    store.sanitizeUser.mockReturnValue({
      id: user.id,
      name: user.name,
      email: user.email,
      goals: user.goals,
      createdAt: user.createdAt,
    });

    const response = await request(app).post("/api/signup").send({
      name: "Test User",
      email: "test@example.com",
      password: "secret123",
      calorieGoal: 2200,
      proteinGoal: 140,
      carbGoal: 240,
      fatGoal: 70,
    });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe("Account created");
    expect(response.headers["set-cookie"]).toBeDefined();
    expect(response.headers["set-cookie"].join(";")).toContain(AUTH_COOKIE_NAME);
    expect(store.createUser).toHaveBeenCalledTimes(1);
  });

  test("POST /api/login rejects invalid password", async () => {
    const passwordHash = await bcrypt.hash("correct-password", 10);

    store.getUserByEmail.mockResolvedValue({
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
      passwordHash,
      goals: { calories: 2200, protein: 140, carbs: 240, fat: 70 },
      createdAt: new Date().toISOString(),
    });

    const response = await request(app).post("/api/login").send({
      email: "test@example.com",
      password: "wrong-password",
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid email or password");
  });

  test("GET /api/dashboard/summary requires authentication", async () => {
    const response = await request(app).get("/api/dashboard/summary");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Authentication required");
  });

  test("GET /api/dashboard/summary returns data for authenticated user", async () => {
    const token = jwt.sign({ sub: "user-1" }, JWT_SECRET, { expiresIn: "1h" });

    store.getUserById.mockResolvedValue({
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
      passwordHash: "hash",
      goals: { calories: 2200, protein: 140, carbs: 240, fat: 70 },
      createdAt: new Date().toISOString(),
    });

    store.getDashboardSummary.mockResolvedValue({
      date: "2026-04-21",
      totals: { calories: 800, protein: 60, carbs: 90, fat: 30 },
      goals: { calories: 2200, protein: 140, carbs: 240, fat: 70 },
      remaining: { calories: 1400, protein: 80, carbs: 150, fat: 40 },
      logs: [],
    });

    const response = await request(app)
      .get("/api/dashboard/summary")
      .set("Cookie", `${AUTH_COOKIE_NAME}=${token}`);

    expect(response.status).toBe(200);
    expect(response.body.totals.calories).toBe(800);
    expect(store.getDashboardSummary).toHaveBeenCalledWith("user-1", undefined);
  });

  test("GET /api/grocery-list returns alternatives for authenticated user", async () => {
    const token = jwt.sign({ sub: "user-1" }, JWT_SECRET, { expiresIn: "1h" });

    store.getUserById.mockResolvedValue({
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
      passwordHash: "hash",
      goals: { calories: 2200, protein: 140, carbs: 240, fat: 70 },
      createdAt: new Date().toISOString(),
    });

    store.getGroceryList.mockResolvedValue({
      startDate: "2026-04-21",
      endDate: "2026-04-21",
      totalCost: 22,
      potentialSavings: 4,
      mealCount: 2,
      items: [
        {
          name: "Chicken Breast",
          unit: "g",
          quantity: 800,
          pricePerUnit: 0.02,
          cost: 16,
          category: "protein",
          cheaperAlternatives: [
            {
              name: "Tofu",
              unit: "g",
              pricePerUnit: 0.015,
              estimatedSavingsPerUnit: 0.005,
              estimatedTotalSavings: 4,
            },
          ],
        },
      ],
    });

    const response = await request(app)
      .get("/api/grocery-list?startDate=2026-04-21&endDate=2026-04-21")
      .set("Cookie", `${AUTH_COOKIE_NAME}=${token}`);

    expect(response.status).toBe(200);
    expect(response.body.potentialSavings).toBe(4);
    expect(response.body.items[0].cheaperAlternatives[0].name).toBe("Tofu");
    expect(store.getGroceryList).toHaveBeenCalledWith("user-1", "2026-04-21", "2026-04-21");
  });

  test("PUT /api/goals updates goals for authenticated user", async () => {
    const token = jwt.sign({ sub: "user-1" }, JWT_SECRET, { expiresIn: "1h" });

    store.getUserById.mockResolvedValue({
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
      passwordHash: "hash",
      goals: { calories: 2200, protein: 140, carbs: 240, fat: 70 },
      createdAt: new Date().toISOString(),
    });

    store.updateGoals.mockResolvedValue({
      id: "user-1",
      goals: { calories: 2400, protein: 160, carbs: 260, fat: 75 },
    });

    const response = await request(app)
      .put("/api/goals")
      .set("Cookie", `${AUTH_COOKIE_NAME}=${token}`)
      .send({ calories: 2400, protein: 160, carbs: 260, fat: 75 });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Goals updated");
    expect(response.body.goals.calories).toBe(2400);
    expect(store.updateGoals).toHaveBeenCalledWith("user-1", {
      calories: 2400,
      protein: 160,
      carbs: 260,
      fat: 75,
    });
  });
});
