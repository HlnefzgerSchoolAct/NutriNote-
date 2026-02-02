# HawkFuel Future Updates

This document tracks planned features and improvements for future releases.

---

## Completed Features ✅

### Barcode Scanner ✅ (Completed February 2026)

- **Description**: Scan food product barcodes for instant nutrition lookup
- **Implementation**:
  - ZXing library for barcode reading
  - Camera permissions handling with fallback to manual entry
  - Open Food Facts API integration for product database
  - Serving size adjustment after scan
  - Fallback to AI estimator for unknown products
- **User Flow**: Tap scan icon → Point camera at barcode → Adjust serving → Add to log
- **Mobile-only**: Scanner tab hidden on desktop

---

## Planned Features

### High Priority

#### Recipe Builder

- **Description**: Create custom recipes by combining multiple ingredients
- **Features**:
  - Search and add ingredients from AI or database
  - Automatic nutrition calculation per serving
  - Save recipes for quick future logging
  - Adjust serving sizes
- **Data Storage**: IndexedDB for recipe storage (larger than localStorage)
- **Estimated Effort**: 1 week

#### Meal Templates

- **Description**: Pre-built meal plans users can follow
- **Features**:
  - Template categories (weight loss, muscle gain, maintenance)
  - Daily/weekly meal schedules
  - One-tap logging of entire meals
  - Custom template creation
- **Estimated Effort**: 3-4 days

---

### Medium Priority

#### Micronutrient Tracking

- **Description**: Track vitamins, minerals, fiber, sodium, sugar
- **Challenges**:
  - AI would need expanded prompts
  - Database foods need micronutrient data
  - UI space for additional data display
- **Consideration**: May significantly increase AI response time
- **Estimated Effort**: 1 week

#### Social Features

- **Description**: Connect with friends, share progress
- **Features**:
  - Friend list and search
  - Share achievements and milestones
  - Compare weekly stats (opt-in)
  - Encouragement messages
- **Requirements**: Backend database (Firebase, Supabase)
- **Estimated Effort**: 2-3 weeks

#### Challenges & Competitions

- **Description**: Gamified fitness challenges
- **Features**:
  - Weekly step/calorie challenges
  - Streak competitions
  - Leaderboards
  - Badge rewards
- **Requirements**: Backend for multi-user coordination
- **Estimated Effort**: 2 weeks

---

### Lower Priority

#### Progress Photos

- **Description**: Take and compare before/after photos
- **Technical Considerations**:
  - IndexedDB for image storage (localStorage too small)
  - Privacy: All data stays local
  - Comparison slider UI
  - Photo compression to save space
- **Storage Estimate**: ~2-5MB per photo
- **Estimated Effort**: 1 week

#### Multi-Language Support

- **Description**: Internationalization (i18n)
- **Languages**: Spanish, French, German, Chinese, Japanese
- **Requirements**: react-i18next library, translation files
- **Estimated Effort**: 3-4 days per language

#### Apple Watch / WearOS Integration

- **Description**: Sync with smartwatches
- **Features**:
  - Import step count and active calories
  - Quick food logging from watch
  - Daily summary notifications
- **Requirements**: Platform-specific development
- **Estimated Effort**: 2-3 weeks per platform

#### Voice Input

- **Description**: Log foods by speaking
- **Technical**: Web Speech API (browser native)
- **Example**: "Log two eggs and a slice of toast for breakfast"
- **Estimated Effort**: 2-3 days

---

## Technical Improvements

### Performance

- [ ] Implement virtual scrolling for long food logs
- [ ] Add service worker cache strategies for offline AI fallback
- [ ] Optimize Chart.js bundle with custom builds
- [ ] Add image lazy loading for food photos

### Developer Experience

- [ ] Add TypeScript support
- [ ] Implement unit tests with Jest
- [ ] Add E2E tests with Playwright
- [ ] Set up CI/CD pipeline with GitHub Actions
- [ ] Add Storybook for component documentation

### Analytics & Monitoring

- [ ] Integrate privacy-friendly analytics (Plausible/Fathom)
- [ ] Add error tracking (Sentry)
- [ ] Implement performance monitoring
- [ ] Create admin dashboard for usage stats

---

## API Improvements

### Food Database Expansion

- [ ] Integrate USDA FoodData Central API
- [ ] Add restaurant chain nutrition data (McDonald's, etc.)
- [ ] Include regional/cultural foods database

### AI Enhancements

- [ ] Multi-food parsing ("chicken and rice with broccoli")
- [ ] Portion size estimation from photos
- [ ] Meal suggestions based on remaining macros
- [ ] Weekly meal planning AI

---

## Notes

- All features should maintain offline-first approach where possible
- Privacy-focused: User data stays on device unless explicitly shared
- Features requiring backend should use free tier services initially
- Mobile-first design for all new features

---

_Last updated: February 2026_
