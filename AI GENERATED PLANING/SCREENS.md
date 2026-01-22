# Hawk Fuel - Screen-by-Screen Breakdown

## Screen 1: Welcome / Splash Screen

### Purpose
First impression - introduce the app and get user started

### Layout
```

                             
       Hawk Fuel           
                             
   Your Fitness Companion    
                             
  Track calories, reach      
  your strength &            
  conditioning goals         
                             
   
      Get Started         
   
                             

```

### Elements
- App logo/icon
- App name: "Hawk Fuel"
- Tagline
- Brief description (1-2 sentences)
- **"Get Started" button** (primary action)

### Actions
- Click "Get Started"  Go to Profile Setup screen

---

## Screen 2: Profile Setup

### Purpose
Collect user information to calculate BMR and TDEE

### Layout
```

   Back    Profile Setup    

                             
  Let's calculate your       
  daily calorie needs        
                             
  Age (years)                
  [___________]              
                             
  Gender                     
  ( ) Male  ( ) Female       
                             
  Height                     
  [____] ft [____] in        
                             
  Weight                     
  [___________] lbs          
                             
  Activity Level             
  [Dropdown ]               
   How active are you      
     without exercise?       
                             
   
    Calculate My BMR      
   
                             

```

### Form Fields
1. **Age**: Number input (13-100)
2. **Gender**: Radio buttons (Male/Female)
3. **Height**: Two inputs (feet + inches) OR cm
4. **Weight**: Number input (lbs) with unit toggle option
5. **Activity Level**: Dropdown
   - Sedentary (office job, little activity)
   - Lightly Active (light exercise 1-3 days)
   - Moderately Active (exercise 3-5 days)
   - Very Active (exercise 6-7 days)
   - Extra Active (athlete or physical job)

### Validation
- All fields required
- Age: 13-100
- Height: Reasonable ranges
- Weight: Reasonable ranges

### Actions
- Click "Calculate My BMR"  Show results + Go to Goal Selection screen
- Click "Back"  Return to Welcome screen

---

## Screen 3: BMR & TDEE Results

### Purpose
Show calculated values and explain what they mean

### Layout
```

  Your Calorie Numbers       

                             
   Your BMR                
   
        1,650 cal/day     
   
  Calories burned at rest    
                             
   Maintenance Calories    
   
        2,280 cal/day     
   
  Your TDEE (total daily     
  energy expenditure)        
                             
   What does this mean?    
  Eating 2,280 calories      
  daily will maintain your   
  current weight.            
                             
   
      Set My Goal         
   
                             

```

### Elements
- BMR value (large, prominent)
- Brief BMR explanation
- TDEE/Maintenance calories (large, prominent)
- Brief TDEE explanation
- Info box explaining what these numbers mean
- **"Set My Goal" button** (primary action)

### Actions
- Click "Set My Goal"  Go to Goal Selection screen

---

## Screen 4: Goal Selection

### Purpose
Let user choose their fitness goal and set calorie target

### Layout
```

   Back    Set Your Goal    

                             
  Your maintenance: 2,280    
                             
  What's your goal?          
                             
   
    Maintain Weight     
      2,280 calories      
   
                             
   
    Lose Weight         
      1,780 - 2,030 cal   
   
                             
   
    Gain Weight         
      2,530 - 2,780 cal   
   
                             
  [Selected: Lose Weight]    
                             
  Calorie Deficit            
     
   -500     
     
  -250   -500   -750         
                             
  Your Daily Target: 1,780   
                             
   
     Start Tracking       
   
                             

```

### Elements
- Display maintenance calories at top
- Three goal option cards:
  1. **Maintain Weight**: TDEE ± 0
  2. **Lose Weight**: TDEE - 250 to -500 (recommended)
  3. **Gain Weight**: TDEE + 250 to +500 (recommended)
- When goal selected, show slider:
  - Deficit slider: -250, -500, -750
  - Surplus slider: +250, +500, +750
- **Calculated daily target** shown prominently
- **"Start Tracking" button**

### Actions
- Select goal card  Show slider for that goal
- Adjust slider  Update daily target
- Click "Start Tracking"  Go to Dashboard + save profile
- Click "Back"  Return to BMR results

---

## Screen 5: Main Dashboard (Home)

### Purpose
Central hub - show daily progress and quick actions

### Layout
```

  Hawk Fuel         Settings 

                             
  Today: Monday, Jan 20      
                             
   Daily Goal: 1,780 cal   
                             
  Progress                   
     
      
     
  1,230 / 1,780              
                             
     
    Eaten   Burned   
    1,420      190       
     
                             
  Net Calories: 1,230        
  Remaining: 550 cal         
                             
   On Track                
                             
   
      Add Food          
   
                             
   
      Add Activity      
   
                             
  Today's Log                
    
   Breakfast - 450 cal     
   Running 30min - 190 cal 
   Lunch - 620 cal         
   Snack - 350 cal         
                             

```

### Elements
- **Header**: App name + Settings icon
- **Date**: Current date
- **Daily Goal**: Target calories
- **Progress Bar**: Visual representation (color-coded)
  - Green: Within range
  - Yellow: Close to limit
  - Red: Over limit
- **Current vs Goal**: Numbers shown
- **Two-column summary**:
  - Calories Eaten
  - Calories Burned
- **Net Calories**: Eaten - Burned
- **Remaining**: Goal - Net
- **Status indicator**: "On Track" / "Over Goal" / "Under Goal"
- **Two action buttons**:
  - Add Food (primary)
  - Add Activity (primary)
- **Today's Log**: Scrollable list of entries
  - Food entries with calories
  - Activity entries with duration and calories
  - Each with delete icon ()

### Actions
- Click "Settings"  Go to Settings screen
- Click "Add Food"  Go to Add Food screen
- Click "Add Activity"  Go to Add Activity screen
- Click delete on entry  Remove entry, update totals
- Swipe entry left  Show delete option

---

## Screen 6: Add Food

### Purpose
Quick entry for food/meals

### Layout
```

   Close      Add Food      

                             
  Food Name                  
   
   e.g., Chicken Sandwich 
   
                             
  Meal Type                  
   
   Breakfast             
   
  - Breakfast                
  - Lunch                    
  - Dinner                   
  - Snack                    
                             
  Calories                   
   
   e.g., 450              
   
                             
   
        Add Food          
   
                             
   
         Cancel           
   
                             

```

### Form Fields
1. **Food Name**: Text input (required)
2. **Meal Type**: Dropdown (Breakfast/Lunch/Dinner/Snack)
3. **Calories**: Number input (required, positive)

### Validation
- Food name: Not empty
- Calories: Number > 0

### Actions
- Click "Add Food"  Save entry, return to Dashboard
- Click "Cancel" or "Close"  Return to Dashboard without saving

---

## Screen 7: Add Activity

### Purpose
Log exercise/physical activity

### Layout
```

   Close    Add Activity    

                             
  Activity Type              
   
   Walking               
   
  - Walking (3.5 METs)       
  - Running (8.0 METs)       
  - Basketball (6.5 METs)    
  - Soccer (7.0 METs)        
  - Weight Training (6 METs) 
  - Swimming (6.0 METs)      
  - Cycling (7.5 METs)       
  - Yoga (2.5 METs)          
  - HIIT Training (8 METs)   
  - Sports Practice (5 METs) 
                             
  Duration (minutes)         
   
   30                     
   
                             
   
   Calories Burned:       
        190 cal           
   
                             
   
      Add Activity        
   
                             
   
         Cancel           
   
                             

```

### Form Fields
1. **Activity Type**: Dropdown with preset activities
2. **Duration**: Number input (minutes, required)

### Calculated Display
- **Calories Burned**: Auto-calculated using formula:
  - Calories = MET × weight(kg) × duration(hours)
  - Updates as user types duration

### Preset Activities with MET Values
| Activity | MET Value |
|----------|-----------|
| Walking | 3.5 |
| Running | 8.0 |
| Basketball | 6.5 |
| Soccer | 7.0 |
| Weight Training | 6.0 |
| Swimming | 6.0 |
| Cycling | 7.5 |
| Yoga | 2.5 |
| HIIT Training | 8.0 |
| Sports Practice | 5.0 |

### Validation
- Activity: Must select one
- Duration: Number > 0

### Actions
- Select activity + enter duration  Auto-calculate calories
- Click "Add Activity"  Save entry, return to Dashboard
- Click "Cancel" or "Close"  Return to Dashboard without saving

---

## Screen 8: Settings / Profile

### Purpose
Update user information and goals

### Layout
```

   Back      Settings       

                             
   Your Profile            
    
  Age: 16 years              
  Gender: Male               
  Height: 5'10"              
  Weight: 165 lbs            
  Activity: Moderately Active
                             
   
     Edit Profile         
   
                             
   Your Goal               
    
  Goal: Lose Weight          
  Daily Target: 1,780 cal    
  BMR: 1,650 cal             
  TDEE: 2,280 cal            
                             
   
     Change Goal          
   
                             
   History                 
    
  Last 7 days                
  - Mon: 1,820/1,780       
  - Sun: 1,650/1,780       
  - Sat: 2,100/1,780       
                             
   App Settings            
    
  [ ] Dark Mode              
  Units: Imperial            
                             
   
     Reset All Data       
   
                             

```

### Sections
1. **Profile Summary**
   - Display current values
   - Edit button
2. **Goal Summary**
   - Current goal and calculations
   - Change goal button
3. **History** (optional for v1)
   - Last 7 days overview
4. **App Settings**
   - Dark mode toggle
   - Unit preferences
5. **Data Management**
   - Reset data button (with confirmation)

### Actions
- Click "Edit Profile"  Open edit form (Screen 2 style)
- Click "Change Goal"  Open goal selection (Screen 4)
- Click "Reset All Data"  Confirm  Clear all data
- Click "Back"  Return to Dashboard

---

## Screen Hierarchy

```
Welcome Screen (First time only)
    
Profile Setup
    
BMR/TDEE Results
    
Goal Selection
    

Main Dashboard (Home)  PRIMARY SCREEN
     Add Food
        Back to Dashboard
    
     Add Activity
        Back to Dashboard
    
     Settings
         Edit Profile  Dashboard
         Change Goal  Dashboard
         Back to Dashboard
```

## Mobile Responsiveness

### Screen Sizes
- **Mobile**: 320px - 480px (primary target)
- **Tablet**: 481px - 768px
- **Desktop**: 769px+ (stacked layout maintained)

### Key Responsive Behaviors
- Single column layout on all screens
- Large touch targets (min 44px)
- Bottom navigation for easy thumb reach
- Swipe gestures for delete
- Full-screen modals for forms

## Color System Recommendation

### Progress Indicators
- **Green** (#10b981): On track, good progress
- **Yellow** (#f59e0b): Close to limit, warning
- **Red** (#ef4444): Over/under limit, alert

### UI Elements
- **Primary** (#3b82f6): Action buttons, links
- **Secondary** (#6b7280): Less important elements
- **Background** (#f9fafb): Main background
- **Cards** (#ffffff): Content containers
- **Text** (#111827): Primary text
- **Text Light** (#6b7280): Secondary text
