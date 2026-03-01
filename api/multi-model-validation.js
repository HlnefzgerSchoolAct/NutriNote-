/**
 * Multi-Model AI Validation for Food Detection
 *
 * Cross-checks food identification using multiple AI models (Gemini + Claude)
 * to improve accuracy and confidence in food detection results.
 *
 * Strategy:
 * 1. Send image to both Gemini 2.5 Flash and Claude 3.5 Sonnet in parallel
 * 2. Compare detected foods across models using fuzzy name matching
 * 3. Merge results with per-food confidence scores based on model agreement
 * 4. Foods detected by both models get high confidence; single-model detections get lower confidence
 *
 * Graceful degradation: if Claude fails/times out, falls back to Gemini-only results.
 */

// Feature flag: set via environment variable
const MULTI_MODEL_ENABLED =
  process.env.MULTI_MODEL_VALIDATION_ENABLED === "true";

const CLAUDE_TIMEOUT_MS = 20000; // 20s timeout for Claude (shorter than Gemini)
const GEMINI_TIMEOUT_MS = 25000; // 25s timeout for Gemini

/**
 * Shared vision prompt for consistent food detection across models
 */
const FOOD_DETECTION_PROMPT =
  'You are a food identification expert. Analyze this food photo and identify EVERY distinct food item visible.\n\nFor each food item, provide:\n- "name": A clear, common food name suitable for searching a nutrition database (e.g., "grilled chicken breast", "white rice", "steamed broccoli", "pasta carbonara")\n- "estimatedServing": The estimated serving size with a unit (e.g., "6 oz", "1 cup", "150g", "2 slices")\n- "isComplex": true if this is a mixed/composite dish with multiple ingredients (e.g., salad, stir fry, pasta dish, sandwich), false if it\'s a simple single food\n\nRespond ONLY with a valid JSON object:\n{"foods": [{"name": "food name", "estimatedServing": "amount unit", "isComplex": false}, ...]}\n\nIf no food is visible in the image, respond with: {"foods": [], "error": "No food detected in image"}\nBe specific with food names. Identify ALL distinct items — up to 25 foods.';

/**
 * Call a single AI model for food detection
 * @param {string} model - Model identifier (e.g., "google/gemini-2.5-flash", "anthropic/claude-3.5-sonnet")
 * @param {string} base64Data - Raw base64 image data (no data URI prefix)
 * @param {string} apiKey - OpenRouter API key
 * @param {string} refererUrl - Referer URL for the request
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {Promise<{foods: Array, model: string, error?: string}>}
 */
async function callModelForDetection(
  model,
  base64Data,
  apiKey,
  refererUrl,
  timeoutMs,
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

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
          model: model,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: FOOD_DETECTION_PROMPT },
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

    if (!response.ok) {
      const status = response.status;
      console.error("[MULTI-MODEL] " + model + " returned " + status);
      return { foods: [], model, error: "HTTP " + status };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return { foods: [], model, error: "Empty response" };
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { foods: [], model, error: "No JSON in response" };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed.foods || !Array.isArray(parsed.foods)) {
      return { foods: [], model, error: parsed.error || "No foods array" };
    }

    return { foods: parsed.foods.slice(0, 25), model };
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      console.warn(
        "[MULTI-MODEL] " + model + " timed out after " + timeoutMs + "ms",
      );
      return { foods: [], model, error: "Timeout" };
    }
    console.error("[MULTI-MODEL] " + model + " error:", err.message);
    return { foods: [], model, error: err.message };
  }
}

/**
 * Normalize a food name for fuzzy matching.
 * Strips common adjectives, lowercases, and trims.
 */
function normalizeFoodName(name) {
  return name
    .toLowerCase()
    .replace(
      /\b(grilled|fried|baked|steamed|roasted|fresh|raw|cooked|boiled|sauteed|pan-fried|scrambled|poached|dried|frozen|canned|whole|sliced|diced|chopped|minced|mashed|large|small|medium)\b/g,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calculate similarity between two food names (0-1 score).
 * Uses token overlap (Jaccard similarity) on normalized names.
 */
function foodNameSimilarity(nameA, nameB) {
  const tokensA = new Set(normalizeFoodName(nameA).split(" ").filter(Boolean));
  const tokensB = new Set(normalizeFoodName(nameB).split(" ").filter(Boolean));

  if (tokensA.size === 0 && tokensB.size === 0) return 1;
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) intersection++;
  }

  const union = new Set([...tokensA, ...tokensB]).size;
  return intersection / union;
}

/**
 * Merge food detection results from multiple models.
 *
 * Matching logic:
 * - Foods from different models are matched if name similarity >= 0.5
 * - Matched foods get merged with high confidence (0.85-0.95)
 * - Unmatched foods from Gemini (primary) get medium confidence (0.6)
 * - Unmatched foods from Claude (secondary) get lower confidence (0.5)
 *
 * @param {Array} geminiResult - Foods from Gemini
 * @param {Array} claudeResult - Foods from Claude
 * @returns {Array} Merged foods with confidence scores and model agreement metadata
 */
function mergeFoodDetections(geminiResult, claudeResult) {
  const MATCH_THRESHOLD = 0.5;
  const merged = [];
  const claudeMatched = new Set();

  for (const gFood of geminiResult) {
    let bestMatch = null;
    let bestScore = 0;

    for (let i = 0; i < claudeResult.length; i++) {
      if (claudeMatched.has(i)) continue;
      const score = foodNameSimilarity(gFood.name, claudeResult[i].name);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = i;
      }
    }

    if (bestMatch !== null && bestScore >= MATCH_THRESHOLD) {
      // Both models agree on this food
      claudeMatched.add(bestMatch);
      const cFood = claudeResult[bestMatch];

      merged.push({
        // Prefer Gemini name (primary model), but note agreement
        name: gFood.name,
        estimatedServing: gFood.estimatedServing,
        isComplex: gFood.isComplex || cFood.isComplex,
        multiModelValidation: {
          confidence: 0.85 + bestScore * 0.1, // 0.85-0.95 based on name match quality
          agreedModels: ["gemini", "claude"],
          geminiName: gFood.name,
          claudeName: cFood.name,
          geminiServing: gFood.estimatedServing,
          claudeServing: cFood.estimatedServing,
          nameSimilarity: Math.round(bestScore * 100) / 100,
        },
      });
    } else {
      // Only Gemini detected this food
      merged.push({
        name: gFood.name,
        estimatedServing: gFood.estimatedServing,
        isComplex: gFood.isComplex,
        multiModelValidation: {
          confidence: 0.6,
          agreedModels: ["gemini"],
          geminiName: gFood.name,
          nameSimilarity: 0,
        },
      });
    }
  }

  // Add Claude-only detections (unmatched)
  for (let i = 0; i < claudeResult.length; i++) {
    if (claudeMatched.has(i)) continue;
    merged.push({
      name: claudeResult[i].name,
      estimatedServing: claudeResult[i].estimatedServing,
      isComplex: claudeResult[i].isComplex,
      multiModelValidation: {
        confidence: 0.5,
        agreedModels: ["claude"],
        claudeName: claudeResult[i].name,
        nameSimilarity: 0,
      },
    });
  }

  // Sort by confidence (highest first)
  merged.sort(
    (a, b) =>
      b.multiModelValidation.confidence - a.multiModelValidation.confidence,
  );

  return merged;
}

/**
 * Validate food detection using multiple AI models.
 *
 * Sends the image to both Gemini and Claude in parallel, then merges
 * the results with confidence scores based on model agreement.
 *
 * @param {string} base64Data - Raw base64 image data
 * @param {string} apiKey - OpenRouter API key
 * @param {string} refererUrl - Referer URL
 * @returns {Promise<{foods: Array, models: Object, multiModelUsed: boolean}>}
 */
async function validateFoodDetectionWithMultipleModels(
  base64Data,
  apiKey,
  refererUrl,
) {
  if (!MULTI_MODEL_ENABLED) {
    return { foods: null, models: null, multiModelUsed: false };
  }

  console.log("[MULTI-MODEL] Starting dual-model food detection...");
  const startTime = Date.now();

  // Run both models in parallel
  const [geminiResult, claudeResult] = await Promise.all([
    callModelForDetection(
      "google/gemini-2.5-flash",
      base64Data,
      apiKey,
      refererUrl,
      GEMINI_TIMEOUT_MS,
    ),
    callModelForDetection(
      "anthropic/claude-3.5-sonnet",
      base64Data,
      apiKey,
      refererUrl,
      CLAUDE_TIMEOUT_MS,
    ),
  ]);

  const duration = Date.now() - startTime;
  console.log(
    "[MULTI-MODEL] Dual detection completed in " +
      duration +
      "ms — Gemini: " +
      geminiResult.foods.length +
      " foods, Claude: " +
      claudeResult.foods.length +
      " foods",
  );

  // If Claude failed, fall back to Gemini-only (no multi-model merge)
  if (claudeResult.error || claudeResult.foods.length === 0) {
    console.warn(
      "[MULTI-MODEL] Claude unavailable (" +
        (claudeResult.error || "no foods") +
        "), falling back to Gemini-only",
    );

    // Still return Gemini foods but mark as single-model
    const foods = geminiResult.foods.map((f) => ({
      ...f,
      multiModelValidation: {
        confidence: 0.7, // Single model = moderate confidence
        agreedModels: ["gemini"],
        claudeError: claudeResult.error,
        geminiName: f.name,
        nameSimilarity: 0,
      },
    }));

    return {
      foods,
      models: {
        gemini: {
          success: !geminiResult.error,
          foodCount: geminiResult.foods.length,
        },
        claude: { success: false, error: claudeResult.error },
        duration,
      },
      multiModelUsed: false,
    };
  }

  // If Gemini also failed — unusual, but handle gracefully
  if (geminiResult.error || geminiResult.foods.length === 0) {
    console.warn("[MULTI-MODEL] Gemini failed, using Claude-only results");

    const foods = claudeResult.foods.map((f) => ({
      ...f,
      multiModelValidation: {
        confidence: 0.6,
        agreedModels: ["claude"],
        claudeName: f.name,
        nameSimilarity: 0,
      },
    }));

    return {
      foods,
      models: {
        gemini: { success: false, error: geminiResult.error },
        claude: {
          success: true,
          foodCount: claudeResult.foods.length,
        },
        duration,
      },
      multiModelUsed: false,
    };
  }

  // Both models returned results — merge them
  const mergedFoods = mergeFoodDetections(
    geminiResult.foods,
    claudeResult.foods,
  );

  const agreedCount = mergedFoods.filter(
    (f) => f.multiModelValidation.agreedModels.length === 2,
  ).length;

  console.log(
    "[MULTI-MODEL] Merged: " +
      mergedFoods.length +
      " total foods, " +
      agreedCount +
      " agreed by both models",
  );

  return {
    foods: mergedFoods,
    models: {
      gemini: {
        success: true,
        foodCount: geminiResult.foods.length,
      },
      claude: {
        success: true,
        foodCount: claudeResult.foods.length,
      },
      agreed: agreedCount,
      duration,
    },
    multiModelUsed: true,
  };
}

/**
 * Check if multi-model validation is enabled
 */
function isMultiModelEnabled() {
  return MULTI_MODEL_ENABLED;
}

// Export for both ESM and CJS
export {
  validateFoodDetectionWithMultipleModels,
  mergeFoodDetections,
  foodNameSimilarity,
  normalizeFoodName,
  isMultiModelEnabled,
  FOOD_DETECTION_PROMPT,
};

export default {
  validateFoodDetectionWithMultipleModels,
  mergeFoodDetections,
  foodNameSimilarity,
  normalizeFoodName,
  isMultiModelEnabled,
  FOOD_DETECTION_PROMPT,
};
