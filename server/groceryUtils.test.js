const { buildCheaperAlternatives, inferIngredientCategory } = require("./groceryUtils");

describe("groceryUtils", () => {
  test("inferIngredientCategory detects major ingredient groups", () => {
    expect(inferIngredientCategory("Chicken Breast")).toBe("protein");
    expect(inferIngredientCategory("Brown Rice")).toBe("grain");
    expect(inferIngredientCategory("Greek Yogurt")).toBe("dairy");
    expect(inferIngredientCategory("Spinach")).toBe("vegetable");
  });

  test("buildCheaperAlternatives returns lower-priced same-category options", () => {
    const items = [
      {
        name: "Chicken Breast",
        unit: "g",
        quantity: 800,
        pricePerUnit: 0.02,
        cost: 16,
      },
      {
        name: "Brown Rice",
        unit: "g",
        quantity: 500,
        pricePerUnit: 0.008,
        cost: 4,
      },
    ];

    const catalogRows = [
      { name: "Ground Turkey", unit: "g", pricePerUnit: 0.015 },
      { name: "Tofu", unit: "g", pricePerUnit: 0.012 },
      { name: "Salmon", unit: "g", pricePerUnit: 0.03 },
      { name: "White Rice", unit: "g", pricePerUnit: 0.005 },
      { name: "Pasta", unit: "g", pricePerUnit: 0.007 },
      { name: "Cheddar", unit: "g", pricePerUnit: 0.01 },
    ];

    const withAlternatives = buildCheaperAlternatives(items, catalogRows);

    expect(withAlternatives[0].cheaperAlternatives).toHaveLength(2);
    expect(withAlternatives[0].cheaperAlternatives[0].name).toBe("Tofu");
    expect(withAlternatives[0].cheaperAlternatives[1].name).toBe("Ground Turkey");
    expect(withAlternatives[0].cheaperAlternatives[0].estimatedTotalSavings).toBeCloseTo(6.4);

    expect(withAlternatives[1].cheaperAlternatives).toHaveLength(2);
    expect(withAlternatives[1].cheaperAlternatives[0].name).toBe("White Rice");
  });
});
