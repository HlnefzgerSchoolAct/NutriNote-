# NutriNote+ Project Milestones

This document outlines the next 20 planned milestones for NutriNote+, organized by theme and approximate priority. Each milestone groups related issues and features that should be completed together.

---

## Milestone 1 — Complete TypeScript Migration

**Goal:** Finish converting all remaining JavaScript source files to TypeScript.

**Scope:**
- Migrate all `.js`/`.jsx` components in `src/components/` to `.ts`/`.tsx`
- Migrate remaining pages in `src/pages/`
- Migrate services in `src/services/`
- Migrate hooks in `src/hooks/`
- Achieve zero TypeScript errors across the full codebase (`npm run type-check` passes cleanly)

**Success Criteria:** `npm run type-check` reports 0 errors with strict mode enabled.

---

## Milestone 2 — Zero Lint Errors

**Goal:** Resolve all 74 pre-existing ESLint errors and establish a clean baseline.

**Scope:**
- Fix all unescaped entity errors in JSX (e.g., `&apos;`, `&amp;`)
- Add missing accessible labels (`aria-label`) to all interactive elements
- Fix remaining `react-hooks/exhaustive-deps` warnings
- Set up Husky + lint-staged to block new lint errors in CI

**Success Criteria:** `npm run lint` reports 0 errors and 0 warnings; CI blocks PRs that introduce new errors.

---

## Milestone 3 — Finish Settings Component Decomposition

**Goal:** Complete the refactor of `Settings.js` into typed TypeScript sub-components.

**Scope:**
- Convert `GeneralSettings.js` → `GeneralSettings.tsx`
- Convert `MacroSettings.js` → `MacroSettings.tsx`
- Convert `MicroSettings.js` → `MicroSettings.tsx`
- Convert `ProfileSettings.js` → `ProfileSettings.tsx`
- Convert `DataSettings.js` → `DataSettings.tsx`
- Add integration tests for `useSettingsState` hook

**Success Criteria:** Settings renders with no JS files remaining in `src/components/settings/`.

---

## Milestone 4 — Speech-to-Text (STT) Food Logging

**Goal:** Allow users to log food and exercise by speaking, reducing friction in the logging workflow.

**Scope:**
- Integrate a speech-to-text API (e.g., Web Speech API, Google Cloud Speech-to-Text, or Azure Cognitive Services Speech) for food name input
- Add a microphone button to the food and exercise log entry forms
- Parse spoken input to pre-fill food name and calorie fields
- Handle browser permission requests gracefully (show fallback if denied)
- Support at minimum English; design for multi-language extension

**Success Criteria:** A user can log food by tapping a mic button and speaking "Two eggs, 150 calories" without typing.

---

## Milestone 5 — OCR Nutrition Facts Scanner

**Goal:** Let users photograph a nutrition facts label to automatically populate macros and micronutrients.

**Scope:**
- Integrate an OCR service (e.g., Tesseract.js for on-device processing or Google Cloud Vision OCR for higher accuracy) via the proxy server
- Parse standard US/EU nutrition facts label layout
- Auto-fill serving size, calories, protein, carbs, fat, and key micronutrients
- Display a confirmation sheet (reuse `ConfirmAIFoodSheet`) before logging
- Handle poor image quality with a retry prompt

**Success Criteria:** A clear photo of a nutrition label populates all macro fields with ≥90% accuracy in manual testing.

---

## Milestone 6 — Micronutrient Range Validation & Alerts

**Goal:** Warn users when logged micronutrient values are outside physiologically reasonable ranges.

**Scope:**
- Define per-nutrient safe daily ranges (using existing `MICRONUTRIENT_INFO` constants)
- Show inline warnings when a single food entry exceeds a per-meal threshold
- Show daily aggregate warnings when total intake is above the tolerable upper intake level (UL)
- Add a "why is this flagged?" explainer tooltip
- Write unit tests for the validation logic

**Success Criteria:** Logging 10,000 mg of vitamin C triggers a visible warning with an explanation.

---

## Milestone 7 — Historical Consistency & Trend Detection

**Goal:** Detect unrealistic or suspicious changes in a user's logged nutrient intake over time.

**Scope:**
- Calculate rolling 7-day and 30-day averages per nutrient
- Flag single-day values that deviate more than 3× the user's own historical average
- Surface anomalies in the Nutrition Insights dashboard (Milestone 15)
- Store consistency check results in Firestore alongside daily logs
- Write tests for the anomaly detection logic

**Success Criteria:** A test case with a 10× sodium spike is reliably flagged; normal variation is not flagged.

---

## Milestone 8 — User Feedback System for AI Predictions

**Goal:** Allow users to flag incorrect AI-generated food recognition or nutrition estimates, improving data quality over time.

**Scope:**
- Add a "Flag as incorrect" action to every AI-recognized food entry
- Capture the original prediction, user correction, and timestamp in Firestore
- Display a simple "Thanks for the feedback" confirmation
- Build an admin view (protected route) for reviewing flagged entries
- Document the feedback data schema

**Success Criteria:** A flagged entry is stored in Firestore and appears in the admin review view.

---

## Milestone 9 — Explainable AI Nutrition Display

**Goal:** Show users exactly how each nutrition value was determined, building trust in AI estimates.

**Scope:**
- Add a "How was this calculated?" expandable panel to each logged food item
- Display the source chain: detected food name → USDA match → confidence score → final value
- Highlight when a value came from AI estimation vs. USDA database vs. user override
- Show the top-3 alternative USDA matches that were considered

**Success Criteria:** Tapping a food item reveals its full data provenance with no extra API calls needed.

---

## Milestone 10 — Ensemble AI Food Recognition

**Goal:** Combine multiple AI models to improve food identification accuracy and reduce single-model failures.

**Scope:**
- Run Gemini and Claude detection in parallel (already partially implemented)
- Implement a confidence-weighted merge algorithm for combining results
- Add a fallback chain: primary model → secondary model → USDA text search
- Track per-model accuracy metrics via Sentry
- A/B test ensemble vs. single-model to measure improvement

**Success Criteria:** Ensemble detection achieves measurably higher confidence scores on a test set of 100 food photos.

---

## Milestone 11 — Contextual & Personalized AI Learning

**Goal:** Adapt food suggestions and calorie estimates to each user's individual eating habits over time.

**Scope:**
- Track user correction frequency per food category
- Weight USDA results toward foods the user has confirmed before (personalized ranking)
- Surface "your usual breakfast" quick-log suggestions based on historical patterns
- Implement a privacy-safe on-device preference cache using IndexedDB
- Allow users to opt out of personalization in Settings

**Success Criteria:** After logging oatmeal 5 times, it appears as a top suggestion without searching.

---

## Milestone 12 — Advanced Image Segmentation for Food Portions

**Goal:** Move beyond food identification to quantitative portion estimation using image analysis.

**Scope:**
- Integrate an image segmentation model (e.g., SAM or a vision model with bounding boxes) via the proxy API
- Estimate portion size relative to known reference objects (plate, hand, utensil)
- Convert estimated portion to grams and auto-populate the quantity field
- Display bounding boxes on the food photo for user review
- Provide a manual override slider for portion adjustment

**Success Criteria:** A photo of a chicken breast on a plate produces a gram estimate within ±30% of the actual weight.

---

## Milestone 13 — Meal Planning & Smart Grocery Lists

**Goal:** Enable forward-looking meal planning so users can prepare nutritious meals in advance.

**Scope:**
- Add a "Meal Planner" page with a 7-day calendar view
- Allow dragging saved recipes or meals onto calendar days
- Auto-calculate daily nutrition targets vs. planned intake
- Generate a consolidated grocery list from the weekly meal plan
- Export grocery list as plain text or share via Web Share API

**Success Criteria:** A full week's meals can be planned and a downloadable grocery list can be generated.

---

## Milestone 14 — Social Features: Recipe & Meal Sharing

**Goal:** Let users share recipes and meal plans with friends or publicly.

**Scope:**
- Add a "Share Recipe" button that generates a public read-only link
- Implement a public recipe feed (opt-in) with like/save functionality
- Allow users to follow other users and view their shared meal plans
- Add privacy controls (public / friends only / private) per recipe
- Moderate shared content with a report mechanism

**Success Criteria:** A recipe shared via link is viewable by a logged-out user with correct nutrition info displayed.

---

## Milestone 15 — Fitness Tracker & Wearable Integration

**Goal:** Automatically import activity data from popular fitness trackers to reduce manual exercise logging.

**Scope:**
- Integrate with Google Fit / Health Connect API (Android) and Apple HealthKit (iOS PWA bridge)
- Sync step count, active calories burned, and heart rate data daily
- Map imported activities to existing MET-based exercise log entries
- Allow users to enable/disable specific data sources in Settings
- Display sync status using the existing `SyncStatusIndicator` component

**Success Criteria:** Steps and active calories from Google Fit appear automatically in the exercise log for the current day.

---

## Milestone 16 — Restaurant Menu Database Integration

**Goal:** Allow users to search for and log items directly from restaurant menus without manual entry.

**Scope:**
- Integrate a restaurant nutrition API (e.g., Nutritionix restaurant data or Open Food Facts)
- Add a "Restaurant" tab to the food search UI
- Support searching by restaurant name + menu item
- Cache recent restaurant searches locally for offline use
- Show nutrition badges (e.g., low-calorie, high-protein) on search results

**Success Criteria:** A user can search "McDonald's Big Mac" and log it with accurate nutrition data in under 5 seconds.

---

## Milestone 17 — Nutrition Insights & Trends Dashboard

**Goal:** Give users a rich analytics view of their nutrition patterns over time.

**Scope:**
- Build a dedicated Insights page with weekly/monthly/all-time views
- Add charts for: calorie trends, macro split over time, weight vs. calorie correlation
- Surface top 5 most-logged foods and their cumulative nutrition contribution
- Highlight streaks (e.g., "7 days under calorie goal") and goal achievement rates
- Export insights as a PDF or image for sharing with a nutritionist

**Success Criteria:** The Insights page loads 30-day trend charts in under 2 seconds from Firestore.

---

## Milestone 18 — PWA Enhancements: Widgets & Lock Screen

**Goal:** Deepen the native app feel with home screen widgets and lock screen glanceable stats.

**Scope:**
- Implement PWA widgets for Android (Chrome widget API) showing today's calorie summary
- Add iOS home screen widget support once Apple's PWA widget API is available
- Add a lock screen / notification summary (remaining calories, water intake) via Push Notifications API
- Ensure all PWA icons are crisp at 192×192, 512×512, and maskable variants
- Run Lighthouse PWA audit and achieve score ≥ 95

**Success Criteria:** An Android user can see remaining calories for the day on their home screen widget without opening the app.

---

## Milestone 19 — Multi-Language & Localization Support

**Goal:** Make NutriNote+ accessible to non-English speakers.

**Scope:**
- Extract all user-facing strings into a `locales/` directory using i18n (e.g., `react-i18next`)
- Add full translations for Spanish and French as the first two target languages
- Detect and apply the user's browser language by default with a manual override in Settings
- Localize number/date formats using the `Intl` API
- Support RTL layouts for future Arabic/Hebrew localization

**Success Criteria:** A Spanish browser user sees the full UI in Spanish with no untranslated strings.

---

## Milestone 20 — CI/CD Pipeline & Automated Quality Gates

**Goal:** Establish a robust automated pipeline that ensures every pull request meets quality standards before merging.

**Scope:**
- Set up GitHub Actions workflows for: lint, type-check, unit tests, and build
- Add end-to-end tests for the core user flow (onboarding → log food → view summary) using Playwright
- Configure Codecov (or similar) and enforce a minimum 70% test coverage threshold
- Add a Lighthouse CI step to block PRs that regress performance or accessibility scores
- Set up automatic Vercel preview deployments for every PR

**Success Criteria:** Every PR automatically runs the full quality gate suite; failing checks block merge.

---

## Summary Table

| # | Milestone | Theme | Effort |
|---|-----------|-------|--------|
| 1 | Complete TypeScript Migration | Code Quality | Medium |
| 2 | Zero Lint Errors | Code Quality | Small |
| 3 | Finish Settings Decomposition | Code Quality | Small |
| 4 | Speech-to-Text Food Logging | AI / UX | Medium |
| 5 | OCR Nutrition Facts Scanner | AI / UX | Medium |
| 6 | Micronutrient Range Validation | Data Quality | Small |
| 7 | Historical Consistency & Trend Detection | Data Quality | Medium |
| 8 | User Feedback System for AI | Data Quality | Medium |
| 9 | Explainable AI Nutrition Display | AI / UX | Small |
| 10 | Ensemble AI Food Recognition | AI | Large |
| 11 | Contextual & Personalized AI Learning | AI | Large |
| 12 | Advanced Image Segmentation for Portions | AI | Large |
| 13 | Meal Planning & Smart Grocery Lists | Feature | Large |
| 14 | Social Features: Recipe & Meal Sharing | Feature | Large |
| 15 | Fitness Tracker & Wearable Integration | Integrations | Large |
| 16 | Restaurant Menu Database Integration | Integrations | Medium |
| 17 | Nutrition Insights & Trends Dashboard | Feature | Medium |
| 18 | PWA Enhancements: Widgets & Lock Screen | Platform | Medium |
| 19 | Multi-Language & Localization | Platform | Large |
| 20 | CI/CD Pipeline & Automated Quality Gates | DevOps | Medium |

---

_Milestones should be revisited and reprioritized each sprint. Move completed milestones to a "Completed" section at the bottom of this file._
