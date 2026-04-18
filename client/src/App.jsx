import { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    fetch("http://localhost:5001/api/health")
      .then((res) => res.json())
      .then((data) => setMessage(data.status))
      .catch((err) => {
        console.error(err);
        setMessage("Backend not connected");
      });
  }, []);

  return (
    <div>
      <h1>Nutrify</h1>
      <p>Frontend is working</p>
      <p>Backend status: {message}</p>
    </div>
  );
}

export default App;