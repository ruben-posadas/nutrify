const API_BASE_URL = "http://localhost:5001/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export async function signup(payload) {
  return request("/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function login(payload) {
  return request("/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function logout() {
  return request("/logout", { method: "POST" });
}

export async function getCurrentUser() {
  return request("/me");
}

export async function getDashboardSummary(date) {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  return request(`/dashboard/summary${query}`);
}

export async function updateGoals(payload) {
  return request("/goals", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function createFoodLog(payload) {
  return request("/food-logs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteFoodLog(id) {
  return request(`/food-logs/${id}`, { method: "DELETE" });
}

export async function getMeals() {
  return request("/meals");
}

export async function createMeal(payload) {
  return request("/meals", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteMeal(id) {
  return request(`/meals/${id}`, { method: "DELETE" });
}

export async function getMealPlans(date) {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  return request(`/meal-plans${query}`);
}

export async function createMealPlan(payload) {
  return request("/meal-plans", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteMealPlan(id) {
  return request(`/meal-plans/${id}`, { method: "DELETE" });
}

export async function getGroceryList(startDate, endDate) {
  const params = new URLSearchParams();

  if (startDate) {
    params.append("startDate", startDate);
  }

  if (endDate) {
    params.append("endDate", endDate);
  }

  const query = params.toString() ? `?${params.toString()}` : "";
  return request(`/grocery-list${query}`);
}
