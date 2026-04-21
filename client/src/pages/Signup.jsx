import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    calorieGoal: "2200",
    proteinGoal: "140",
    carbGoal: "240",
    fatGoal: "70",
  });

  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const data = await signup(formData);
      setMessage(data.message);
      navigate("/dashboard");
    } catch (error) {
      setMessage(error.message || "Server error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page page--auth">
      <h1>Sign Up</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
          />
        </div>

        <div>
          <label>Calorie Goal</label>
          <input
            type="number"
            name="calorieGoal"
            value={formData.calorieGoal}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Protein Goal (g)</label>
          <input
            type="number"
            name="proteinGoal"
            value={formData.proteinGoal}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Carb Goal (g)</label>
          <input
            type="number"
            name="carbGoal"
            value={formData.carbGoal}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Fat Goal (g)</label>
          <input
            type="number"
            name="fatGoal"
            value={formData.fatGoal}
            onChange={handleChange}
          />
        </div>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Create Account"}
        </button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}

export default Signup;