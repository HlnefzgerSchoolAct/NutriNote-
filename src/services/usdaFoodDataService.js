/**
 * USDA FoodData Central API Service
 * Fetches validated nutrition data from the US Department of Agriculture's database.
 * API Docs: https://app.swaggerhub.com/apis/fdcnal/food-data_central_api/1.0.1
 *
 * All requests are proxied through /api/usda-search so that USDA_API_KEY
 * stays server-side and is never exposed to the browser.
 */

import devLog from "../utils/devLog";

const USDA_PROXY_URL = "/api/usda-search";
const USDA_CACHE_KEY = "nutrinoteplus_usda_cache";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Maps USDA nutrient IDs to app nutrition field names.
 * Values in USDA search results are always per 100g.
 */
const NUTRIENT_ID_MAP = {
  1008: "calories", // Energy (kcal)
  1003: "protein", // Protein (g)
  1005: "carbs", // Carbohydrate, by difference (g)
  1004: "fat", // Total lipid (fat) (g)
  1079: "fiber", // Fiber, total dietary (g)
  1093: "sodium", // Sodium (mg)
  2000: "sugar", // Sugars, total including NLEA (g)
  1253: "cholesterol", // Cholesterol (mg)
  1104: "vitaminA", // Vitamin A, RAE (mcg)
  1162: "vitaminC", // Vitamin C (mg)
  1114: "vitaminD", // Vitamin D (D2 + D3) (mcg)
  1109: "vitaminE", // Vitamin E (alpha-tocopherol) (mg)
  1185: "vitaminK", // Vitamin K (phylloquinone) (mcg)
  1165: "vitaminB1", // Thiamin (mg)
  1166: "vitaminB2", // Riboflavin (mg)
  1167: "vitaminB3", // Niacin (mg)
  1175: "vitaminB6", // Vitamin B-6 (mg)
  1178: "vitaminB12", // Vitamin B-12 (mcg)
  1177: "folate", // Folate, DFE (mcg)
  1087: "calcium", // Calcium (mg)
  1089: "iron", // Iron (mg)
  1090: "magnesium", // Magnesium (mg)
  1095: "zinc", // Zinc (mg)
  1092: "potassium", // Potassium (mg)
};

/**
 * Preferred data source order — Foundation/SR Legacy have more complete
 * micronutrient data than Branded or Survey foods.
 */
const DATA_TYPE_PRIORITY = {
  Foundation: 1,
  "SR Legacy": 2,
  "Survey (FNDDS)": 3,
  Branded: 4,
};

// ─── Cache helpers ────────────────────────────────────────────────────────────

function getUSDACache() {
  try {
    const raw = localStorage.getItem(USDA_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveUSDACache(cache) {
  try {
    localStorage.setItem(USDA_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    devLog.warn("Failed to save USDA cache:", e);
  }
}

function getCachedUSDA(key) {
  const cache = getUSDACache();
  const entry = cache[key];
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  return null;
}

function setCachedUSDA(key, data) {
  const cache = getUSDACache();
  cache[key] = { data, timestamp: Date.now() };
  saveUSDACache(cache);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Search USDA FoodData Central for a food by query string.
 * Prefers Foundation → SR Legacy → Survey → Branded data types.
 *
 * @param {string} query - Search query in USDA naming format
 * @param {string} [preferBranded=false] - Set true for packaged/branded foods
 * @returns {Promise<Array|null>} Sorted list of matching USDA foods, or null on error
 */
export async function searchUSDAFood(query, preferBranded = false) {
  const cacheKey = `search:${query.toLowerCase().trim()}`;
  const cached = getCachedUSDA(cacheKey);
  if (cached) {
    devLog.log("📦 USDA cache hit:", query);
    return cached;
  }

  // Preferred ordering: non-branded first unless it's clearly a branded product
  const dataTypes = preferBranded
    ? ["Branded", "Foundation", "SR Legacy", "Survey (FNDDS)"]
    : ["Foundation", "SR Legacy", "Survey (FNDDS)", "Branded"];

  try {
    devLog.log("🔍 Searching USDA for:", query);
    const response = await fetch(USDA_PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: query.trim(), dataTypes, pageSize: 10 }),
    });

    if (!response.ok) {
      devLog.error("USDA proxy error:", response.status);
      return null;
    }

    const data = await response.json();
    const foods = (data.foods || []).sort((a, b) => {
      const pa = DATA_TYPE_PRIORITY[a.dataType] ?? 99;
      const pb = DATA_TYPE_PRIORITY[b.dataType] ?? 99;
      return pa - pb;
    });

    devLog.log(`✅ USDA returned ${foods.length} results for "${query}"`);
    setCachedUSDA(cacheKey, foods);
    return foods;
  } catch (error) {
    devLog.error("USDA search error:", error);
    return null;
  }
}

/**
 * Convert USDA food nutrients into the app's nutrition object format.
 * USDA search results provide nutrient values per 100g, so we scale by
 * (servingSizeGrams / 100).
 *
 * @param {Object} usdaFood  - USDA food result from search or detail endpoint
 * @param {number} servingSizeGrams - Actual serving weight in grams (from AI parsing)
 * @returns {Object} Nutrition object compatible with app's food entry format
 */
export function mapUSDANutrients(usdaFood, servingSizeGrams) {
  const scale = servingSizeGrams / 100;

  // Build empty result with USDA provenance metadata
  const nutrition = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: null,
    sodium: null,
    sugar: null,
    cholesterol: null,
    vitaminA: null,
    vitaminC: null,
    vitaminD: null,
    vitaminE: null,
    vitaminK: null,
    vitaminB1: null,
    vitaminB2: null,
    vitaminB3: null,
    vitaminB6: null,
    vitaminB12: null,
    folate: null,
    calcium: null,
    iron: null,
    magnesium: null,
    zinc: null,
    potassium: null,
    // Provenance
    fdcId: usdaFood.fdcId,
    usdaDescription: usdaFood.description,
    dataType: usdaFood.dataType,
    source: "usda",
  };

  // Works for both search results ({ nutrientId, value }) and
  // detail results ({ nutrient: { id }, amount })
  for (const n of usdaFood.foodNutrients || []) {
    const id = n.nutrientId ?? n.nutrient?.id;
    const rawValue = n.value ?? n.amount;
    const field = NUTRIENT_ID_MAP[id];

    if (!field || rawValue == null || rawValue < 0) continue;

    const scaled = rawValue * scale;

    // Round integers or mg-scale nutrients without decimal precision
    const integerFields = new Set([
      "calories",
      "sodium",
      "cholesterol",
      "vitaminA",
      "calcium",
      "magnesium",
      "potassium",
      "folate",
    ]);

    if (field === "calories") {
      nutrition[field] = Math.round(scaled);
    } else if (integerFields.has(field)) {
      nutrition[field] = Math.round(scaled);
    } else {
      nutrition[field] = Math.round(scaled * 10) / 10;
    }
  }

  return nutrition;
}

/**
 * Clear the USDA cache (useful for testing or data management).
 */
export function clearUSDACache() {
  try {
    localStorage.removeItem(USDA_CACHE_KEY);
    devLog.log("🗑️ USDA cache cleared");
  } catch (e) {
    devLog.warn("Failed to clear USDA cache:", e);
  }
}
