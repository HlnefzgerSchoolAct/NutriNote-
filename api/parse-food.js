// Vercel Serverless Function — AI Food Parser
// Converts natural language food descriptions into structured queries
// suitable for the USDA FoodData Central database.
//
// POST /api/parse-food
// Body: { foodDescription: string, quantity: string|number, unit: string }
// Response: { searchQuery, servingSizeGrams, alternateQueries, preferBranded }

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 60; // more generous than full estimation

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { windowStart: now, count: 1 });
    return { allowed: true };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false };
  }

  entry.count++;
  return { allowed: true };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" });
  }

  const clientIP = req.headers["x-forwarded-for"]?.split(",")[0] || "unknown";
  if (!checkRateLimit(clientIP).allowed) {
    return res.status(429).json({ error: "Too many requests", code: "RATE_LIMITED" });
  }

  const { foodDescription, quantity, unit } = req.body || {};

  if (!foodDescription || typeof foodDescription !== "string") {
    return res.status(400).json({ error: "foodDescription is required", code: "MISSING_INPUT" });
  }

  const trimmed = foodDescription.trim().slice(0, 200);
  if (!trimmed) {
    return res.status(400).json({ error: "Empty food description", code: "EMPTY_INPUT" });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server configuration error", code: "SERVER_CONFIG_ERROR" });
  }

  const systemPrompt = `You are a USDA nutrition database expert. Convert food descriptions into optimized USDA FoodData Central search queries.

Respond ONLY with a valid JSON object — no prose, no markdown:
{
  "searchQuery": "primary USDA search query (2-5 words, USDA naming format)",
  "servingSizeGrams": <total weight in grams for the given quantity/unit>,
  "alternateQueries": ["backup query 1", "backup query 2"],
  "preferBranded": <true if this is clearly a packaged/branded food, false otherwise>
}

USDA naming conventions:
- Use comma-separated descriptors: "Chicken, breast, cooked, grilled"
- Prefer USDA-style names over colloquial names
- For generic foods: "Apple, raw" not "fresh apple"
- For cooked methods: append after food name
- Omit quantity/serving info from searchQuery

Serving size estimation (grams):
- 1 cup cooked rice ≈ 186g
- 1 cup raw leafy greens ≈ 30g
- 1 oz = 28.35g
- 1 tbsp oil ≈ 14g
- 1 medium apple ≈ 182g
- 1 serving = estimate based on food type
- If unit is "g" already, use that directly multiplied by quantity`;

  const userMessage = `Food: "${trimmed}" | Quantity: ${quantity ?? 1} | Unit: ${unit ?? "serving"}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const refererUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "https://nutrinoteplus.vercel.app";

    const aiResponse = await fetch("https://ai.hackclub.com/proxy/v1/chat/completions", {
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
        temperature: 0.1,
        max_tokens: 250,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!aiResponse.ok) {
      console.error("[parse-food] AI error:", aiResponse.status);
      return res.status(502).json({ error: "AI service error", code: "API_ERROR" });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(502).json({ error: "Empty AI response", code: "EMPTY_RESPONSE" });
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(502).json({ error: "Could not parse AI response", code: "PARSE_ERROR" });
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return res.status(502).json({ error: "Invalid JSON from AI", code: "PARSE_ERROR" });
    }

    // Sanitize and validate output
    const servingGrams = parseFloat(parsed.servingSizeGrams);

    return res.status(200).json({
      searchQuery: (parsed.searchQuery || trimmed).trim().slice(0, 100),
      servingSizeGrams: isFinite(servingGrams) && servingGrams > 0 ? servingGrams : 100,
      alternateQueries: Array.isArray(parsed.alternateQueries)
        ? parsed.alternateQueries.slice(0, 3).map(String)
        : [],
      preferBranded: Boolean(parsed.preferBranded),
    });
  } catch (error) {
    if (error.name === "AbortError") {
      return res.status(504).json({ error: "Request timed out", code: "TIMEOUT" });
    }
    console.error("[parse-food] Unexpected error:", error.message);
    return res.status(500).json({ error: "Unexpected error", code: "UNEXPECTED_ERROR" });
  }
}
