import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import MealPlanner from "./pages/MealPlanner";
import GroceryList from "./pages/GroceryList";

function App() {
  return (
    <BrowserRouter>
      <div>
        <nav style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>
          <Link to="/">Login</Link>
          <Link to="/signup">Signup</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/planner">Meal Planner</Link>
          <Link to="/grocery-list">Grocery List</Link>
        </nav>

        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/planner" element={<MealPlanner />} />
          <Route path="/grocery-list" element={<GroceryList />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;