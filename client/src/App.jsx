import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import MealPlanner from "./pages/MealPlanner";
import GroceryList from "./pages/GroceryList";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

function AppNav() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <nav className="app-nav">
      <div className="app-nav__brand">Nutrify</div>
      <div className="app-nav__links">
        {!isAuthenticated && <Link to="/">Login</Link>}
        {!isAuthenticated && <Link to="/signup">Signup</Link>}
        {isAuthenticated && <Link to="/dashboard">Dashboard</Link>}
        {isAuthenticated && <Link to="/planner">Meal Planner</Link>}
        {isAuthenticated && <Link to="/grocery-list">Grocery List</Link>}
      </div>
      <div className="app-nav__user">
        {isAuthenticated ? (
          <>
            <span>{user?.name}</span>
            <button type="button" onClick={logout}>Logout</button>
          </>
        ) : (
          <span>Guest</span>
        )}
      </div>
    </nav>
  );
}

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter>
      <div className="app-shell">
        <AppNav />

        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route path="/signup" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Signup />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/planner"
            element={
              <ProtectedRoute>
                <MealPlanner />
              </ProtectedRoute>
            }
          />
          <Route
            path="/grocery-list"
            element={
              <ProtectedRoute>
                <GroceryList />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;