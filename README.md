# nutrify
A full-stack web application that helps users track nutrition, plan meals, and generate cost-efficient grocery lists.

## Features

- User authentication
- Calorie and macro tracking
- Meal planning
- Grocery list generation
- Cost estimation for meals
- Daily dashboard summaries

## Current MVP Status

- Frontend: implemented auth flow, protected routes, dashboard logging, meal planner, and grocery list views.
- Backend: implemented secure auth and CRUD-style APIs with PostgreSQL persistence.
- Database: auto-initializes schema at server startup.

## Tech Stack

- Frontend: React
- Backend: Node.js + Express
- Database: PostgreSQL

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

Copy [server/.env.example](server/.env.example) to a new [server/.env](server/.env) file and update values as needed.

Required variables:

- `PORT` (default: `5001`)
- `CLIENT_URL` (default: `http://localhost:5173`)
- `JWT_SECRET`
- `DATABASE_URL` (default local example: `postgresql://localhost:5432/nutrify`)

### 4. Run the app

```bash
# terminal 1
cd server
npm run dev

# terminal 2
cd client
npm run dev
```

Frontend runs on `http://localhost:5173` and API on `http://localhost:5001`.

## Testing

Backend automated tests are available with Jest + Supertest.

```bash
cd server
npm test
```

## API Areas

- `POST /api/signup`, `POST /api/login`, `POST /api/logout`, `GET /api/me`
- `GET /api/dashboard/summary`
- `GET|POST|DELETE /api/food-logs`
- `GET|POST|PUT|DELETE /api/meals`
- `GET|POST|DELETE /api/meal-plans`
- `GET /api/grocery-list`

## Status

🚧 In development (MVP)

## 💡 Inspiration

Inspired by apps like MyFitnessPal, with a focus on affordability and simplicity.
