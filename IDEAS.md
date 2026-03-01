# NutriNote- Ideas & Next Steps

This document tracks ideas to be implemented and upcoming features for NutriNote-, organized by priority and complexity.

---

## 🔴 Quick Wins (Bug Fixes & Small Improvements)

### UI/UX Fixes

- [x] **Fix tabs bug** - Profile section hangs off edge when switching tabs ✅ Fixed - Added scroll-into-view on tab change
- [x] **User Confirmation Workflow** - Prompt users to confirm/correct AI-detected foods before logging ✅ Implemented - Created ConfirmAIFoodSheet component with optional toggle

---

## 🟡 Short-Term Features (1-2 Weeks)

### New Integrations

- [ ] **Hack AI STT Integration** - Add speech-to-text for food logging and user input
- [ ] **OCR for Nutrition Facts** - Extract nutrition info from food package photos using text-extractor-OCR

### Data Quality Improvements

- [ ] **Micronutrient Range Validation** - Flag values outside reasonable ranges
- [ ] **Historical Consistency Checks** - Detect unrealistic changes in micronutrient intake over time

### UI Enhancements

- [ ] **User Feedback System** - Allow users to flag errors in AI predictions
- [ ] **Explainable AI Display** - Show users how nutrition values were determined

---

## 🟠 Medium-Term Features (3-6 Weeks)

### Advanced Food Recognition

- [x] **Multi-Food Detection** - Detect all foods on a plate in a single image ✅ Implemented - Vision AI detects up to 25 foods per photo
- [x] **Individual USDA Lookup** - Query USDA database for each detected food separately ✅ Implemented - Top 3-5 USDA candidates per food with selectable dropdown
- [x] **Ingredient-Level Analysis** - Break down complex meals into individual ingredients ✅ Implemented - Auto AI decomposition for complex dishes with per-ingredient USDA lookup

### Enhanced AI Coach

- [x] **Coach Food Logging** - Allow AI coach to log foods, meals, and recipes for users ✅ Implemented - Coach proposes foods in chat, user approves via inline action cards
- [x] **Coach Recipe Creation** - Enable coach to create and save recipes ✅ Implemented - Coach generates recipes with ingredients, saved to IndexedDB on approval
- [x] **Coach Settings Management** - Allow coach to update weight, goals, and user settings ✅ Implemented - Coach can update weight, daily target, activity level, goal, and macro goals

### Data Quality & Accuracy

- [x] **Multi-Step AI Validation** - Cross-check food recognirtion using multiple models ✅ Implemented - Dual-model detection (Gemini + Claude) with confidence scoring, fuzzy food name matching, and merged results
- [x] **AI Outlier Detection** - Detect and warn about unusual micronutrient values ✅ Implemented - Per-food outlier detection with auto-correction (>5x typical), cross-nutrient consistency checks, and meal-level aggregate warnings

---

## 🔵 Long-Term Vision (2-3+ Months)

### AI System Enhancements

- [ ] **Ensemble Learning** - Combine multiple AI models for improved accuracy
- [ ] **Contextual Learning** - Adapt suggestions based on user history and corrections
- [ ] **User-Specific AI Profiles** - Learn individual habits and preferences
- [ ] **Advanced Image Segmentation** - Context-aware recognition for precise food identification

### Platform Enhancements

- [ ] **PWA Widgets for iPhone** - Home screen widgets for nutrition stats and quick logging (pending Apple support)

---

## 💡 Future Ideas (Backlog)

- [ ] Multi-language support for voice input
- [ ] Meal planning and grocery list generation
- [ ] Social features (share recipes, meal plans)
- [ ] Integration with fitness trackers and smartwatches
- [ ] Restaurant menu database integration
- [ ] Nutrition insights and trends dashboard

---

_Update this file as new ideas and priorities emerge. Move items between sections as priorities change._
