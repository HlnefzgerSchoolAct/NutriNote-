// Vercel Serverless Function for AI Nutrition Estimation
// Uses Hack Club's AI proxy with in-memory rate limiting
//
// NOTE: In-memory rate limiting has limitations in serverless environments:
// - Each function instance has its own memory, so rate limits aren't shared across instances
// - Cold starts reset the rate limit map
// - For production, consider using external storage (Vercel KV, Upstash Redis)
// - Current implementation provides per-instance rate limiting which still helps prevent abuse

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 30; // 30 requests per window

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
    const { foodDescription } = req.body;

    // Input validation
    if (!foodDescription || typeof foodDescription !== "string") {
      return res.status(400).json({
        error: "Food description is required",
        code: "MISSING_INPUT",
      });
    }

    const trimmedDescription = foodDescription.trim();
    if (trimmedDescription.length === 0) {
      return res.status(400).json({
        error: "Food description cannot be empty",
        code: "EMPTY_INPUT",
      });
    }

    if (trimmedDescription.length > 200) {
      return res.status(400).json({
        error: "Food description too long (max 200 characters)",
        code: "INPUT_TOO_LONG",
      });
    }

    // Get API key from environment
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error("[ERROR] Missing OPENROUTER_API_KEY");
      return res.status(500).json({
        error: "Server configuration error",
        code: "SERVER_CONFIG_ERROR",
      });
    }

    // Use Hack Club's AI proxy
    const apiUrl = "https://ai.hackclub.com/proxy/v1/chat/completions";

    const systemPrompt = `You are a nutrition expert. When given a food description, provide comprehensive nutritional information.
Always respond with a valid JSON object containing:
- calories (total kcal)
- protein (grams)
- carbs (grams)
- fat (grams)
- fiber (grams)
- sodium (milligrams)
- sugar (grams, total sugars)
- cholesterol (milligrams)
- vitaminA (micrograms RAE)
- vitaminC (milligrams)
- vitaminD (micrograms)
- vitaminE (milligrams)
- vitaminK (micrograms)
- vitaminB1 (milligrams, thiamin)
- vitaminB2 (milligrams, riboflavin)
- vitaminB3 (milligrams, niacin)
- vitaminB6 (milligrams)
- vitaminB12 (micrograms)
- folate (micrograms DFE)
- calcium (milligrams)
- iron (milligrams)
- magnesium (milligrams)
- zinc (milligrams)
- potassium (milligrams)

Use realistic USDA estimates. Use null for nutrients you cannot estimate. Format as JSON only.
Example: {"calories": 95, "protein": 0.5, "carbs": 25, "fat": 0.3, "fiber": 4.4, "sodium": 2, "sugar": 19, "cholesterol": 0, "vitaminA": 3, "vitaminC": 8.4, "vitaminD": 0, "vitaminE": 0.18, "vitaminK": 2.2, "vitaminB1": 0.02, "vitaminB2": 0.03, "vitaminB3": 0.09, "vitaminB6": 0.04, "vitaminB12": 0, "folate": 3, "calcium": 6, "iron": 0.12, "magnesium": 5, "zinc": 0.04, "potassium": 107}`;

    const userMessage = `What is the complete nutritional content of: ${trimmedDescription}? Provide all macronutrients and micronutrients in JSON format.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000); // 25s for Vercel

    // Use VERCEL_URL for dynamic domain, fallback for local dev
    const refererUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://nutrinoteplus.vercel.app";

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": refererUrl,
        "X-Title": "NutriNote+",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.2,
        max_tokens: 500,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }

      const errorMessages = {
        401: { error: "Authentication failed", code: "AUTH_ERROR" },
        403: { error: "Access forbidden", code: "FORBIDDEN" },
        429: {
          error: "AI service rate limited. Please wait.",
          code: "API_RATE_LIMITED",
        },
        500: { error: "AI service temporarily unavailable", code: "API_ERROR" },
        502: { error: "AI service is down", code: "API_UNAVAILABLE" },
        503: { error: "AI service is overloaded", code: "API_OVERLOADED" },
      };

      const errorInfo = errorMessages[response.status] || {
        error: errorData.error?.message || `API error (${response.status})`,
        code: "API_ERROR",
      };

      return res
        .status(response.status >= 500 ? 502 : response.status)
        .json(errorInfo);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(502).json({
        error: "AI returned empty response",
        code: "EMPTY_RESPONSE",
      });
    }

    // Parse nutrition from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(502).json({
        error: "Could not parse nutrition data",
        code: "PARSE_ERROR",
      });
    }

    let nutrition;
    try {
      const parsed = JSON.parse(jsonMatch[0]);

      // Helper to parse numeric value, returning null if not valid
      const parseNum = (val, decimals = 1) => {
        if (val === null || val === undefined || isNaN(val)) return null;
        const num = parseFloat(val);
        if (isNaN(num) || num < 0) return null;
        return (
          Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals)
        );
      };

      nutrition = {
        // Macronutrients (required)
        calories: Math.round(parsed.calories || parsed.cal || 0),
        protein: parseNum(parsed.protein) || 0,
        carbs: parseNum(parsed.carbs || parsed.carbohydrates) || 0,
        fat: parseNum(parsed.fat) || 0,
        // Micronutrients (optional, can be null)
        fiber: parseNum(parsed.fiber),
        sodium: parseNum(parsed.sodium, 0),
        sugar: parseNum(parsed.sugar || parsed.sugars),
        cholesterol: parseNum(parsed.cholesterol, 0),
        vitaminA: parseNum(parsed.vitaminA || parsed.vitamin_a, 0),
        vitaminC: parseNum(parsed.vitaminC || parsed.vitamin_c),
        vitaminD: parseNum(parsed.vitaminD || parsed.vitamin_d),
        vitaminE: parseNum(parsed.vitaminE || parsed.vitamin_e, 2),
        vitaminK: parseNum(parsed.vitaminK || parsed.vitamin_k),
        vitaminB1: parseNum(
          parsed.vitaminB1 || parsed.vitamin_b1 || parsed.thiamin,
          2,
        ),
        vitaminB2: parseNum(
          parsed.vitaminB2 || parsed.vitamin_b2 || parsed.riboflavin,
          2,
        ),
        vitaminB3: parseNum(
          parsed.vitaminB3 || parsed.vitamin_b3 || parsed.niacin,
        ),
        vitaminB6: parseNum(parsed.vitaminB6 || parsed.vitamin_b6, 2),
        vitaminB12: parseNum(parsed.vitaminB12 || parsed.vitamin_b12, 2),
        folate: parseNum(parsed.folate, 0),
        calcium: parseNum(parsed.calcium, 0),
        iron: parseNum(parsed.iron, 2),
        magnesium: parseNum(parsed.magnesium, 0),
        zinc: parseNum(parsed.zinc, 2),
        potassium: parseNum(parsed.potassium, 0),
      };
    } catch {
      return res.status(502).json({
        error: "Invalid nutrition data format",
        code: "PARSE_ERROR",
      });
    }

    if (
      nutrition.calories < 0 ||
      nutrition.protein < 0 ||
      nutrition.carbs < 0 ||
      nutrition.fat < 0
    ) {
      return res.status(502).json({
        error: "Invalid nutrition values",
        code: "INVALID_VALUES",
      });
    }

    const duration = Date.now() - startTime;

    return res.status(200).json({
      nutrition,
      cached: false,
      responseTime: duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    if (error.name === "AbortError") {
      return res.status(504).json({
        error: "Request timed out",
        code: "TIMEOUT",
      });
    }

    console.error(`[ERROR] ${error.message} after ${duration}ms`);
    return res.status(500).json({
      error: "An unexpected error occurred",
      code: "UNEXPECTED_ERROR",
    });
  }
}
