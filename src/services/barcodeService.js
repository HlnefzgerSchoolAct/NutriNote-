/**
 * Barcode Service
 * Handles barcode lookup via Open Food Facts API with caching
 */

const CACHE_KEY = "hawkfuel_barcode_cache";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const API_BASE = "https://world.openfoodfacts.org/api/v0/product";

/**
 * Get cache object from localStorage
 * @returns {Object} Cache object
 */
function getCache() {
  try {
    const cache = localStorage.getItem(CACHE_KEY);
    return cache ? JSON.parse(cache) : {};
  } catch (error) {
    console.warn("Failed to read barcode cache:", error);
    return {};
  }
}

/**
 * Save cache to localStorage
 * @param {Object} cache - Cache object to save
 */
function saveCache(cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn("Failed to save barcode cache:", error);
  }
}

/**
 * Check if cached item is still valid
 * @param {number} timestamp - Cache entry timestamp
 * @returns {boolean} Whether cache is still valid
 */
function isCacheValid(timestamp) {
  return Date.now() - timestamp < CACHE_TTL;
}

/**
 * Get cached barcode data
 * @param {string} barcode - Barcode number
 * @returns {Object|null} Cached product data or null if not found/expired
 */
export function getCachedBarcode(barcode) {
  const cache = getCache();
  const key = barcode.trim();
  const entry = cache[key];

  if (entry && isCacheValid(entry.timestamp)) {
    console.log("📦 Using cached barcode data for:", barcode);
    return entry.data;
  }

  // Clean up expired cache entries
  if (entry) {
    delete cache[key];
    saveCache(cache);
  }

  return null;
}

/**
 * Cache barcode data
 * @param {string} barcode - Barcode number
 * @param {Object} productData - Product data to cache
 */
function cacheBarcode(barcode, productData) {
  const cache = getCache();
  const key = barcode.trim();
  cache[key] = {
    data: productData,
    timestamp: Date.now(),
  };
  saveCache(cache);
  console.log("💾 Cached barcode data for:", barcode);
}

/**
 * Parse nutrition data from Open Food Facts response
 * @param {Object} nutriments - Nutriments object from API
 * @returns {Object} Normalized nutrition per 100g
 */
function parseNutrition(nutriments) {
  return {
    calories: Math.round(
      nutriments["energy-kcal_100g"] || nutriments["energy-kcal"] || 0,
    ),
    protein:
      Math.round((nutriments.proteins_100g || nutriments.proteins || 0) * 10) /
      10,
    carbs:
      Math.round(
        (nutriments.carbohydrates_100g || nutriments.carbohydrates || 0) * 10,
      ) / 10,
    fat: Math.round((nutriments.fat_100g || nutriments.fat || 0) * 10) / 10,
  };
}

/**
 * Lookup product by barcode
 * @param {string} barcode - Barcode number to look up
 * @returns {Promise<Object>} Product data with nutrition
 * @throws {Error} If product not found or has no nutrition data
 */
export async function lookupBarcode(barcode) {
  const cleanBarcode = barcode.trim();

  // Check cache first
  const cached = getCachedBarcode(cleanBarcode);
  if (cached) {
    return { ...cached, cached: true };
  }

  console.log("🔍 Looking up barcode:", cleanBarcode);

  try {
    const response = await fetch(`${API_BASE}/${cleanBarcode}.json`, {
      headers: {
        "User-Agent":
          "HawkFuel/1.0 (https://github.com/HlnefzgerSchoolAct/HawkFuel)",
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();

    // Check if product exists
    if (data.status === 0 || !data.product) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    const product = data.product;

    // Check if nutrition data exists
    if (!product.nutriments || Object.keys(product.nutriments).length === 0) {
      throw new Error("NO_NUTRITION_DATA");
    }

    // Build product data
    const productData = {
      barcode: cleanBarcode,
      name:
        product.product_name || product.product_name_en || "Unknown Product",
      brand: product.brands || "",
      servingSize: product.serving_size || "100g",
      servingQuantity: product.serving_quantity || 100,
      nutritionPer100g: parseNutrition(product.nutriments),
      imageUrl: product.image_front_small_url || null,
    };

    // If serving size nutrition is available, include it
    if (product.nutriments["energy-kcal_serving"]) {
      productData.nutritionPerServing = {
        calories: Math.round(product.nutriments["energy-kcal_serving"] || 0),
        protein:
          Math.round((product.nutriments.proteins_serving || 0) * 10) / 10,
        carbs:
          Math.round((product.nutriments.carbohydrates_serving || 0) * 10) / 10,
        fat: Math.round((product.nutriments.fat_serving || 0) * 10) / 10,
      };
    }

    // Cache the result
    cacheBarcode(cleanBarcode, productData);

    return { ...productData, cached: false };
  } catch (error) {
    console.error("Barcode lookup error:", error);

    if (error.message === "PRODUCT_NOT_FOUND") {
      throw new Error(
        "Product not found in database. Try using the AI Estimator instead.",
      );
    }

    if (error.message === "NO_NUTRITION_DATA") {
      throw new Error(
        "This product has no nutrition data. Try using the AI Estimator instead.",
      );
    }

    throw new Error(
      "Failed to look up barcode. Please check your connection and try again.",
    );
  }
}

/**
 * Calculate nutrition based on quantity and unit
 * @param {Object} nutritionPer100g - Base nutrition per 100g
 * @param {number} quantity - Amount
 * @param {string} unit - Unit of measurement (g, oz, serving)
 * @param {number} servingQuantity - Grams per serving
 * @returns {Object} Calculated nutrition
 */
export function calculateNutrition(
  nutritionPer100g,
  quantity,
  unit,
  servingQuantity = 100,
) {
  let grams;

  switch (unit) {
    case "g":
      grams = quantity;
      break;
    case "oz":
      grams = quantity * 28.35;
      break;
    case "serving":
      grams = quantity * servingQuantity;
      break;
    case "package":
      grams = quantity * servingQuantity; // Assume package = serving
      break;
    default:
      grams = quantity;
  }

  const multiplier = grams / 100;

  return {
    calories: Math.round(nutritionPer100g.calories * multiplier),
    protein: Math.round(nutritionPer100g.protein * multiplier * 10) / 10,
    carbs: Math.round(nutritionPer100g.carbs * multiplier * 10) / 10,
    fat: Math.round(nutritionPer100g.fat * multiplier * 10) / 10,
  };
}

/**
 * Clear barcode cache
 */
export function clearBarcodeCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
    console.log("🗑️ Barcode cache cleared");
  } catch (error) {
    console.warn("Failed to clear barcode cache:", error);
  }
}

// Named exports are used directly, no default export needed
