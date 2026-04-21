function normalizeName(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeUnit(value) {
  return String(value || "unit").trim().toLowerCase();
}

function inferIngredientCategory(name) {
  const value = normalizeName(name);

  if (/chicken|beef|turkey|pork|salmon|tuna|egg|tofu|protein/.test(value)) {
    return "protein";
  }

  if (/milk|yogurt|cheese|butter/.test(value)) {
    return "dairy";
  }

  if (/rice|pasta|bread|oat|quinoa|tortilla/.test(value)) {
    return "grain";
  }

  if (/apple|banana|berry|orange|grape|melon|avocado/.test(value)) {
    return "fruit";
  }

  if (/spinach|kale|broccoli|carrot|onion|pepper|tomato|lettuce|cucumber|zucchini/.test(value)) {
    return "vegetable";
  }

  if (/oil|olive|canola|sesame|peanut|almond/.test(value)) {
    return "fat";
  }

  return "other";
}

function buildCheaperAlternatives(items, catalogRows) {
  const catalog = catalogRows.map((row) => ({
    name: String(row.name || "").trim(),
    normalizedName: normalizeName(row.name),
    unit: String(row.unit || "unit").trim(),
    normalizedUnit: normalizeUnit(row.unit),
    pricePerUnit: Number(row.pricePerUnit || 0),
    category: inferIngredientCategory(row.name),
  }));

  return items.map((item) => {
    const itemCategory = inferIngredientCategory(item.name);
    const itemNormalizedName = normalizeName(item.name);
    const itemNormalizedUnit = normalizeUnit(item.unit);
    const itemPricePerUnit = Number(item.pricePerUnit || 0);
    const itemQuantity = Number(item.quantity || 0);

    const cheaperAlternatives = catalog
      .filter((candidate) => {
        if (candidate.normalizedName === itemNormalizedName) {
          return false;
        }

        if (candidate.normalizedUnit !== itemNormalizedUnit) {
          return false;
        }

        if (candidate.category !== itemCategory) {
          return false;
        }

        return candidate.pricePerUnit < itemPricePerUnit;
      })
      .sort((first, second) => first.pricePerUnit - second.pricePerUnit)
      .slice(0, 3)
      .map((candidate) => {
        const savingsPerUnit = itemPricePerUnit - candidate.pricePerUnit;
        return {
          name: candidate.name,
          unit: candidate.unit,
          pricePerUnit: candidate.pricePerUnit,
          estimatedSavingsPerUnit: savingsPerUnit,
          estimatedTotalSavings: savingsPerUnit * itemQuantity,
        };
      });

    return {
      ...item,
      category: itemCategory,
      cheaperAlternatives,
    };
  });
}

module.exports = {
  inferIngredientCategory,
  buildCheaperAlternatives,
};