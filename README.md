# nutrify

Nutrify is a meal planning and nutrition tracking application focused on making healthy eating more affordable and practical.

It helps people plan meals, track daily nutrition, and make cost-aware grocery decisions with cheaper ingredient alternatives.

## Implemented Features

- Email/password authentication with session cookies.
- Protected frontend routes with session bootstrap on refresh.
- Daily nutrition dashboard:
	- food log create and delete
	- calorie/protein/carbs/fat totals
	- editable daily macro goals
- Weekly dashboard analytics:
	- 7-day per-day trend
	- average daily macros
	- logged-day count
	- goal-hit count and adherence score
- Meal library CRUD with ingredient and pricing support.
- Meal plan scheduling by date.
- Grocery list generation by date range with:
	- aggregated ingredient totals
	- cost estimate
	- cheaper alternatives and potential savings

## Mission

Support healthier food decisions without increasing grocery costs by combining nutrition tracking with affordability insights.



## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: PostgreSQL
- Testing: Jest + Supertest (backend)

## Project Structure

- [client](client): React app and pages
- [server](server): Express API, PostgreSQL access layer, tests

## Local Setup

### 1. Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 2. Install and start PostgreSQL (macOS)

```bash
brew install postgresql@16
brew services start postgresql@16
createdb nutrify
```

### 3. Configure backend environment

Create [server/.env](server/.env) from [server/.env.example](server/.env.example).

Required values:

- PORT (default: 5001)
- CLIENT_URL (default: http://localhost:5173)
- JWT_SECRET
- DATABASE_URL (default local example: postgresql://localhost:5432/nutrify)

### 4. Run the app

```bash
# terminal 1
cd server
npm run dev

# terminal 2
cd client
npm run dev
```

App URLs:

- Frontend: http://localhost:5173
- API: http://localhost:5001

## Available Scripts

Server:

- npm run dev
- npm start
- npm test

Client:

- npm run dev
- npm run build
- npm run preview

## API Overview

Auth:

- POST /api/signup
- POST /api/login
- POST /api/logout
- GET /api/me

Dashboard:

- GET /api/dashboard/summary
- GET /api/dashboard/weekly-summary
- PUT /api/goals

Food logs:

- GET /api/food-logs
- POST /api/food-logs
- DELETE /api/food-logs/:id

Meals:

- GET /api/meals
- POST /api/meals
- PUT /api/meals/:id
- DELETE /api/meals/:id

Meal plans:

- GET /api/meal-plans
- POST /api/meal-plans
- DELETE /api/meal-plans/:id

Grocery:

- GET /api/grocery-list

## Testing

Run backend tests:

```bash
cd server
npm test
```

## Notes

- The server initializes required PostgreSQL tables/indexes at startup.
- Auth is cookie-based (HttpOnly token), so frontend requests use credentials include.

