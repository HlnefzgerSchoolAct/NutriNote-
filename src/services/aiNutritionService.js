/**
 * AI Nutrition Service
 * Handles nutrition estimation via backend proxy with caching.
 * Also provides a hybrid USDA-first estimation path:
 *   1. AI parses the food description into a structured USDA query
 *   2. USDA FoodData Central API returns validated nutrition (per 100g)
 *   3. Values are scaled to the actual serving size
 *   4. Falls back to pure AI estimation if USDA lookup fails
 *
 * Backend uses Hack Club's AI proxy (https://ai.hackclub.com)
 */

import devLog from '../utils/devLog';

import { searchUSDAFood, mapUSDANutrients } from './usdaFoodDataService';

const CACHE_KEY = 'nutrinoteplus_ai_nutrition_cache';
const API_ENDPOINT = '/api/estimate-nutrition';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const REQUEST_TIMEOUT = 35000; // 35 seconds (slightly longer than server timeout)

// Track in-flight requests to deduplicate concurrent calls for the same food
const pendingRequests = new Map();

/**
 * Get cache object from localStorage
 * @returns {Object} Cache object
 */
function getCache() {
  try {
    const cache = localStorage.getItem(CACHE_KEY);
    return cache ? JSON.parse(cache) : {};
  } catch (error) {
    devLog.warn('Failed to read nutrition cache:', error);
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
    devLog.warn('Failed to save nutrition cache:', error);
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
 * Get cached nutrition data
 * @param {string} foodDescription - Food description/query
 * @returns {Object|null} Cached nutrition data or null if not found/expired
 */
export function getCachedNutrition(foodDescription) {
  const cache = getCache();
  const key = foodDescription.toLowerCase().trim();
  const entry = cache[key];

  if (entry && isCacheValid(entry.timestamp)) {
    devLog.log('📦 Using cached nutrition data for:', foodDescription);
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
 * Cache nutrition data
 * @param {string} foodDescription - Food description/query
 * @param {Object} nutritionData - Nutrition data to cache
 */
function cacheNutrition(foodDescription, nutritionData) {
  const cache = getCache();
  const key = foodDescription.toLowerCase().trim();
  cache[key] = {
    data: nutritionData,
    timestamp: Date.now(),
  };
  saveCache(cache);
  devLog.log('💾 Cached nutrition data for:', foodDescription);
}

/**
 * Format error message for user display
 * @param {Object} errorData - Error data from API
 * @param {number} status - HTTP status code
 * @returns {string} User-friendly error message
 */
function formatErrorMessage(errorData, status) {
  // Use error code for specific messages
  const errorMessages = {
    RATE_LIMITED: '⏱️ Too many requests. Please wait a few minutes and try again.',
    API_RATE_LIMITED: '⏱️ AI service is busy. Please wait a moment and try again.',
    AUTH_ERROR: '🔑 Authentication error. Please contact support.',
    TIMEOUT: '⏳ Request timed out. The AI is slow right now. Please try again.',
    PARSE_ERROR:
      "🤔 Couldn't understand that food. Try being more specific (e.g., '1 medium apple').",
    EMPTY_RESPONSE: "🤷 AI couldn't estimate that. Try rephrasing your food description.",
    MISSING_INPUT: '📝 Please enter a food description.',
    EMPTY_INPUT: '📝 Food description cannot be empty.',
    INPUT_TOO_LONG: '📝 Description too long. Please use fewer than 200 characters.',
    API_UNAVAILABLE: '🔧 AI service is temporarily down. Please try again later.',
    API_OVERLOADED: '🔧 AI service is overloaded. Please try again in a few minutes.',
    SERVER_CONFIG_ERROR: '⚙️ Server configuration error. Please contact support.',
    NETWORK_ERROR: '📡 Network error. Please check your connection and try again.',
  };

  if (errorData?.code && errorMessages[errorData.code]) {
    return errorMessages[errorData.code];
  }

  // Fallback based on status code
  if (status === 429) return errorMessages.RATE_LIMITED;
  if (status === 504) return errorMessages.TIMEOUT;
  if (status >= 500) return errorMessages.API_UNAVAILABLE;

  // Use server's error message if available
  if (errorData?.error) {
    return `❌ ${errorData.error}`;
  }

  return '❌ Failed to estimate nutrition. Please try again.';
}

/**
 * Estimate nutrition using backend proxy
 * @param {string} foodDescription - Description of food (e.g., "medium apple" or "1 cup cooked chicken")
 * @returns {Promise<Object>} Nutrition data {calories, protein, carbs, fat}
 */
export async function estimateNutrition(foodDescription) {
  if (!foodDescription || foodDescription.trim().length === 0) {
    throw new Error('📝 Please enter a food description');
  }

  const trimmedDescription = foodDescription.trim();
  const requestKey = trimmedDescription.toLowerCase();

  // Check cache first
  const cached = getCachedNutrition(trimmedDescription);
  if (cached) {
    return cached;
  }

  // Check if there's already a pending request for this food
  if (pendingRequests.has(requestKey)) {
    devLog.log('⏳ Reusing pending request for:', trimmedDescription);
    return pendingRequests.get(requestKey);
  }

  devLog.log('🤖 Estimating nutrition for:', trimmedDescription);

  // Create the request promise and store it for deduplication
  const requestPromise = (async () => {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ foodDescription: trimmedDescription }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      // Parse response
      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error('📡 Invalid response from server. Please try again.');
      }

      // Handle errors
      if (!response.ok) {
        const errorMessage = formatErrorMessage(data, response.status);
        devLog.error('API Error:', {
          status: response.status,
          code: data?.code,
          error: data?.error,
          details: data?.details,
        });
        throw new Error(errorMessage);
      }

      // Validate response
      const { nutrition, responseTime, source, usdaFoodName } = data;

      if (!nutrition) {
        throw new Error('🤷 No nutrition data received. Please try again.');
      }

      if (
        nutrition.calories < 0 ||
        nutrition.protein < 0 ||
        nutrition.carbs < 0 ||
        nutrition.fat < 0
      ) {
        throw new Error('⚠️ Invalid nutrition values. Please try a different description.');
      }

      const sourceLabel =
        source === 'usda'
          ? 'USDA'
          : source === 'usda_ai_assisted'
            ? 'USDA (AI-assisted)'
            : 'AI estimate';
      devLog.log(`✅ Nutrition from ${sourceLabel} in ${responseTime}ms:`, nutrition);

      // Attach source info to the nutrition data
      nutrition._source = source;
      nutrition._usdaFoodName = usdaFoodName;

      // Cache the result
      cacheNutrition(trimmedDescription, nutrition);

      return nutrition;
    } catch (error) {
      clearTimeout(timeout);

      // Handle abort/timeout
      if (error.name === 'AbortError') {
        devLog.error('Request timeout');
        throw new Error('⏳ Request timed out. Please try again.');
      }

      // Handle network errors
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        devLog.error('Network error:', error);
        throw new Error('📡 Network error. Is the server running? Check your connection.');
      }

      // Re-throw other errors (already formatted)
      throw error;
    } finally {
      // Always remove from pending requests when done
      pendingRequests.delete(requestKey);
    }
  })();

  // Store the promise for deduplication
  pendingRequests.set(requestKey, requestPromise);

  return requestPromise;
}

/**
 * Clear the nutrition cache
 */
export function clearNutritionCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
    devLog.log('🗑️ Nutrition cache cleared');
  } catch (error) {
    devLog.warn('Failed to clear nutrition cache:', error);
  }
}

/**
 * Get cache statistics
 * @returns {Object} Cache stats
 */
export function getCacheStats() {
  const cache = getCache();
  const entries = Object.entries(cache);
  const validEntries = entries.filter(([_, entry]) => isCacheValid(entry.timestamp));

  return {
    totalEntries: entries.length,
    validEntries: validEntries.length,
    expiredEntries: entries.length - validEntries.length,
    cacheSize: JSON.stringify(cache).length,
  };
}

// ─── Hybrid USDA + AI estimation ─────────────────────────────────────────────

const PARSE_ENDPOINT = '/api/parse-food';

/**
 * Ask the AI backend to convert a natural-language food description into a
 * structured query for USDA FoodData Central.
 *
 * @param {string} description - Food name (e.g., "grilled chicken breast")
 * @param {string|number} quantity - Numeric quantity (e.g., 1.5)
 * @param {string} unit - Unit string (e.g., "cup", "oz", "serving")
 * @returns {Promise<{searchQuery:string, servingSizeGrams:number, alternateQueries:string[], preferBranded:boolean}|null>}
 */
export async function parseFoodForUSDA(description, quantity, unit) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const response = await fetch(PARSE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ foodDescription: description, quantity, unit }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      devLog.warn('parse-food API returned', response.status);
      return null;
    }

    const data = await response.json();
    devLog.log('🧠 AI parsed food for USDA:', data);
    return data;
  } catch (error) {
    devLog.warn('parseFoodForUSDA failed:', error.message);
    return null;
  }
}

/**
 * Hybrid nutrition estimator.
 *
 * Flow:
 *   1. Check cache for the composite key `{quantity} {unit} {description}`
 *   2. AI parses the description → USDA search query + serving size in grams
 *   3. Try each search query in order until a USDA result is found
 *   4. Map USDA nutrient data to app format, scaled to serving size
 *   5. On any failure → fall back to pure AI estimation (estimateNutrition)
 *
 * @param {string} description - Food description (e.g., "brown rice with butter")
 * @param {string|number} quantity - Serving quantity
 * @param {string} unit - Serving unit
 * @param {Function} [onStage] - Optional callback called with a string describing current stage
 * @returns {Promise<Object>} Nutrition data with a `source` field: "usda" | "ai"
 */
export async function estimateWithUSDA(description, quantity, unit, onStage) {
  const compositeKey = `${quantity} ${unit} of ${description}`;

  // Only use cache if the result came from USDA — AI fallbacks should be
  // retried so a transient USDA failure doesn't permanently bypass the lookup.
  const cached = getCachedNutrition(compositeKey);
  if (cached && cached.source === 'usda') return cached;

  devLog.log('🔄 Starting hybrid estimation for:', compositeKey);

  // ── Step 1: AI parses the food description ──────────────────────────────
  onStage?.('Parsing food description...');
  const parsed = await parseFoodForUSDA(description, quantity, unit);

  if (parsed) {
    const { searchQuery, servingSizeGrams, alternateQueries, preferBranded } = parsed;
    const queries = [searchQuery, ...alternateQueries].filter(Boolean);

    // ── Step 2: Try each USDA query ──────────────────────────────────────
    onStage?.('Looking up in USDA database...');
    for (const query of queries) {
      const foods = await searchUSDAFood(query, preferBranded);
      if (!foods || foods.length === 0) continue;

      const best = foods[0]; // already sorted by Foundation > SR Legacy > ...
      const nutrition = mapUSDANutrients(best, servingSizeGrams);

      if (nutrition.calories > 0) {
        devLog.log(`✅ USDA hit: "${best.description}" (${best.dataType}, fdcId: ${best.fdcId})`);
        // Cache under the composite key so repeat lookups are instant
        cacheNutrition(compositeKey, nutrition);
        return nutrition;
      }
    }

    devLog.log('⚠️ No usable USDA result found, falling back to AI');
  } else {
    devLog.log('⚠️ AI parsing failed, falling back to AI estimation');
  }

  // ── Step 3: AI fallback ─────────────────────────────────────────────────
  onStage?.('Estimating with AI...');
  const aiResult = await estimateNutrition(compositeKey);
  // Don't permanently cache the AI fallback — next request should retry USDA.
  // estimateNutrition caches internally; clear that entry so the next call
  // goes through the full hybrid path again.
  const cache = getCache();
  delete cache[compositeKey.toLowerCase().trim()];
  saveCache(cache);
  return { ...aiResult, source: 'ai' };
}
