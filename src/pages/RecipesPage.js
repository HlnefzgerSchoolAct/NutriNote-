/**
 * Recipes Page — M3 Redesign with Tailwind
 * Browse, create, edit, and log custom recipes
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChefHat,
  Plus,
  Search,
  Coffee,
  Sun,
  Moon,
  Cookie,
  Trash2,
  Edit3,
  UtensilsCrossed,
  BookOpen,
  Minus,
} from "lucide-react";
import {
  M3Card,
  M3CardContent,
  M3Button,
  Chip,
  ChipGroup,
  EmptyState,
  SwipeableItem,
  showToast,
  StaggerContainer,
  StaggerItem,
  CompactMacros,
  Main,
  VisuallyHidden,
  useAnnounce,
} from "../components/common";
import RecipeBuilder from "../components/RecipeBuilder";
import { getAllRecipes, deleteRecipe } from "../services/recipeDatabase";
import { addFoodEntry, getMealTypeByTime } from "../utils/localStorage";
import "./RecipesPage.css";

const CATEGORY_ICONS = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
  snack: Cookie,
};

const CATEGORY_LABELS = {
  all: "All",
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

const CATEGORIES = ["all", "breakfast", "lunch", "dinner", "snack"];

function RecipesPage() {
  const [recipes, setRecipes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const announce = useAnnounce();

  // ===== Data Loading =====
  const loadRecipes = useCallback(async () => {
    setIsLoading(true);
    try {
      const allRecipes = await getAllRecipes();
      setRecipes(allRecipes);
    } catch (error) {
      showToast.error("Failed to load recipes");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  // ===== Filtered recipes =====
  const filteredRecipes = useMemo(() => {
    let filtered = recipes;

    if (selectedCategory !== "all") {
      filtered = filtered.filter((r) => r.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          r.ingredients.some((ing) => ing.name.toLowerCase().includes(query)),
      );
    }

    return filtered;
  }, [recipes, searchQuery, selectedCategory]);

  // ===== Handlers =====
  const handleDeleteRecipe = useCallback(
    async (recipe) => {
      try {
        await deleteRecipe(recipe.id);
        setRecipes((prev) => prev.filter((r) => r.id !== recipe.id));
        showToast.success(`Deleted "${recipe.name}"`);
        announce(`Deleted recipe ${recipe.name}`, "assertive");
      } catch (error) {
        showToast.error("Failed to delete recipe");
      }
    },
    [announce],
  );

  const handleEditRecipe = useCallback((recipe) => {
    setEditingRecipe(recipe);
    setShowBuilder(true);
  }, []);

  const handleLogRecipe = useCallback(
    (recipe, servings = 1) => {
      const foodEntry = {
        id: Date.now(),
        name: `${recipe.name} (${servings} serving${servings > 1 ? "s" : ""})`,
        calories: Math.round(recipe.nutritionPerServing.calories * servings),
        protein: Math.round(recipe.nutritionPerServing.protein * servings * 10) / 10,
        carbs: Math.round(recipe.nutritionPerServing.carbs * servings * 10) / 10,
        fat: Math.round(recipe.nutritionPerServing.fat * servings * 10) / 10,
        timestamp: new Date().toISOString(),
        mealType: getMealTypeByTime(),
        isRecipe: true,
        recipeId: recipe.id,
      };

      addFoodEntry(foodEntry);
      showToast.success("Recipe logged!", `${recipe.name} added to food log`);
      announce(`Logged ${recipe.name}, ${foodEntry.calories} calories`, "assertive");
    },
    [announce],
  );

  const handleSaveRecipe = useCallback(
    (savedRecipe) => {
      if (editingRecipe) {
        setRecipes((prev) =>
          prev.map((r) => (r.id === savedRecipe.id ? savedRecipe : r)),
        );
      } else {
        setRecipes((prev) => [savedRecipe, ...prev]);
      }
      setShowBuilder(false);
      setEditingRecipe(null);
    },
    [editingRecipe],
  );

  const handleCancelBuilder = useCallback(() => {
    setShowBuilder(false);
    setEditingRecipe(null);
  }, []);

  // ===== Builder View =====
  if (showBuilder) {
    return (
      <Main className="px-4 pt-6 pb-24 max-w-150 mx-auto md:max-w-210 lg:pb-8 lg:pl-70">
        <RecipeBuilder
          existingRecipe={editingRecipe}
          onSave={handleSaveRecipe}
          onCancel={handleCancelBuilder}
        />
      </Main>
    );
  }

  // ===== Main View =====
  return (
    <Main className="px-4 pt-6 pb-24 max-w-150 mx-auto md:max-w-210 lg:pb-8 lg:pl-70">
      <VisuallyHidden>
        <h1>My Recipes</h1>
      </VisuallyHidden>

      {/* Header */}
      <header className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <ChefHat size={26} className="text-primary" aria-hidden="true" />
          <h2 className="text-headline-sm font-bold text-on-surface m-0" aria-hidden="true">
            My Recipes
          </h2>
        </div>
        <M3Button
          variant="filled"
          size="sm"
          icon={<Plus size={18} />}
          onClick={() => setShowBuilder(true)}
        >
          New Recipe
        </M3Button>
      </header>

      {/* Search */}
      <div className="relative mb-4">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search recipes..."
          className="w-full pl-10 pr-4 py-3 bg-surface-container border border-outline-variant rounded-xl text-body-md text-on-surface outline-none transition-colors duration-150 focus:border-primary placeholder:text-on-surface-variant"
          aria-label="Search recipes"
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none" role="tablist" aria-label="Filter by category">
        {CATEGORIES.map((cat) => {
          const Icon = cat === "all" ? BookOpen : CATEGORY_ICONS[cat];
          return (
            <Chip
              key={cat}
              variant="filter"
              selected={selectedCategory === cat}
              onClick={() => setSelectedCategory(cat)}
              role="tab"
              aria-selected={selectedCategory === cat}
            >
              <Icon size={14} className="mr-1" />
              {CATEGORY_LABELS[cat]}
            </Chip>
          );
        })}
      </div>

      {/* Recipe List */}
      <div className="flex flex-col gap-3">
        {isLoading ? (
          <LoadingState />
        ) : filteredRecipes.length === 0 ? (
          <EmptyState
            icon={<ChefHat />}
            title={recipes.length === 0 ? "No recipes yet" : "No matching recipes"}
            description={
              recipes.length === 0
                ? "Create your first recipe to quickly log your favorite meals"
                : "Try a different search or category"
            }
            actionLabel={recipes.length === 0 ? "Create Recipe" : undefined}
            onAction={recipes.length === 0 ? () => setShowBuilder(true) : undefined}
          />
        ) : (
          <StaggerContainer className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-4">
            {filteredRecipes.map((recipe) => (
              <StaggerItem key={recipe.id}>
                <RecipeCard
                  recipe={recipe}
                  onLog={handleLogRecipe}
                  onEdit={handleEditRecipe}
                  onDelete={handleDeleteRecipe}
                />
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>
    </Main>
  );
}

/* =============================================
   SUB-COMPONENTS
   ============================================= */

/** Loading skeleton */
function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
      <div className="w-10 h-10 border-3 border-surface-container-highest border-t-primary rounded-full animate-spin mb-3" />
      <p className="text-body-sm">Loading recipes...</p>
    </div>
  );
}

/** Single recipe card */
function RecipeCard({ recipe, onLog, onEdit, onDelete }) {
  const [servingsToLog, setServingsToLog] = useState(1);
  const CategoryIcon = CATEGORY_ICONS[recipe.category] || Cookie;

  const handleQuickLog = (e) => {
    e.stopPropagation();
    onLog(recipe, servingsToLog);
  };

  return (
    <SwipeableItem onDelete={() => onDelete(recipe)} deleteLabel="Delete">
      <M3Card variant="elevated" className="recipe-card">
        <M3CardContent>
          {/* Header: category badge + action buttons */}
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-surface-container-high rounded-full text-label-sm text-on-surface-variant">
              <CategoryIcon size={14} />
              {CATEGORY_LABELS[recipe.category]}
            </span>
            <div className="flex gap-1">
              <button
                className="flex items-center justify-center w-8 h-8 bg-transparent border-none rounded-md text-on-surface-variant cursor-pointer transition-colors duration-150 hover:bg-info/10 hover:text-info"
                onClick={(e) => { e.stopPropagation(); onEdit(recipe); }}
                aria-label={`Edit ${recipe.name}`}
              >
                <Edit3 size={16} />
              </button>
              <button
                className="flex items-center justify-center w-8 h-8 bg-transparent border-none rounded-md text-on-surface-variant cursor-pointer transition-colors duration-150 hover:bg-error/10 hover:text-error"
                onClick={(e) => { e.stopPropagation(); onDelete(recipe); }}
                aria-label={`Delete ${recipe.name}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {/* Name */}
          <h3 className="text-title-md font-semibold text-on-surface m-0 mb-2">
            {recipe.name}
          </h3>

          {/* Meta */}
          <p className="flex items-center gap-2 text-label-sm text-on-surface-variant mb-3 m-0">
            <span>
              {recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? "s" : ""}
            </span>
            <span className="text-outline-variant">•</span>
            <span>
              {recipe.servings} serving{recipe.servings !== 1 ? "s" : ""}
            </span>
          </p>

          {/* Nutrition bar */}
          <div className="flex items-center justify-between px-3 py-3 bg-primary/8 rounded-xl mb-3">
            <div className="flex flex-col">
              <span className="text-headline-sm font-bold text-primary tabular-nums">
                {recipe.nutritionPerServing.calories}
              </span>
              <span className="text-label-sm text-on-surface-variant">cal/serving</span>
            </div>
            <CompactMacros
              protein={recipe.nutritionPerServing.protein}
              carbs={recipe.nutritionPerServing.carbs}
              fat={recipe.nutritionPerServing.fat}
            />
          </div>

          {/* Log section */}
          <div className="flex items-center justify-between pt-3 border-t border-outline-variant flex-wrap gap-3">
            {/* Servings stepper */}
            <div className="flex items-center gap-2">
              <button
                className="flex items-center justify-center w-7 h-7 bg-surface-container-high border border-outline-variant rounded-full text-on-surface cursor-pointer transition-colors duration-150 hover:border-primary hover:bg-surface-container-highest disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={(e) => {
                  e.stopPropagation();
                  setServingsToLog((prev) => Math.max(1, prev - 1));
                }}
                disabled={servingsToLog <= 1}
                aria-label="Decrease servings"
              >
                <Minus size={14} />
              </button>
              <span className="text-body-md font-semibold text-on-surface min-w-6 text-center tabular-nums">
                {servingsToLog}
              </span>
              <button
                className="flex items-center justify-center w-7 h-7 bg-surface-container-high border border-outline-variant rounded-full text-on-surface cursor-pointer transition-colors duration-150 hover:border-primary hover:bg-surface-container-highest"
                onClick={(e) => {
                  e.stopPropagation();
                  setServingsToLog((prev) => prev + 1);
                }}
                aria-label="Increase servings"
              >
                <Plus size={14} />
              </button>
            </div>

            <M3Button
              variant="filled"
              size="sm"
              icon={<UtensilsCrossed size={16} />}
              onClick={handleQuickLog}
            >
              Log Recipe
            </M3Button>
          </div>
        </M3CardContent>
      </M3Card>
    </SwipeableItem>
  );
}

export default RecipesPage;
