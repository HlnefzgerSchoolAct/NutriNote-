// Vercel Serverless Function — USDA FoodData Central Proxy
// Keeps USDA_API_KEY server-side so it is never exposed to the browser.
//
// POST /api/usda-search
// Body: { query: string, dataTypes: string[], pageSize?: number }
// Response: USDA /foods/search JSON (foods array + metadata)

const USDA_BASE = "https://api.nal.usda.gov/fdc/v1";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { query, dataTypes, pageSize = 10 } = req.body || {};

  if (!query || typeof query !== "string" || !query.trim()) {
    return res.status(400).json({ error: "query is required" });
  }

  const apiKey = process.env.USDA_API_KEY;

  const params = new URLSearchParams({
    query: query.trim(),
    pageSize: String(Math.min(Number(pageSize) || 10, 25)),
  });

  // USDA requires each dataType as a separate repeated parameter
  if (Array.isArray(dataTypes) && dataTypes.length > 0) {
    for (const dt of dataTypes) params.append("dataType", dt);
  }

  if (apiKey) {
    params.set("api_key", apiKey);
  }

  try {
    const upstream = await fetch(`${USDA_BASE}/foods/search?${params}`, {
      headers: { Accept: "application/json" },
    });

    if (!upstream.ok) {
      const errorText = await upstream.text().catch(() => "");
      console.error("[usda-search] upstream error", upstream.status, errorText);
      return res.status(upstream.status).json({
        error: "USDA API error",
        status: upstream.status,
      });
    }

    const data = await upstream.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error("[usda-search] fetch error:", error.message);
    return res.status(502).json({ error: "Failed to reach USDA API" });
  }
}
