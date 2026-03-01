// Vercel Serverless Function for AI Food Photo Identification
// Enhanced: Multi-food detection (20+), per-food USDA candidates (top 5),
// ingredient-level decomposition, and realism validation with single retry
//
// Flow:
// 1. Receive base64 JPEG image from client
// 2. Send to Gemini vision to identify foods + estimate servings + detect complex dishes
// 3. For complex dishes: AI decomposition into constituent ingredients
// 4. Look up each food/ingredient in USDA FoodData Central (top 5 candidates)
// 5. Fall back to AI text estimation if USDA has no match
// 6. Validate realism of all nutrition data; retry once if unrealistic
// 7. Return validated results or explicit error

import {
  validateNutritionRealism,
  buildCorrectionPrompt,
} from "./nutrition-realism.js";
import {
  validateFoodDetectionWithMultipleModels,
  isMultiModelEnabled,
} from "./multi-model-validation.js";
import {
  runOutlierDetection,
  detectMealOutliers,
  isOutlierDetectionEnabled,
} from "./micronutrient-outlier-detection.js";

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 20;

function checkRateLimit(ip) {
  const now = Date.now();
  const userLimit = rateLimitMap.get(ip);

  if (!userLimit || now - userLimit.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { windowStart: now, count: 1 });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }

  if (userLimit.count >= RATE_LIMIT_MAX) {
    const retryAfter = Math.ceil(
      (userLimit.windowStart + RATE_LIMIT_WINDOW - now) / 1000,
    );
    return { allowed: false, remaining: 0, retryAfter };
  }

  userLimit.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - userLimit.count };
}

// USDA FoodData Central nutrient ID -> app field mapping
const USDA_NUTRIENT_MAP = {
  1008: "calories",
  1003: "protein",
  1005: "carbs",
  1004: "fat",
  1079: "fiber",
  1093: "sodium",
  2000: "sugar",
  1253: "cholesterol",
  1106: "vitaminA",
  1162: "vitaminC",
  1114: "vitaminD",
  1109: "vitaminE",
  1185: "vitaminK",
  1165: "vitaminB1",
  1166: "vitaminB2",
  1167: "vitaminB3",
  1175: "vitaminB6",
  1178: "vitaminB12",
  1177: "folate",
  1087: "calcium",
  1089: "iron",
  1090: "magnesium",
  1095: "zinc",
  1092: "potassium",
};

const parseNum = (val, decimals = 1) => {
  if (val === null || val === undefined || isNaN(val)) return null;
  const num = parseFloat(val);
  if (isNaN(num) || num < 0) return null;
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

function parseUsdaNutrients(foodNutrients, servingGrams) {
  const scale = servingGrams / 100;
  const nutrition = {};
  for (const nutrient of foodNutrients) {
    const id = nutrient.nutrientId || nutrient.nutrientNumber;
    const field = USDA_NUTRIENT_MAP[id];
    if (field && nutrient.value != null) {
      nutrition[field] = nutrient.value * scale;
    }
  }
  return {
    calories: Math.round(nutrition.calories || 0),
    protein: parseNum(nutrition.protein) || 0,
    carbs: parseNum(nutrition.carbs) || 0,
    fat: parseNum(nutrition.fat) || 0,
    fiber: parseNum(nutrition.fiber),
    sodium: parseNum(nutrition.sodium, 0),
    sugar: parseNum(nutrition.sugar),
    cholesterol: parseNum(nutrition.cholesterol, 0),
    vitaminA: parseNum(nutrition.vitaminA, 0),
    vitaminC: parseNum(nutrition.vitaminC),
    vitaminD: parseNum(nutrition.vitaminD),
    vitaminE: parseNum(nutrition.vitaminE, 2),
    vitaminK: parseNum(nutrition.vitaminK),
    vitaminB1: parseNum(nutrition.vitaminB1, 2),
    vitaminB2: parseNum(nutrition.vitaminB2, 2),
    vitaminB3: parseNum(nutrition.vitaminB3),
    vitaminB6: parseNum(nutrition.vitaminB6, 2),
    vitaminB12: parseNum(nutrition.vitaminB12, 2),
    folate: parseNum(nutrition.folate, 0),
    calcium: parseNum(nutrition.calcium, 0),
    iron: parseNum(nutrition.iron, 2),
    magnesium: parseNum(nutrition.magnesium, 0),
    zinc: parseNum(nutrition.zinc, 2),
    potassium: parseNum(nutrition.potassium, 0),
  };
}

/**
 * Search USDA FoodData Central — returns up to `limit` results
 */
async function searchUSDA(foodName, apiKey, limit = 5) {
  const url = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
  url.searchParams.set("query", foodName);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("pageSize", String(limit));
  url.searchParams.set("dataType", "SR Legacy,Foundation");

  const response = await fetch(url.toString(), {
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    console.error(
      "[USDA] Search failed (" + response.status + ") for: " + foodName,
    );
    return [];
  }

  const data = await response.json();
  if (!data.foods || data.foods.length === 0) {
    console.log("[USDA] No results for: " + foodName);
    return [];
  }

  return data.foods.slice(0, limit);
}

function parseServingToGrams(servingStr) {
  const str = servingStr.toLowerCase().trim();
  const match = str.match(/^([\d.]+)\s*(.*)$/);
  if (!match) return 150;
  const amount = parseFloat(match[1]);
  const unit = match[2].trim();
  const conversions = {
    g: 1,
    gram: 1,
    grams: 1,
    oz: 28.35,
    ounce: 28.35,
    ounces: 28.35,
    cup: 240,
    cups: 240,
    tbsp: 15,
    tablespoon: 15,
    tablespoons: 15,
    tsp: 5,
    teaspoon: 5,
    teaspoons: 5,
    lb: 453.6,
    pound: 453.6,
    pounds: 453.6,
    kg: 1000,
    kilogram: 1000,
    kilograms: 1000,
    ml: 1,
    milliliter: 1,
    milliliters: 1,
    l: 1000,
    liter: 1000,
    liters: 1000,
    slice: 30,
    slices: 30,
    piece: 100,
    pieces: 100,
    serving: 150,
    servings: 150,
    medium: 150,
    large: 200,
    small: 100,
  };
  const factor = conversions[unit] || 150;
  return Math.round(amount * factor);
}

/**
 * AI text-based nutrition estimation with full micronutrients
 */
async function fallbackAIEstimation(foodDescription, apiKey, refererUrl) {
  const systemPrompt =
    "You are a nutrition expert. When given a food description, provide comprehensive nutritional information.\nAlways respond with a valid JSON object containing:\n- calories (total kcal), protein (grams), carbs (grams), fat (grams)\n- fiber (grams), sodium (milligrams), sugar (grams), cholesterol (milligrams)\n- vitaminA (mcg RAE), vitaminC (mg), vitaminD (mcg), vitaminE (mg), vitaminK (mcg)\n- vitaminB1 (mg), vitaminB2 (mg), vitaminB3 (mg), vitaminB6 (mg), vitaminB12 (mcg)\n- folate (mcg DFE), calcium (mg), iron (mg), magnesium (mg), zinc (mg), potassium (mg)\nUse realistic USDA estimates. Use null for nutrients you cannot estimate. Format as JSON only.";

  const response = await fetch(
    "https://ai.hackclub.com/proxy/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
        "HTTP-Referer": refererUrl,
        "X-Title": "NutriNote+",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content:
              "Nutritional content of: " + foodDescription + "? JSON format.",
          },
        ],
        temperature: 0.2,
        max_tokens: 500,
      }),
    },
  );

  if (!response.ok) return null;

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) return null;

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      calories: Math.round(parsed.calories || 0),
      protein: parseNum(parsed.protein) || 0,
      carbs: parseNum(parsed.carbs || parsed.carbohydrates) || 0,
      fat: parseNum(parsed.fat) || 0,
      fiber: parseNum(parsed.fiber),
      sodium: parseNum(parsed.sodium, 0),
      sugar: parseNum(parsed.sugar),
      cholesterol: parseNum(parsed.cholesterol, 0),
      vitaminA: parseNum(parsed.vitaminA, 0),
      vitaminC: parseNum(parsed.vitaminC),
      vitaminD: parseNum(parsed.vitaminD),
      vitaminE: parseNum(parsed.vitaminE, 2),
      vitaminK: parseNum(parsed.vitaminK),
      vitaminB1: parseNum(parsed.vitaminB1, 2),
      vitaminB2: parseNum(parsed.vitaminB2, 2),
      vitaminB3: parseNum(parsed.vitaminB3),
      vitaminB6: parseNum(parsed.vitaminB6, 2),
      vitaminB12: parseNum(parsed.vitaminB12, 2),
      folate: parseNum(parsed.folate, 0),
      calcium: parseNum(parsed.calcium, 0),
      iron: parseNum(parsed.iron, 2),
      magnesium: parseNum(parsed.magnesium, 0),
      zinc: parseNum(parsed.zinc, 2),
      potassium: parseNum(parsed.potassium, 0),
    };
  } catch {
    return null;
  }
}

/**
 * AI retry with correction prompt for unrealistic nutrition
 */
async function retryAIEstimation(
  foodDescription,
  previousNutrition,
  issues,
  apiKey,
  refererUrl,
) {
  const correctionPrompt = buildCorrectionPrompt(
    foodDescription,
    previousNutrition,
    issues,
  );

  const systemPrompt =
    "You are a nutrition expert. Provide CORRECTED comprehensive nutritional information.\nRespond with a valid JSON object containing:\n- calories (total kcal), protein (grams), carbs (grams), fat (grams)\n- fiber (grams), sodium (milligrams), sugar (grams), cholesterol (milligrams)\n- vitaminA (mcg RAE), vitaminC (mg), vitaminD (mcg), vitaminE (mg), vitaminK (mcg)\n- vitaminB1 (mg), vitaminB2 (mg), vitaminB3 (mg), vitaminB6 (mg), vitaminB12 (mcg)\n- folate (mcg DFE), calcium (mg), iron (mg), magnesium (mg), zinc (mg), potassium (mg)\nEnsure calories ≈ protein*4 + carbs*4 + fat*9. All values must be within normal food ranges. JSON only.";

  try {
    const response = await fetch(
      "https://ai.hackclub.com/proxy/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + apiKey,
          "Content-Type": "application/json",
          "HTTP-Referer": refererUrl,
          "X-Title": "NutriNote+",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: correctionPrompt },
          ],
          temperature: 0.1,
          max_tokens: 500,
        }),
      },
    );

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      calories: Math.round(parsed.calories || 0),
      protein: parseNum(parsed.protein) || 0,
      carbs: parseNum(parsed.carbs || parsed.carbohydrates) || 0,
      fat: parseNum(parsed.fat) || 0,
      fiber: parseNum(parsed.fiber),
      sodium: parseNum(parsed.sodium, 0),
      sugar: parseNum(parsed.sugar),
      cholesterol: parseNum(parsed.cholesterol, 0),
      vitaminA: parseNum(parsed.vitaminA, 0),
      vitaminC: parseNum(parsed.vitaminC),
      vitaminD: parseNum(parsed.vitaminD),
      vitaminE: parseNum(parsed.vitaminE, 2),
      vitaminK: parseNum(parsed.vitaminK),
      vitaminB1: parseNum(parsed.vitaminB1, 2),
      vitaminB2: parseNum(parsed.vitaminB2, 2),
      vitaminB3: parseNum(parsed.vitaminB3),
      vitaminB6: parseNum(parsed.vitaminB6, 2),
      vitaminB12: parseNum(parsed.vitaminB12, 2),
      folate: parseNum(parsed.folate, 0),
      calcium: parseNum(parsed.calcium, 0),
      iron: parseNum(parsed.iron, 2),
      magnesium: parseNum(parsed.magnesium, 0),
      zinc: parseNum(parsed.zinc, 2),
      potassium: parseNum(parsed.potassium, 0),
    };
  } catch {
    return null;
  }
}

/**
 * Decompose a complex/mixed dish into constituent ingredients via AI
 */
async function decomposeComplexDish(
  foodName,
  estimatedServing,
  apiKey,
  refererUrl,
) {
  const systemPrompt =
    'You are a food decomposition expert. Given a dish/meal name and serving size, break it down into its individual ingredient components with estimated quantities.\n\nRespond ONLY with a valid JSON object:\n{"isComplex": true/false, "ingredients": [{"name": "ingredient name (USDA-searchable)", "estimatedServing": "amount unit"}, ...]}\n\nSet isComplex to false if this is already a simple, single ingredient (e.g., "apple", "chicken breast", "white rice").\nSet isComplex to true for mixed dishes (e.g., "pasta carbonara", "chicken stir fry", "Caesar salad").\n\nFor complex dishes, list 2-8 main ingredients with realistic quantities that add up to the total serving.\nUse common USDA-searchable names for each ingredient.';

  try {
    const response = await fetch(
      "https://ai.hackclub.com/proxy/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + apiKey,
          "Content-Type": "application/json",
          "HTTP-Referer": refererUrl,
          "X-Title": "NutriNote+",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: "Decompose: " + estimatedServing + " of " + foodName,
            },
          ],
          temperature: 0.2,
          max_tokens: 600,
        }),
      },
    );

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    if (
      !parsed.isComplex ||
      !Array.isArray(parsed.ingredients) ||
      parsed.ingredients.length === 0
    ) {
      return null; // Not complex or no ingredients — treat as simple food
    }

    return parsed.ingredients.slice(0, 8);
  } catch {
    return null;
  }
}

/**
 * Build USDA candidates array for a food item
 */
async function getUsdaCandidates(foodName, servingGrams, usdaKey) {
  if (!usdaKey) return [];

  try {
    const usdaResults = await searchUSDA(foodName, usdaKey, 5);
    return usdaResults
      .map(function (result, index) {
        if (!result.foodNutrients) return null;
        const nutrition = parseUsdaNutrients(
          result.foodNutrients,
          servingGrams,
        );
        if (nutrition.calories <= 0) return null;
        return {
          fdcId: result.fdcId,
          description: result.description,
          dataType: result.dataType,
          nutrition: nutrition,
          rank: index + 1,
        };
      })
      .filter(Boolean);
  } catch (err) {
    console.error(
      '[USDA] Candidate search error for "' + foodName + '":',
      err.message,
    );
    return [];
  }
}

/**
 * Process a single food item: get USDA candidates, validate, retry if needed
 */
async function processFoodItem(food, usdaKey, openrouterKey, refererUrl) {
  const servingGrams = parseServingToGrams(
    food.estimatedServing || "1 serving",
  );
  const foodId =
    food.name.toLowerCase().replace(/[^a-z0-9]+/g, "_") +
    "_" +
    Date.now() +
    "_" +
    Math.random().toString(36).slice(2, 6);

  // Step A: Get USDA candidates (top 5)
  const candidates = await getUsdaCandidates(food.name, servingGrams, usdaKey);

  // Step B: Pick best nutrition — prefer top USDA candidate
  let nutrition = null;
  let source = "failed";
  let usdaFoodName = null;
  let selectedCandidate = null;

  if (candidates.length > 0) {
    // Use top USDA candidate as primary
    selectedCandidate = candidates[0];
    nutrition = selectedCandidate.nutrition;
    source = "usda";
    usdaFoodName = selectedCandidate.description;
  }

  // Step C: Fall back to AI estimation if no USDA match
  if (!nutrition) {
    try {
      const fallbackDesc = food.estimatedServing + " of " + food.name;
      nutrition = await fallbackAIEstimation(
        fallbackDesc,
        openrouterKey,
        refererUrl,
      );
      if (nutrition) source = "ai_estimate";
    } catch (err) {
      console.error(
        '[AI Fallback] Error for "' + food.name + '":',
        err.message,
      );
    }
  }

  if (!nutrition) {
    return {
      id: foodId,
      name: food.name,
      serving: food.estimatedServing,
      nutrition: null,
      source: "failed",
      candidates: candidates,
      ingredients: null,
      realismValidation: {
        valid: false,
        issues: ["No nutrition data available"],
      },
    };
  }

  // Step D: Realism validation
  let validation = validateNutritionRealism(nutrition, food.name);

  if (!validation.valid) {
    console.log(
      '[REALISM] Failed for "' +
        food.name +
        '": ' +
        validation.issues.join("; "),
    );

    // One retry with corrected prompt
    const foodDesc = food.estimatedServing + " of " + food.name;
    const retryNutrition = await retryAIEstimation(
      foodDesc,
      nutrition,
      validation.issues,
      openrouterKey,
      refererUrl,
    );

    if (retryNutrition) {
      const retryValidation = validateNutritionRealism(
        retryNutrition,
        food.name,
      );
      if (retryValidation.valid) {
        console.log('[REALISM] Retry succeeded for "' + food.name + '"');
        nutrition = retryNutrition;
        validation = retryValidation;
        source = "ai_estimate_corrected";
      } else {
        console.warn(
          '[REALISM] Retry also failed for "' +
            food.name +
            '": ' +
            retryValidation.issues.join("; "),
        );
        // Keep the original — mark as validation_failed
        validation = retryValidation;
      }
    }
  }

  // Step E: Outlier detection & auto-correction
  let outlierDetection = null;
  if (nutrition && isOutlierDetectionEnabled()) {
    outlierDetection = runOutlierDetection(nutrition, food.name);
    if (outlierDetection.totalCorrected > 0) {
      console.log(
        "[OUTLIER] Auto-corrected " +
          outlierDetection.totalCorrected +
          ' nutrients for "' +
          food.name +
          '"',
      );
      // Apply corrected nutrition
      nutrition = outlierDetection.correctedNutrition;
    }
  }

  return {
    id: foodId,
    name: food.name,
    serving: food.estimatedServing,
    nutrition: nutrition,
    source: source,
    usdaFoodName: usdaFoodName,
    candidates: candidates,
    ingredients: null, // Will be filled by decomposition step
    realismValidation: validation,
    outlierDetection: outlierDetection,
    multiModelValidation: food.multiModelValidation || null,
  };
}

/**
 * Process ingredients for a complex dish
 */
async function processIngredients(
  ingredients,
  usdaKey,
  openrouterKey,
  refererUrl,
) {
  const results = await Promise.all(
    ingredients.map(async function (ing) {
      const servingGrams = parseServingToGrams(
        ing.estimatedServing || "1 serving",
      );
      const candidates = await getUsdaCandidates(
        ing.name,
        servingGrams,
        usdaKey,
      );

      let nutrition = null;
      let source = "failed";

      if (candidates.length > 0) {
        nutrition = candidates[0].nutrition;
        source = "usda";
      } else {
        try {
          const desc = ing.estimatedServing + " of " + ing.name;
          nutrition = await fallbackAIEstimation(
            desc,
            openrouterKey,
            refererUrl,
          );
          if (nutrition) source = "ai_estimate";
        } catch {
          // silently fail, ingredient will be marked as failed
        }
      }

      // Validate ingredient nutrition
      if (nutrition) {
        const validation = validateNutritionRealism(nutrition, ing.name);
        if (!validation.valid) {
          console.warn(
            '[REALISM] Ingredient "' +
              ing.name +
              '" failed validation: ' +
              validation.issues.join("; "),
          );
        }
      }

      return {
        name: ing.name,
        serving: ing.estimatedServing,
        nutrition: nutrition,
        source: source,
        candidates: candidates,
      };
    }),
  );

  return results.filter(function (r) {
    return r.nutrition !== null;
  });
}

/**
 * Aggregate nutrition from multiple ingredients into a total
 */
function aggregateIngredientNutrition(ingredients) {
  const total = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sodium: 0,
    sugar: 0,
    cholesterol: 0,
    vitaminA: 0,
    vitaminC: 0,
    vitaminD: 0,
    vitaminE: 0,
    vitaminK: 0,
    vitaminB1: 0,
    vitaminB2: 0,
    vitaminB3: 0,
    vitaminB6: 0,
    vitaminB12: 0,
    folate: 0,
    calcium: 0,
    iron: 0,
    magnesium: 0,
    zinc: 0,
    potassium: 0,
  };

  for (const ing of ingredients) {
    if (!ing.nutrition) continue;
    for (const key of Object.keys(total)) {
      const val = ing.nutrition[key];
      if (val != null && !isNaN(val)) {
        total[key] += val;
      }
    }
  }

  // Round the totals
  total.calories = Math.round(total.calories);
  total.protein = parseNum(total.protein) || 0;
  total.carbs = parseNum(total.carbs) || 0;
  total.fat = parseNum(total.fat) || 0;
  total.fiber = parseNum(total.fiber);
  total.sodium = parseNum(total.sodium, 0);
  total.sugar = parseNum(total.sugar);
  total.cholesterol = parseNum(total.cholesterol, 0);
  total.vitaminA = parseNum(total.vitaminA, 0);
  total.vitaminC = parseNum(total.vitaminC);
  total.vitaminD = parseNum(total.vitaminD);
  total.vitaminE = parseNum(total.vitaminE, 2);
  total.vitaminK = parseNum(total.vitaminK);
  total.vitaminB1 = parseNum(total.vitaminB1, 2);
  total.vitaminB2 = parseNum(total.vitaminB2, 2);
  total.vitaminB3 = parseNum(total.vitaminB3);
  total.vitaminB6 = parseNum(total.vitaminB6, 2);
  total.vitaminB12 = parseNum(total.vitaminB12, 2);
  total.folate = parseNum(total.folate, 0);
  total.calcium = parseNum(total.calcium, 0);
  total.iron = parseNum(total.iron, 2);
  total.magnesium = parseNum(total.magnesium, 0);
  total.zinc = parseNum(total.zinc, 2);
  total.potassium = parseNum(total.potassium, 0);

  return total;
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" });
  }

  const startTime = Date.now();
  const clientIP = req.headers["x-forwarded-for"]?.split(",")[0] || "unknown";

  // Rate limiting
  const rateCheck = checkRateLimit(clientIP);
  res.setHeader("X-RateLimit-Remaining", rateCheck.remaining);

  if (!rateCheck.allowed) {
    return res.status(429).json({
      error: "Too many requests. Please try again in a few minutes.",
      code: "RATE_LIMITED",
      retryAfter: rateCheck.retryAfter,
    });
  }

  try {
    const { image } = req.body;

    if (!image || typeof image !== "string") {
      return res.status(400).json({
        error: "Image data is required (base64 JPEG)",
        code: "MISSING_INPUT",
      });
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    if (base64Data.length > 4 * 1024 * 1024) {
      return res.status(400).json({
        error: "Image too large (max 3MB)",
        code: "IMAGE_TOO_LARGE",
      });
    }

    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const usdaKey = process.env.USDA_API_KEY;

    if (!openrouterKey) {
      console.error("[ERROR] Missing OPENROUTER_API_KEY");
      return res.status(500).json({
        error: "Server configuration error",
        code: "SERVER_CONFIG_ERROR",
      });
    }

    if (!usdaKey) {
      console.warn(
        "[WARN] Missing USDA_API_KEY - will use AI estimation for nutrition data",
      );
    }

    const refererUrl = process.env.VERCEL_URL
      ? "https://" + process.env.VERCEL_URL
      : "https://nutrinoteplus.vercel.app";

    // ──────────────────────────────────────
    // Step 1: Vision AI — identify all foods in the photo (up to 25)
    // Multi-model: optionally cross-check with Gemini + Claude
    // ──────────────────────────────────────
    let identified;
    let multiModelInfo = null;

    if (isMultiModelEnabled()) {
      // Multi-model path: send to both Gemini and Claude in parallel
      console.log(
        "[INFO] Multi-model validation enabled, using dual detection",
      );
      const multiResult = await validateFoodDetectionWithMultipleModels(
        base64Data,
        openrouterKey,
        refererUrl,
      );

      if (multiResult.foods && multiResult.foods.length > 0) {
        identified = { foods: multiResult.foods };
        multiModelInfo = multiResult.models;
        console.log(
          "[MULTI-MODEL] Detection complete: " +
            multiResult.foods.length +
            " foods, " +
            (multiResult.models?.agreed || 0) +
            " agreed by both models",
        );
      } else {
        // Multi-model returned no results, fall through to single-model
        console.warn(
          "[MULTI-MODEL] No results from multi-model, falling back to Gemini-only",
        );
        identified = null;
      }
    }

    // Single-model path (default, or fallback if multi-model returned nothing)
    if (!identified) {
      const visionPrompt =
        'You are a food identification expert. Analyze this food photo and identify EVERY distinct food item visible.\n\nFor each food item, provide:\n- "name": A clear, common food name suitable for searching a nutrition database (e.g., "grilled chicken breast", "white rice", "steamed broccoli", "pasta carbonara")\n- "estimatedServing": The estimated serving size with a unit (e.g., "6 oz", "1 cup", "150g", "2 slices")\n- "isComplex": true if this is a mixed/composite dish with multiple ingredients (e.g., salad, stir fry, pasta dish, sandwich), false if it\'s a simple single food\n\nRespond ONLY with a valid JSON object:\n{"foods": [{"name": "food name", "estimatedServing": "amount unit", "isComplex": false}, ...]}\n\nIf no food is visible in the image, respond with: {"foods": [], "error": "No food detected in image"}\nBe specific with food names. Identify ALL distinct items — up to 25 foods.';

      const controller = new AbortController();
      const timeout = setTimeout(function () {
        controller.abort();
      }, 25000);

      const visionResponse = await fetch(
        "https://ai.hackclub.com/proxy/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + openrouterKey,
            "Content-Type": "application/json",
            "HTTP-Referer": refererUrl,
            "X-Title": "NutriNote+",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: visionPrompt },
                  {
                    type: "image_url",
                    image_url: { url: "data:image/jpeg;base64," + base64Data },
                  },
                ],
              },
            ],
            temperature: 0.2,
            max_tokens: 1500,
          }),
          signal: controller.signal,
        },
      );

      clearTimeout(timeout);

      if (!visionResponse.ok) {
        let errorData;
        try {
          errorData = await visionResponse.json();
        } catch {
          errorData = {};
        }
        console.error(
          "[ERROR] Vision API " + visionResponse.status + ":",
          errorData,
        );

        const status = visionResponse.status;
        if (status === 429)
          return res.status(429).json({
            error: "AI service rate limited. Please wait.",
            code: "API_RATE_LIMITED",
          });
        if (status === 401)
          return res
            .status(401)
            .json({ error: "Authentication failed", code: "AUTH_ERROR" });
        return res
          .status(502)
          .json({ error: "AI vision service error", code: "VISION_ERROR" });
      }

      const visionData = await visionResponse.json();
      const visionContent = visionData.choices?.[0]?.message?.content;

      if (!visionContent) {
        return res
          .status(502)
          .json({
            error: "AI returned empty response",
            code: "EMPTY_RESPONSE",
          });
      }

      const jsonMatch = visionContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return res.status(502).json({
          error: "Could not parse food identification",
          code: "PARSE_ERROR",
        });
      }

      try {
        identified = JSON.parse(jsonMatch[0]);
      } catch {
        return res.status(502).json({
          error: "Invalid food identification format",
          code: "PARSE_ERROR",
        });
      }
    } // end single-model fallback

    if (
      !identified.foods ||
      !Array.isArray(identified.foods) ||
      identified.foods.length === 0
    ) {
      return res.status(200).json({
        foods: [],
        message:
          identified.error ||
          "No food detected in the image. Try taking a clearer photo.",
        responseTime: Date.now() - startTime,
      });
    }

    // Allow up to 25 foods
    const foodsToProcess = identified.foods.slice(0, 25);

    // ──────────────────────────────────────
    // Step 2: Process each food — USDA candidates + nutrition + decomposition
    // ──────────────────────────────────────
    const results = await Promise.all(
      foodsToProcess.map(async function (food) {
        const result = await processFoodItem(
          food,
          usdaKey,
          openrouterKey,
          refererUrl,
        );

        // Step 3: Ingredient decomposition for complex dishes
        if (food.isComplex) {
          try {
            const ingredients = await decomposeComplexDish(
              food.name,
              food.estimatedServing,
              openrouterKey,
              refererUrl,
            );
            if (ingredients && ingredients.length > 0) {
              const processedIngredients = await processIngredients(
                ingredients,
                usdaKey,
                openrouterKey,
                refererUrl,
              );
              if (processedIngredients.length > 0) {
                result.ingredients = processedIngredients;
                // Aggregate ingredient nutrition as an alternative total
                result.ingredientNutrition =
                  aggregateIngredientNutrition(processedIngredients);

                // Validate the aggregated ingredient nutrition too
                const ingValidation = validateNutritionRealism(
                  result.ingredientNutrition,
                  food.name + " (ingredients)",
                );
                result.ingredientValidation = ingValidation;
              }
            }
          } catch (err) {
            console.error(
              '[DECOMPOSE] Error for "' + food.name + '":',
              err.message,
            );
            // Non-fatal: keep the whole-food nutrition
          }
        }

        return result;
      }),
    );

    // Separate valid and failed results
    const validResults = results.filter(function (r) {
      return r.nutrition !== null;
    });
    const failedResults = results.filter(function (r) {
      return r.nutrition === null;
    });

    // Check if ALL items failed realism after retry
    const allFailedRealism =
      validResults.length > 0 &&
      validResults.every(function (r) {
        return !r.realismValidation.valid;
      });

    if (allFailedRealism) {
      const duration = Date.now() - startTime;
      console.error(
        "[REALISM] All " +
          validResults.length +
          " foods failed validation after retry",
      );
      return res.status(422).json({
        error:
          "Nutrition values appear unrealistic for all detected foods. Please retake the photo with better lighting or angle.",
        code: "REALISM_VALIDATION_FAILED",
        foods: validResults, // Include results so client can show what was detected
        totalIdentified: identified.foods.length,
        responseTime: duration,
      });
    }

    const duration = Date.now() - startTime;
    console.log(
      "[INFO] Photo identified " +
        validResults.length +
        " foods (" +
        validResults.filter(function (r) {
          return r.ingredients;
        }).length +
        " decomposed) in " +
        duration +
        "ms",
    );

    // Step 4: Meal-level outlier detection (aggregate check)
    let mealOutlierDetection = null;
    if (isOutlierDetectionEnabled() && validResults.length > 0) {
      mealOutlierDetection = detectMealOutliers(validResults);
      if (mealOutlierDetection.hasAggregateOutliers) {
        console.log(
          "[OUTLIER] Meal-level: " +
            mealOutlierDetection.flaggedTotals.length +
            " nutrients flagged",
        );
      }
    }

    return res.status(200).json({
      foods: validResults,
      failedFoods: failedResults.length > 0 ? failedResults : undefined,
      totalIdentified: identified.foods.length,
      responseTime: duration,
      multiModelInfo: multiModelInfo || undefined,
      mealOutlierDetection: mealOutlierDetection || undefined,
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    if (error.name === "AbortError") {
      return res
        .status(504)
        .json({ error: "Request timed out", code: "TIMEOUT" });
    }

    console.error("[ERROR] " + error.message + " after " + duration + "ms");
    return res.status(500).json({
      error: "An unexpected error occurred",
      code: "UNEXPECTED_ERROR",
    });
  }
}
