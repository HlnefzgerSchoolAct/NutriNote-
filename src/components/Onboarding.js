import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  Target,
  TrendingDown,
  Scale,
  Heart,
  Zap,
  Dumbbell,
  Flame,
  User,
  Activity,
  Utensils,
} from 'lucide-react';
import './Onboarding.css';

/**
 * Enhanced Onboarding Flow Component
 * 
 * Multi-step wizard for new user setup with:
 * - Welcome screen
 * - Goal selection
 * - Personal info (age, height, weight)
 * - Activity level
 * - Summary with calculated targets
 */

// Goal options
const GOALS = [
  {
    id: 'lose',
    title: 'Lose Weight',
    description: 'Create a calorie deficit to lose weight safely',
    icon: TrendingDown
  },
  {
    id: 'maintain',
    title: 'Maintain Weight',
    description: 'Keep your current weight and stay healthy',
    icon: Scale
  },
  {
    id: 'gain',
    title: 'Build Muscle',
    description: 'Gain lean muscle with a calorie surplus',
    icon: Dumbbell
  },
  {
    id: 'health',
    title: 'Improve Health',
    description: 'Focus on nutrition quality and balance',
    icon: Heart
  }
];

// Activity level options
const ACTIVITY_LEVELS = [
  {
    id: 'sedentary',
    label: 'Sedentary',
    description: 'Little or no exercise',
    icon: User,
    multiplier: 1.2
  },
  {
    id: 'light',
    label: 'Light',
    description: 'Exercise 1-3 days/week',
    icon: Activity,
    multiplier: 1.375
  },
  {
    id: 'moderate',
    label: 'Moderate',
    description: 'Exercise 3-5 days/week',
    icon: Zap,
    multiplier: 1.55
  },
  {
    id: 'active',
    label: 'Active',
    description: 'Exercise 6-7 days/week',
    icon: Flame,
    multiplier: 1.725
  }
];

// Calculate BMR using Mifflin-St Jeor
const calculateBMR = (weight, height, age, sex) => {
  if (sex === 'female') {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
  return 10 * weight + 6.25 * height - 5 * age + 5;
};

// Calculate daily calories based on goal
const calculateCalories = (bmr, activityLevel, goal) => {
  const activity = ACTIVITY_LEVELS.find(a => a.id === activityLevel);
  const tdee = bmr * (activity?.multiplier || 1.2);
  
  switch (goal) {
    case 'lose':
      return Math.round(tdee - 500); // 0.5kg/week deficit
    case 'gain':
      return Math.round(tdee + 300); // Lean bulk surplus
    default:
      return Math.round(tdee);
  }
};

// Calculate macros based on goal
const calculateMacros = (calories, goal) => {
  let proteinRatio, carbRatio, fatRatio;
  
  switch (goal) {
    case 'lose':
      proteinRatio = 0.35; // Higher protein for satiety
      fatRatio = 0.30;
      carbRatio = 0.35;
      break;
    case 'gain':
      proteinRatio = 0.30;
      fatRatio = 0.25;
      carbRatio = 0.45; // More carbs for muscle
      break;
    default:
      proteinRatio = 0.25;
      fatRatio = 0.30;
      carbRatio = 0.45;
  }
  
  return {
    protein: Math.round((calories * proteinRatio) / 4), // 4 cal/g
    carbs: Math.round((calories * carbRatio) / 4),
    fat: Math.round((calories * fatRatio) / 9) // 9 cal/g
  };
};

/**
 * Onboarding Component
 */
const Onboarding = ({
  onComplete,
  onSkip,
  initialStep = 0
}) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [exitingStep, setExitingStep] = useState(null);
  const [formData, setFormData] = useState({
    goal: null,
    sex: null,
    age: '',
    height: '',
    weight: '',
    targetWeight: '',
    activityLevel: null,
    name: ''
  });

  const steps = useMemo(() => ['welcome', 'goal', 'info', 'activity', 'summary'], []);
  const totalSteps = steps.length;
  // eslint-disable-next-line no-unused-vars
  const _progress = ((currentStep + 1) / totalSteps) * 100;

  const updateFormData = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const goNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setExitingStep(currentStep);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setExitingStep(null);
      }, 200);
    }
  }, [currentStep, totalSteps]);

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      setExitingStep(currentStep);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setExitingStep(null);
      }, 200);
    }
  }, [currentStep]);

  const handleComplete = useCallback(() => {
    const bmr = calculateBMR(
      parseFloat(formData.weight) || 70,
      parseFloat(formData.height) || 170,
      parseInt(formData.age) || 30,
      formData.sex || 'male'
    );
    
    const calories = calculateCalories(bmr, formData.activityLevel, formData.goal);
    const macros = calculateMacros(calories, formData.goal);
    
    onComplete?.({
      ...formData,
      calorieGoal: calories,
      macroGoals: macros
    });
  }, [formData, onComplete]);

  // Calculate estimated values for summary
  const calculatedValues = useMemo(() => {
    const bmr = calculateBMR(
      parseFloat(formData.weight) || 70,
      parseFloat(formData.height) || 170,
      parseInt(formData.age) || 30,
      formData.sex || 'male'
    );
    
    const calories = calculateCalories(bmr, formData.activityLevel, formData.goal);
    const macros = calculateMacros(calories, formData.goal);
    
    return { calories, macros };
  }, [formData]);

  // Step validation
  const canProceed = useMemo(() => {
    switch (steps[currentStep]) {
      case 'goal':
        return !!formData.goal;
      case 'info':
        return formData.sex && formData.age && formData.height && formData.weight;
      case 'activity':
        return !!formData.activityLevel;
      default:
        return true;
    }
  }, [currentStep, formData, steps]);

  const renderStep = () => {
    const step = steps[currentStep];
    const isExiting = exitingStep === currentStep;
    
    switch (step) {
      case 'welcome':
        return (
          <WelcomeStep 
            isExiting={isExiting}
            name={formData.name}
            onNameChange={(name) => updateFormData('name', name)}
          />
        );
      case 'goal':
        return (
          <GoalStep 
            isExiting={isExiting}
            selected={formData.goal}
            onSelect={(goal) => updateFormData('goal', goal)}
          />
        );
      case 'info':
        return (
          <InfoStep 
            isExiting={isExiting}
            data={formData}
            onChange={updateFormData}
          />
        );
      case 'activity':
        return (
          <ActivityStep 
            isExiting={isExiting}
            selected={formData.activityLevel}
            onSelect={(level) => updateFormData('activityLevel', level)}
          />
        );
      case 'summary':
        return (
          <SummaryStep 
            isExiting={isExiting}
            data={formData}
            calculated={calculatedValues}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="m3-onboarding">
      <div className="m3-onboarding__container">
        {/* Header */}
        <div className="m3-onboarding__header">
          <button 
            className="m3-onboarding__back"
            onClick={goBack}
            disabled={currentStep === 0}
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </button>
          
          {currentStep < totalSteps - 1 && (
            <button 
              className="m3-onboarding__skip"
              onClick={onSkip}
            >
              Skip
            </button>
          )}
        </div>

        {/* Progress */}
        <div className="m3-onboarding__progress">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`m3-onboarding__step-dot ${
                index === currentStep ? 'm3-onboarding__step-dot--active' : ''
              } ${index < currentStep ? 'm3-onboarding__step-dot--completed' : ''}`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="m3-onboarding__content">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="m3-onboarding__footer">
          <div className="m3-onboarding__actions">
            {currentStep === totalSteps - 1 ? (
              <button 
                className="m3-onboarding__btn m3-onboarding__btn--primary"
                onClick={handleComplete}
              >
                Get Started
              </button>
            ) : (
              <button 
                className="m3-onboarding__btn m3-onboarding__btn--primary"
                onClick={goNext}
                disabled={!canProceed}
              >
                Continue
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ===== Step Components =====

const WelcomeStep = ({ isExiting, name, onNameChange }) => (
  <div className={`m3-onboarding__step ${isExiting ? 'm3-onboarding__step--exiting' : ''}`}>
    <div className="m3-onboarding__illustration">
      <div className="m3-onboarding__illustration-container">
        <div className="m3-onboarding__illustration-bg" />
        <Utensils className="m3-onboarding__illustration-icon" size={80} />
      </div>
    </div>
    
    <h1 className="m3-onboarding__title">Welcome to NutriNote+</h1>
    <p className="m3-onboarding__description">
      Track your nutrition, reach your goals, and build healthy habits.
      Let&apos;s personalize your experience.
    </p>
    
    <div className="m3-onboarding__form">
      <div className="m3-onboarding__form-group">
        <label className="m3-onboarding__form-label">What should we call you?</label>
        <input
          type="text"
          className="m3-text-field__input"
          placeholder="Your name (optional)"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          style={{
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid var(--m3-outline-variant)',
            background: 'var(--m3-surface-container)',
            fontSize: '16px'
          }}
        />
      </div>
    </div>
  </div>
);

const GoalStep = ({ isExiting, selected, onSelect }) => (
  <div className={`m3-onboarding__step ${isExiting ? 'm3-onboarding__step--exiting' : ''}`}>
    <h1 className="m3-onboarding__title">What&apos;s your goal?</h1>
    <p className="m3-onboarding__description">
      We&apos;ll customize your daily targets based on your goal.
    </p>
    
    <div className="m3-onboarding__goals">
      {GOALS.map(goal => {
        const Icon = goal.icon;
        const isSelected = selected === goal.id;
        
        return (
          <button
            key={goal.id}
            className={`m3-onboarding__goal ${isSelected ? 'm3-onboarding__goal--selected' : ''}`}
            onClick={() => onSelect(goal.id)}
          >
            <div className="m3-onboarding__goal-icon">
              <Icon size={28} />
            </div>
            <div className="m3-onboarding__goal-content">
              <h3 className="m3-onboarding__goal-title">{goal.title}</h3>
              <p className="m3-onboarding__goal-description">{goal.description}</p>
            </div>
            <div className="m3-onboarding__goal-check">
              {isSelected && <Check size={16} />}
            </div>
          </button>
        );
      })}
    </div>
  </div>
);

const InfoStep = ({ isExiting, data, onChange }) => (
  <div className={`m3-onboarding__step ${isExiting ? 'm3-onboarding__step--exiting' : ''}`}>
    <h1 className="m3-onboarding__title">Tell us about yourself</h1>
    <p className="m3-onboarding__description">
      This helps us calculate your daily calorie needs.
    </p>
    
    <div className="m3-onboarding__form">
      {/* Sex selection */}
      <div className="m3-onboarding__form-group">
        <label className="m3-onboarding__form-label">Sex</label>
        <div className="m3-onboarding__selections" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          {['male', 'female'].map(sex => (
            <button
              key={sex}
              className={`m3-onboarding__selection ${data.sex === sex ? 'm3-onboarding__selection--selected' : ''}`}
              onClick={() => onChange('sex', sex)}
            >
              <span className="m3-onboarding__selection-label" style={{ textTransform: 'capitalize' }}>
                {sex}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Age */}
      <div className="m3-onboarding__form-group">
        <label className="m3-onboarding__form-label">Age</label>
        <input
          type="number"
          inputMode="numeric"
          placeholder="Years"
          value={data.age}
          onChange={(e) => onChange('age', e.target.value)}
          min={13}
          max={120}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid var(--m3-outline-variant)',
            background: 'var(--m3-surface-container)',
            fontSize: '16px'
          }}
        />
      </div>

      {/* Height & Weight */}
      <div className="m3-onboarding__form-row">
        <div className="m3-onboarding__form-group">
          <label className="m3-onboarding__form-label">Height (cm)</label>
          <input
            type="number"
            inputMode="decimal"
            placeholder="170"
            value={data.height}
            onChange={(e) => onChange('height', e.target.value)}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid var(--m3-outline-variant)',
              background: 'var(--m3-surface-container)',
              fontSize: '16px'
            }}
          />
        </div>
        <div className="m3-onboarding__form-group">
          <label className="m3-onboarding__form-label">Weight (kg)</label>
          <input
            type="number"
            inputMode="decimal"
            placeholder="70"
            value={data.weight}
            onChange={(e) => onChange('weight', e.target.value)}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid var(--m3-outline-variant)',
              background: 'var(--m3-surface-container)',
              fontSize: '16px'
            }}
          />
        </div>
      </div>
    </div>
  </div>
);

const ActivityStep = ({ isExiting, selected, onSelect }) => (
  <div className={`m3-onboarding__step ${isExiting ? 'm3-onboarding__step--exiting' : ''}`}>
    <h1 className="m3-onboarding__title">Activity Level</h1>
    <p className="m3-onboarding__description">
      How active are you on a typical week?
    </p>
    
    <div className="m3-onboarding__selections">
      {ACTIVITY_LEVELS.map(level => {
        const Icon = level.icon;
        const isSelected = selected === level.id;
        
        return (
          <button
            key={level.id}
            className={`m3-onboarding__selection ${isSelected ? 'm3-onboarding__selection--selected' : ''}`}
            onClick={() => onSelect(level.id)}
          >
            <div className="m3-onboarding__selection-icon">
              <Icon size={24} />
            </div>
            <span className="m3-onboarding__selection-label">{level.label}</span>
            <span className="m3-onboarding__selection-description">{level.description}</span>
          </button>
        );
      })}
    </div>
  </div>
);

const SummaryStep = ({ isExiting, data, calculated }) => {
  const goalLabel = GOALS.find(g => g.id === data.goal)?.title || 'Stay Healthy';
  
  return (
    <div className={`m3-onboarding__step ${isExiting ? 'm3-onboarding__step--exiting' : ''}`}>
      <div className="m3-onboarding__illustration">
        <div className="m3-onboarding__illustration-container">
          <div className="m3-onboarding__illustration-bg" />
          <Target className="m3-onboarding__illustration-icon" size={80} />
        </div>
      </div>
      
      <h1 className="m3-onboarding__title">You&apos;re all set!</h1>
      <p className="m3-onboarding__description">
        Here are your personalized daily targets to {goalLabel.toLowerCase()}.
      </p>
      
      <div className="m3-onboarding__summary">
        <div className="m3-onboarding__summary-card">
          <div className="m3-onboarding__summary-label">Daily Calorie Goal</div>
          <div className="m3-onboarding__summary-value">
            {calculated.calories.toLocaleString()} kcal
          </div>
        </div>
        
        <div className="m3-onboarding__summary-grid">
          <div className="m3-onboarding__summary-item">
            <div className="m3-onboarding__summary-label">Protein</div>
            <div className="m3-onboarding__summary-value" style={{ fontSize: '18px' }}>
              {calculated.macros.protein}g
            </div>
          </div>
          <div className="m3-onboarding__summary-item">
            <div className="m3-onboarding__summary-label">Carbs</div>
            <div className="m3-onboarding__summary-value" style={{ fontSize: '18px' }}>
              {calculated.macros.carbs}g
            </div>
          </div>
          <div className="m3-onboarding__summary-item">
            <div className="m3-onboarding__summary-label">Fat</div>
            <div className="m3-onboarding__summary-value" style={{ fontSize: '18px' }}>
              {calculated.macros.fat}g
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
