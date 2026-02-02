// Vercel Serverless Function for AI Nutrition Estimation
// Uses Hack Club's AI proxy with in-memory rate limiting

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

    const systemPrompt = `You are a nutrition expert. When given a food description, provide the nutritional information for that food. 
Always respond with a valid JSON object containing: calories (total kcal), protein (grams), carbs (grams), and fat (grams).
Use realistic USDA estimates. Format your response as JSON only, no other text.
Example: {"calories": 95, "protein": 0.5, "carbs": 25, "fat": 0.3}`;

    const userMessage = `What is the nutritional content of: ${trimmedDescription}? Provide the response in JSON format with calories, protein, carbs, and fat.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000); // 25s for Vercel

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://hawkfuel.vercel.app",
        "X-Title": "HawkFuel",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.2,
        max_tokens: 200,
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
      nutrition = {
        calories: Math.round(parsed.calories || parsed.cal || 0),
        protein: Math.round((parsed.protein || 0) * 10) / 10,
        carbs:
          Math.round((parsed.carbs || parsed.carbohydrates || 0) * 10) / 10,
        fat: Math.round((parsed.fat || 0) * 10) / 10,
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
