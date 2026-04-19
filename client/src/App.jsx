import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import MealPlanner from "./pages/MealPlanner";
import GroceryList from "./pages/GroceryList";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/planner" element={<MealPlanner />} />
        <Route path="/grocery-list" element={<GroceryList />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;