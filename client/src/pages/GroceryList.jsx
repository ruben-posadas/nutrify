import { useEffect, useState } from "react";
import { getGroceryList } from "../services/api";

function GroceryList() {
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [groceryList, setGroceryList] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadList(nextStartDate, nextEndDate) {
    setIsLoading(true);
    setError("");

    try {
      const data = await getGroceryList(nextStartDate, nextEndDate);
      setGroceryList(data);
    } catch (requestError) {
      setError(requestError.message || "Unable to load grocery list");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadList(startDate, endDate);
  }, []);

  async function handleRefresh(event) {
    event.preventDefault();
    await loadList(startDate, endDate);
  }

  return (
    <section className="page">
      <header className="page__header">
        <h1>Grocery List</h1>
      </header>

      <form className="range-form" onSubmit={handleRefresh}>
        <label>
          Start
          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </label>
        <label>
          End
          <input
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </label>
        <button type="submit">Refresh</button>
      </form>

      {error && <p className="message message--error">{error}</p>}
      {isLoading && <p>Loading grocery list...</p>}

      {groceryList && !isLoading && (
        <section className="panel">
          <h2>Estimated total: ${groceryList.totalCost.toFixed(2)}</h2>
          <p>
            {groceryList.mealCount} planned meal entries from {groceryList.startDate} to {groceryList.endDate}
          </p>

          {groceryList.items.length === 0 ? (
            <p>No ingredients found for this date range.</p>
          ) : (
            <ul className="list">
              {groceryList.items.map((item) => (
                <li key={`${item.name}-${item.unit}`}>
                  <div>
                    <strong>{item.name}</strong>
                    <p>
                      {item.quantity} {item.unit} • ${item.cost.toFixed(2)}
                    </p>
                  </div>
                  <span>${item.pricePerUnit.toFixed(2)}/{item.unit}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </section>
  );
}

export default GroceryList;