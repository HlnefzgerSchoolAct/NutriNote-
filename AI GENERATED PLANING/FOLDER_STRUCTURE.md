#  Hawk Fuel - Complete Folder Structure

```
Hawk Fuel/

  public/                          # Static files (not processed by React)
   
     index.html                   # Main HTML file (entry point for browser)
     manifest.json                # PWA configuration (icons, colors, name)
     robots.txt                   # Search engine crawling rules
     favicon.ico                  # Browser tab icon (16x16, 32x32)
     logo192.png                  # PWA icon for Android (192x192)
     logo512.png                  # PWA icon for Android (512x512)

  src/                             # Source code (all React code goes here)
   
     components/                  # Reusable React components
      
        UserProfile.js           # Component: User info input form
         - Collects age, gender, height, weight
         - Handles activity level selection
         - Manages goal setting
      
        UserProfile.css          # Styles for UserProfile component
         - Form styling
         - Input fields design
         - Button styles
      
        ActivityTracker.js       # Component: Activity logging
         - Displays 6 activity cards
         - Captures minutes per activity
         - MET values for each activity
      
        ActivityTracker.css      # Styles for ActivityTracker
         - Card grid layout
         - Activity card design
         - Emoji and badge styling
      
        Results.js               # Component: Calculation results display
         - BMR calculation
         - TDEE calculation
         - Activity calories breakdown
         - Daily summary
      
        Results.css              # Styles for Results component
          - Result cards design
          - Big number displays
          - Summary section styling
   
     App.js                       # Main application component
      - Top-level component
      - State management (userProfile, activities, currentStep)
      - Component orchestration
      - Step progression logic
   
     App.css                      # Styles for main App component
      - Header styling
      - Progress bar design
      - Footer styling
      - Container layout
   
     index.js                     # React entry point
      - Renders App component
      - Registers service worker
      - Initializes React root
   
     index.css                    # Global styles
      - CSS reset
      - Body background gradient
      - Font family definitions
   
     serviceWorkerRegistration.js # PWA service worker setup
      - Enables offline functionality
      - Caches app resources
      - Updates management
   
     reportWebVitals.js           # Performance monitoring
      - Measures load times
      - Tracks user interactions
      - Reports performance metrics
   
     App.test.js                  # Tests for App component
      - Unit tests
      - Component rendering tests
   
     setupTests.js                # Test configuration
       - Jest configuration
       - Testing library setup

  node_modules/                    # Installed packages (auto-generated)
    [Hundreds of packages]          # Don't edit this folder!

  package.json                     # Project configuration
   - Project name and version
   - Dependencies list
   - Scripts (start, build, test)
   - Browser compatibility settings

  package-lock.json                # Locked dependency versions (auto-generated)
   - Ensures consistent installs
   - Don't edit manually

  .gitignore                       # Git ignore rules
   - Tells Git what NOT to track
   - Excludes node_modules, build, etc.

  README.md                        # Main project documentation
   - Setup instructions
   - How to run the project
   - Features list
   - Troubleshooting guide

  WINDOWS_SETUP.md                 # Windows-specific setup guide
   - Step-by-step for beginners
   - Common Windows issues
   - Terminal commands

  FEATURE_LIST.md                  # Detailed feature documentation
   - All app features
   - Activity levels
   - MET values

  FORMULAS.md                      # Calculation formulas
   - BMR formulas (male/female)
   - TDEE calculations
   - MET-based calorie burn
   - Example calculations

  MET_SYSTEM_GUIDE.md              # MET system guide for students
   - What MET values are
   - Example calculations
   - Practice problems

  UI_DESIGN.md                     # UI design documentation

  USER_FLOW.md                     # User flow documentation

  SCREENS.md                       # Screen descriptions

  LICENSE                          # License information

  activity-calories.html           # Standalone demo calculator
    - No React required
    - Pure HTML/CSS/JavaScript
    - MET calculator demo

```

---

##  File Explanations

### What Each Folder Does:

#### `public/` - Static Assets
- Files here are served as-is, not processed by React
- HTML, icons, manifest, robots.txt
- **Don't** put JavaScript or CSS here (use `src/` instead)

#### `src/` - React Source Code
- All your React components and logic
- Gets compiled and bundled by React Scripts
- **This is where you code!**

#### `src/components/` - Reusable Components
- Self-contained UI pieces
- Each component has its own .js and .css file
- Can be imported and used anywhere

#### `node_modules/` - Dependencies
- Automatically created by `npm install`
- Contains all installed packages
- **Never edit files here!**
- **Don't commit to Git** (it's huge!)

---

##  Quick File Reference

### Files You'll Edit Often:

| File | Purpose | When to Edit |
|------|---------|-------------|
| `src/App.js` | Main app logic | Adding new pages/steps |
| `src/components/UserProfile.js` | User form | Changing input fields |
| `src/components/ActivityTracker.js` | Activity selection | Adding/removing activities |
| `src/components/Results.js` | Results display | Changing calculations |
| `*.css` files | Styling | Changing colors, layout |

### Files You'll Rarely Edit:

| File | Purpose | When to Edit |
|------|---------|-------------|
| `public/index.html` | HTML template | Changing page title, meta tags |
| `public/manifest.json` | PWA config | Changing app name, colors |
| `package.json` | Dependencies | Adding new packages |
| `src/index.js` | React entry | Almost never |

### Files You Should Never Edit:

| File | Purpose | Why Not? |
|------|---------|----------|
| `package-lock.json` | Dependency lock | Auto-generated |
| `node_modules/*` | Installed packages | Auto-generated |

---

##  How Files Connect

```
Browser Request
     
public/index.html (Loads)
     
<div id="root"></div> (Empty container)
     
src/index.js (Executed)
     
ReactDOM.render(<App />) (Renders App component)
     
src/App.js (Main component)
     
Renders: UserProfile OR ActivityTracker OR Results
     
Each component loads its .css file
     
Final webpage displayed
```

---

##  After Running `npm install`

Your folder will have additional files:

```
Hawk Fuel/
 node_modules/         NEW! (very large folder)
 package-lock.json     NEW! (auto-generated)
 ... (all other files remain the same)
```

---

##  After Running `npm run build`

A new folder appears:

```
Hawk Fuel/
 build/               NEW! (production-ready files)
    static/
       css/
       js/
       media/
    index.html
    manifest.json
    ... (optimized files)
 ... (all other files remain)
```

**This `build/` folder is what you deploy to production!**

---

##  Component File Naming Convention

Each component follows this pattern:

```
ComponentName.js      The component logic
ComponentName.css     The component styles
```

Example:
```
UserProfile.js        Component
UserProfile.css       Styles for that component
```

**Why?** Keeps code organized and maintainable.

---

##  Recommended VS Code Extensions

Install these for better development:

1. **ES7+ React/Redux/React-Native snippets**
   - Quick React component generation
   
2. **Prettier - Code formatter**
   - Auto-formats your code
   
3. **Auto Rename Tag**
   - Automatically renames paired HTML/JSX tags
   
4. **Path Intellisense**
   - Autocompletes file paths
   
5. **Color Highlight**
   - Shows color previews in CSS

---

##  File Size Reference

Typical sizes after setup:

```
Hawk Fuel/
 node_modules/     ~300 MB (varies)
 src/              ~50 KB
 public/           ~10 KB (without images)
 package.json      ~1 KB
 README.md         ~15 KB
```

After build:
```
build/               ~500 KB - 2 MB (optimized)
```

---

##  Checklist: Required Files

Before running `npm start`, ensure these exist:

-  package.json
-  public/index.html
-  public/manifest.json
-  src/index.js
-  src/App.js
-  src/index.css
-  src/App.css

All other files are optional but recommended!

---

##  Next Steps

1. Open VS Code
2. Open Hawk Fuel folder
3. Open terminal (`Ctrl + backtick`)
4. Run: `npm install`
5. Run: `npm start`
6. Start editing files in `src/`!

---

Happy coding! 
