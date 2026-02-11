const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5001;

// CORS configuration - allow from React dev server and production
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? "https://nutrinoteplus.hackclub.com"
        : ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  }),
);

app.use(express.json({ limit: '5mb' }));

// Rate limiting: 30 requests per 15 minutes per IP
const nutritionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: {
    error: "Too many nutrition requests. Please try again in a few minutes.",
    code: "RATE_LIMITED",
    retryAfter: 15,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Nutrition estimation endpoint - uses Hack Club's AI proxy
app.post("/api/estimate-nutrition", nutritionLimiter, async (req, res) => {
  const startTime = Date.now();

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

    // Get API key from server-side environment only
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error("[ERROR] Missing OPENROUTER_API_KEY in environment");
      return res.status(500).json({
        error: "Server configuration error. Please contact support.",
        code: "SERVER_CONFIG_ERROR",
      });
    }

    // Use Hack Club's AI proxy endpoint
    const apiUrl = "https://ai.hackclub.com/proxy/v1/chat/completions";

    const systemPrompt = `You are a nutrition expert. When given a food description, provide the nutritional information for that food. 
Always respond with a valid JSON object containing: calories (total kcal), protein (grams), carbs (grams), and fat (grams).
Use realistic USDA estimates. Format your response as JSON only, no other text.
Example: {"calories": 95, "protein": 0.5, "carbs": 25, "fat": 0.3}`;

    const userMessage = `What is the nutritional content of: ${trimmedDescription}? Provide the response in JSON format with calories, protein, carbs, and fat.`;

    console.log(`[INFO] Estimating nutrition for: "${trimmedDescription}"`);

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://nutrinoteplus.hackclub.com",
        "X-Title": "NutriNote+",
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

    // Handle non-OK responses with detailed error info
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }

      console.error(`[ERROR] API returned ${response.status}:`, errorData);

      // Map common errors to user-friendly messages
      const errorMessages = {
        401: {
          error: "Authentication failed. Invalid API key.",
          code: "AUTH_ERROR",
        },
        403: {
          error: "Access forbidden. Check API permissions.",
          code: "FORBIDDEN",
        },
        429: {
          error: "AI service rate limited. Please wait and try again.",
          code: "API_RATE_LIMITED",
        },
        500: {
          error: "AI service temporarily unavailable.",
          code: "API_ERROR",
        },
        502: {
          error: "AI service is down. Please try again later.",
          code: "API_UNAVAILABLE",
        },
        503: {
          error: "AI service is overloaded. Please try again later.",
          code: "API_OVERLOADED",
        },
      };

      const errorInfo = errorMessages[response.status] || {
        error:
          errorData.error?.message ||
          errorData.message ||
          `API error (${response.status})`,
        code: "API_ERROR",
      };

      return res.status(response.status >= 500 ? 502 : response.status).json({
        ...errorInfo,
        details: process.env.NODE_ENV !== "production" ? errorData : undefined,
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("[ERROR] No content in API response:", data);
      return res.status(502).json({
        error: "AI returned empty response. Please try again.",
        code: "EMPTY_RESPONSE",
      });
    }

    // Parse nutrition from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[ERROR] Could not parse JSON from response:", content);
      return res.status(502).json({
        error: "Could not parse nutrition data. Please try rephrasing.",
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
    } catch (parseErr) {
      console.error("[ERROR] JSON parse failed:", parseErr.message);
      return res.status(502).json({
        error: "Invalid nutrition data format. Please try again.",
        code: "PARSE_ERROR",
      });
    }

    // Validate nutrition values
    if (
      nutrition.calories < 0 ||
      nutrition.protein < 0 ||
      nutrition.carbs < 0 ||
      nutrition.fat < 0
    ) {
      return res.status(502).json({
        error: "Invalid nutrition values received.",
        code: "INVALID_VALUES",
      });
    }

    const duration = Date.now() - startTime;
    console.log(`[INFO] Nutrition estimated in ${duration}ms:`, nutrition);

    return res.json({
      nutrition,
      cached: false,
      responseTime: duration,
    });
  } catch (error) {
    const duration = Date.now() - startTime;

    if (error.name === "AbortError") {
      console.error(`[ERROR] Request timeout after ${duration}ms`);
      return res.status(504).json({
        error: "Request timed out. The AI service is slow. Please try again.",
        code: "TIMEOUT",
      });
    }

    console.error(
      `[ERROR] Unexpected error after ${duration}ms:`,
      error.message,
    );
    return res.status(500).json({
      error: "An unexpected error occurred. Please try again.",
      code: "UNEXPECTED_ERROR",
      details:
        process.env.NODE_ENV !== "production" ? error.message : undefined,
    });
  }
});

// Legacy endpoint (deprecated) - redirect to new endpoint
app.post("/api/openrouter", nutritionLimiter, (req, res) => {
  console.warn("[WARN] Deprecated /api/openrouter endpoint called");
  res.status(410).json({
    error: "This endpoint is deprecated. Use /api/estimate-nutrition instead.",
    code: "DEPRECATED",
  });
});

// Photo rate limiter (lower limit for heavier requests)
const photoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    error: "Too many photo requests. Please try again in a few minutes.",
    code: "RATE_LIMITED",
    retryAfter: 15,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Photo food identification endpoint
app.post("/api/identify-food-photo", photoLimiter, async (req, res) => {
  const startTime = Date.now();

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

    const apiKey = process.env.OPENROUTER_API_KEY;
    const usdaKey = process.env.USDA_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "Server configuration error (missing AI key)", code: "SERVER_CONFIG_ERROR" });
    }
    if (!usdaKey) {
      return res.status(500).json({ error: "Server configuration error (missing USDA key)", code: "SERVER_CONFIG_ERROR" });
    }

    // Step 1: Vision AI identification
    const visionPrompt = "You are a food identification expert. Analyze this food photo and identify each distinct food item visible.\n\nFor each food item, provide:\n- \"name\": A clear, common food name suitable for searching a nutrition database\n- \"estimatedServing\": The estimated serving size with a unit (e.g., \"6 oz\", \"1 cup\", \"150g\")\n\nRespond ONLY with a valid JSON object:\n{\"foods\": [{\"name\": \"food name\", \"estimatedServing\": \"amount unit\"}, ...]}\n\nIf no food is visible, respond with: {\"foods\": [], \"error\": \"No food detected\"}";

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    const visionResponse = await fetch("https://ai.hackclub.com/proxy/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://nutrinoteplus.hackclub.com",
        "X-Title": "NutriNote+",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: visionPrompt },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Data}` } },
          ],
        }],
        temperature: 0.2,
        max_tokens: 500,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!visionResponse.ok) {
      return res.status(502).json({ error: "AI vision service error", code: "VISION_ERROR" });
    }

    const visionData = await visionResponse.json();
    const visionContent = visionData.choices?.[0]?.message?.content;
    if (!visionContent) {
      return res.status(502).json({ error: "AI returned empty response", code: "EMPTY_RESPONSE" });
    }

    const jsonMatch = visionContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(502).json({ error: "Could not parse food identification", code: "PARSE_ERROR" });
    }

    let identified;
    try {
      identified = JSON.parse(jsonMatch[0]);
    } catch {
      return res.status(502).json({ error: "Invalid food identification format", code: "PARSE_ERROR" });
    }

    if (!identified.foods || identified.foods.length === 0) {
      return res.json({
        foods: [],
        message: identified.error || "No food detected in the image.",
        responseTime: Date.now() - startTime,
      });
    }

    // Serving to grams conversion
    const parseServingToGrams = (str) => {
      const match = str.toLowerCase().trim().match(/^([\d.]+)\s*(.*)$/);
      if (!match) return 150;
      const amount = parseFloat(match[1]);
      const unit = match[2].trim();
      const conv = { g: 1, gram: 1, grams: 1, oz: 28.35, ounce: 28.35, cup: 240, cups: 240, tbsp: 15, tsp: 5, slice: 30, piece: 100, serving: 150, medium: 150, large: 200, small: 100 };
      return Math.round(amount * (conv[unit] || 150));
    };

    // USDA nutrient mapping
    const NUTRIENT_MAP = { 1008: "calories", 1003: "protein", 1005: "carbs", 1004: "fat", 1079: "fiber", 1093: "sodium", 2000: "sugar", 1253: "cholesterol" };

    // Step 2: USDA lookup for each food
    const results = await Promise.all(
      identified.foods.slice(0, 8).map(async (food) => {
        const servingGrams = parseServingToGrams(food.estimatedServing || "1 serving");
        const scale = servingGrams / 100;

        // Try USDA
        try {
          const usdaUrl = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
          usdaUrl.searchParams.set("query", food.name);
          usdaUrl.searchParams.set("api_key", usdaKey);
          usdaUrl.searchParams.set("pageSize", "1");
          usdaUrl.searchParams.set("dataType", "SR Legacy,Foundation");

          const usdaResp = await fetch(usdaUrl.toString());
          if (usdaResp.ok) {
            const usdaData = await usdaResp.json();
            if (usdaData.foods?.[0]?.foodNutrients) {
              const nutrition = {};
              for (const n of usdaData.foods[0].foodNutrients) {
                const field = NUTRIENT_MAP[n.nutrientId || n.nutrientNumber];
                if (field && n.value != null) nutrition[field] = Math.round(n.value * scale * 10) / 10;
              }
              if (nutrition.calories > 0) {
                return { name: food.name, serving: food.estimatedServing, nutrition, source: "usda" };
              }
            }
          }
        } catch (e) {
          console.error(`[USDA] Error for ${food.name}:`, e.message);
        }

        // Fallback to AI text estimation
        try {
          const fallbackResp = await fetch("https://ai.hackclub.com/proxy/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "HTTP-Referer": "https://nutrinoteplus.hackclub.com", "X-Title": "NutriNote+" },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: "You are a nutrition expert. Respond with JSON only: {\"calories\": N, \"protein\": N, \"carbs\": N, \"fat\": N}" },
                { role: "user", content: `Nutritional content of ${food.estimatedServing} of ${food.name}?` },
              ],
              temperature: 0.2,
              max_tokens: 200,
            }),
          });
          if (fallbackResp.ok) {
            const fbData = await fallbackResp.json();
            const fbContent = fbData.choices?.[0]?.message?.content;
            const fbMatch = fbContent?.match(/\{[\s\S]*\}/);
            if (fbMatch) {
              const parsed = JSON.parse(fbMatch[0]);
              return {
                name: food.name,
                serving: food.estimatedServing,
                nutrition: {
                  calories: Math.round(parsed.calories || 0),
                  protein: Math.round((parsed.protein || 0) * 10) / 10,
                  carbs: Math.round((parsed.carbs || 0) * 10) / 10,
                  fat: Math.round((parsed.fat || 0) * 10) / 10,
                },
                source: "ai_estimate",
              };
            }
          }
        } catch (e) {
          console.error(`[AI Fallback] Error for ${food.name}:`, e.message);
        }

        return { name: food.name, serving: food.estimatedServing, nutrition: null, source: "failed" };
      }),
    );

    const validResults = results.filter((r) => r.nutrition !== null);
    const duration = Date.now() - startTime;
    console.log(`[INFO] Photo identified ${validResults.length} foods in ${duration}ms`);

    return res.json({ foods: validResults, totalIdentified: identified.foods.length, responseTime: duration });
  } catch (error) {
    const duration = Date.now() - startTime;
    if (error.name === "AbortError") {
      return res.status(504).json({ error: "Request timed out", code: "TIMEOUT" });
    }
    console.error(`[ERROR] ${error.message} after ${duration}ms`);
    return res.status(500).json({ error: "An unexpected error occurred", code: "UNEXPECTED_ERROR" });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    service: "NutriNote+ AI Nutrition Proxy",
    version: "2.0.0",
    endpoints: {
      nutrition: "POST /api/estimate-nutrition",
      health: "GET /health",
    },
  });
});

app.listen(PORT, () => {
  console.log(`✅ NutriNote+ Proxy Server running on http://localhost:${PORT}`);
  console.log(`   Endpoints:`);
  console.log(`   - POST /api/estimate-nutrition (AI nutrition estimation)`);
  console.log(`   - GET  /health (health check)`);
});
