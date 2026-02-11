import React, { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import {
  Card,
  Button,
  Input,
  EmptyState,
  SwipeableItem,
  showToast,
  StaggerContainer,
  StaggerItem,
  CompactMacros,
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
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

function RecipesPage() {
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);

  const loadRecipes = useCallback(async () => {
    setIsLoading(true);
    try {
      const allRecipes = await getAllRecipes();
      setRecipes(allRecipes);
      setFilteredRecipes(allRecipes);
    } catch (error) {
      showToast.error("Failed to load recipes");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  // Filter recipes when search or category changes
  useEffect(() => {
    let filtered = recipes;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((r) => r.category === selectedCategory);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          r.ingredients.some((ing) => ing.name.toLowerCase().includes(query)),
      );
    }

    setFilteredRecipes(filtered);
  }, [recipes, searchQuery, selectedCategory]);

  const handleDeleteRecipe = async (recipe) => {
    try {
      await deleteRecipe(recipe.id);
      setRecipes((prev) => prev.filter((r) => r.id !== recipe.id));
      showToast.success(`Deleted "${recipe.name}"`);
    } catch (error) {
      showToast.error("Failed to delete recipe");
    }
  };

  const handleEditRecipe = (recipe) => {
    setEditingRecipe(recipe);
    setShowBuilder(true);
  };

  const handleLogRecipe = (recipe, servings = 1) => {
    const foodEntry = {
      id: Date.now(),
      name: `${recipe.name} (${servings} serving${servings > 1 ? "s" : ""})`,
      calories: Math.round(recipe.nutritionPerServing.calories * servings),
      protein:
        Math.round(recipe.nutritionPerServing.protein * servings * 10) / 10,
      carbs: Math.round(recipe.nutritionPerServing.carbs * servings * 10) / 10,
      fat: Math.round(recipe.nutritionPerServing.fat * servings * 10) / 10,
      timestamp: new Date().toISOString(),
      mealType: getMealTypeByTime(),
      isRecipe: true,
      recipeId: recipe.id,
    };

    addFoodEntry(foodEntry);
    showToast.success("Recipe logged!", `${recipe.name} added to food log`);
  };

  const handleSaveRecipe = (savedRecipe) => {
    if (editingRecipe) {
      setRecipes((prev) =>
        prev.map((r) => (r.id === savedRecipe.id ? savedRecipe : r)),
      );
    } else {
      setRecipes((prev) => [savedRecipe, ...prev]);
    }
    setShowBuilder(false);
    setEditingRecipe(null);
  };

  const handleCancelBuilder = () => {
    setShowBuilder(false);
    setEditingRecipe(null);
  };

  // Show recipe builder
  if (showBuilder) {
    return (
      <div className="recipes-page">
        <RecipeBuilder
          existingRecipe={editingRecipe}
          onSave={handleSaveRecipe}
          onCancel={handleCancelBuilder}
        />
      </div>
    );
  }

  return (
    <div className="recipes-page">
      {/* Header */}
      <header className="recipes-header">
        <div className="header-content">
          <h1>
            <ChefHat size={28} />
            My Recipes
          </h1>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowBuilder(true)}
          >
            <Plus size={18} />
            New Recipe
          </Button>
        </div>
      </header>

      {/* Search */}
      <div className="recipes-search">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recipes..."
            className="search-input"
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="category-filter">
        <button
          className={`filter-btn ${selectedCategory === "all" ? "active" : ""}`}
          onClick={() => setSelectedCategory("all")}
        >
          <BookOpen size={16} />
          All
        </button>
        {Object.entries(CATEGORY_ICONS).map(([key, Icon]) => (
          <button
            key={key}
            className={`filter-btn ${selectedCategory === key ? "active" : ""}`}
            onClick={() => setSelectedCategory(key)}
          >
            <Icon size={16} />
            {CATEGORY_LABELS[key]}
          </button>
        ))}
      </div>

      {/* Recipes List */}
      <div className="recipes-list">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Loading recipes...</p>
          </div>
        ) : filteredRecipes.length === 0 ? (
          <EmptyState
            icon={<ChefHat />}
            title={
              recipes.length === 0 ? "No recipes yet" : "No matching recipes"
            }
            description={
              recipes.length === 0
                ? "Create your first recipe to quickly log your favorite meals"
                : "Try a different search or category"
            }
            actionLabel={recipes.length === 0 ? "Create Recipe" : undefined}
            onAction={recipes.length === 0 ? () => setShowBuilder(true) : undefined}
          />
        ) : (
          <StaggerContainer className="recipe-grid">
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
    </div>
  );
}

function RecipeCard({ recipe, onLog, onEdit, onDelete }) {
  const [servingsToLog, setServingsToLog] = useState(1);
  const CategoryIcon = CATEGORY_ICONS[recipe.category] || Cookie;

  const handleQuickLog = () => {
    onLog(recipe, servingsToLog);
  };

  return (
    <SwipeableItem onDelete={() => onDelete(recipe)} deleteLabel="Delete">
      <Card variant="elevated" className="recipe-card" hoverable>
        <div className="recipe-card-header">
          <div className="recipe-category-badge">
            <CategoryIcon size={14} />
            {CATEGORY_LABELS[recipe.category]}
          </div>
          <div className="recipe-actions-mini">
            <button
              className="action-btn edit"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(recipe);
              }}
            >
              <Edit3 size={16} />
            </button>
            <button
              className="action-btn delete"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(recipe);
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <h3 className="recipe-name">{recipe.name}</h3>

        <div className="recipe-meta">
          <span className="meta-item">
            {recipe.ingredients.length} ingredient
            {recipe.ingredients.length !== 1 ? "s" : ""}
          </span>
          <span className="meta-divider">•</span>
          <span className="meta-item">
            {recipe.servings} serving{recipe.servings !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="recipe-nutrition">
          <div className="nutrition-main">
            <span className="calories-value">
              {recipe.nutritionPerServing.calories}
            </span>
            <span className="calories-label">cal/serving</span>
          </div>
          <CompactMacros
            protein={recipe.nutritionPerServing.protein}
            carbs={recipe.nutritionPerServing.carbs}
            fat={recipe.nutritionPerServing.fat}
          />
        </div>

        <div className="recipe-log-section">
          <div className="servings-selector">
            <button
              className="servings-btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                setServingsToLog((prev) => Math.max(1, prev - 1));
              }}
              disabled={servingsToLog <= 1}
            >
              -
            </button>
            <span className="servings-count">{servingsToLog}</span>
            <button
              className="servings-btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                setServingsToLog((prev) => prev + 1);
              }}
            >
              +
            </button>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleQuickLog();
            }}
          >
            <UtensilsCrossed size={16} />
            Log Recipe
          </Button>
        </div>
      </Card>
    </SwipeableItem>
  );
}

export default RecipesPage;
