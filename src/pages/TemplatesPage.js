import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutTemplate,
  Plus,
  Search,
  Scale,
  Dumbbell,
  Target,
  Tag,
  Trash2,
  Edit3,
  Copy,
  Download,
  Upload,
  Play,
  ChevronDown,
  ChevronUp,
  Coffee,
  Sun,
  Moon,
  Cookie,
  X,
  Calendar,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  Button,
  Input,
  EmptyState,
  showToast,
  StaggerContainer,
  StaggerItem,
  CompactMacros,
} from "../components/common";
import TemplateBuilder from "../components/TemplateBuilder";
import {
  getAllTemplates,
  deleteTemplate,
  saveTemplate,
  duplicateTemplate,
  exportTemplate,
  importTemplates,
  createTemplateFromMeals,
  initTemplateDB,
} from "../services/templateDatabase";
import {
  addFoodEntry,
  getMealTypeByTime,
  getYesterdaysFoodLog,
} from "../utils/localStorage";
import { devLog } from "../utils/devLog";
import {
  TEMPLATE_CATEGORIES,
  prebuiltTemplates,
  setGetAllTemplates,
} from "../data/templates";
import "./TemplatesPage.css";

const CATEGORY_ICONS = {
  weight_loss: Scale,
  muscle_gain: Dumbbell,
  maintenance: Target,
  custom: Tag,
};

const MEAL_ICONS = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
  snack: Cookie,
};

function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [expandedTemplate, setExpandedTemplate] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJson, setImportJson] = useState("");

  // Initialize prebuilt templates
  const initializeTemplates = useCallback(async () => {
    try {
      await initTemplateDB();
      setGetAllTemplates(getAllTemplates);

      // Check if prebuilt templates exist, if not add them
      const existingTemplates = await getAllTemplates();
      const existingIds = new Set(existingTemplates.map((t) => t.id));

      let addedCount = 0;
      for (const template of prebuiltTemplates) {
        if (!existingIds.has(template.id)) {
          await saveTemplate(template);
          addedCount++;
        }
      }

      if (addedCount > 0) {
        devLog.log(`Added ${addedCount} prebuilt templates`);
      }
    } catch (error) {
      console.error("Failed to initialize templates:", error);
    }
  }, []);

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      await initializeTemplates();
      const allTemplates = await getAllTemplates();
      setTemplates(allTemplates);
      setFilteredTemplates(allTemplates);
    } catch (error) {
      showToast.error("Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  }, [initializeTemplates]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // Filter templates when search or category changes
  useEffect(() => {
    let filtered = templates;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(query)),
      );
    }

    setFilteredTemplates(filtered);
  }, [templates, searchQuery, selectedCategory]);

  const handleDeleteTemplate = async (template) => {
    if (template.isPrebuilt) {
      showToast.error("Cannot delete prebuilt templates");
      return;
    }

    try {
      await deleteTemplate(template.id);
      setTemplates((prev) => prev.filter((t) => t.id !== template.id));
      showToast.success(`Deleted "${template.name}"`);
    } catch (error) {
      showToast.error("Failed to delete template");
    }
  };

  const handleEditTemplate = (template) => {
    if (template.isPrebuilt) {
      // Duplicate prebuilt template for editing
      handleDuplicateTemplate(template, true);
      return;
    }
    setEditingTemplate(template);
    setShowBuilder(true);
  };

  const handleDuplicateTemplate = async (template, openForEdit = false) => {
    try {
      const duplicated = await duplicateTemplate(template.id);
      setTemplates((prev) => [duplicated, ...prev]);
      showToast.success(`Created copy of "${template.name}"`);

      if (openForEdit) {
        setEditingTemplate(duplicated);
        setShowBuilder(true);
      }
    } catch (error) {
      showToast.error("Failed to duplicate template");
    }
  };

  const handleLogTemplate = (template) => {
    // Log all foods from all meals in the template
    let totalFoods = 0;

    template.meals.forEach((meal) => {
      meal.foods.forEach((food) => {
        const foodEntry = {
          id: Date.now() + Math.random(),
          name: food.name,
          calories: food.calories,
          protein: food.protein || 0,
          carbs: food.carbs || 0,
          fat: food.fat || 0,
          timestamp: new Date().toISOString(),
          mealType: meal.mealType || getMealTypeByTime(),
          fromTemplate: template.name,
        };
        addFoodEntry(foodEntry);
        totalFoods++;
      });
    });

    showToast.success(
      "Template logged!",
      `${totalFoods} foods added from "${template.name}"`,
    );
    setExpandedTemplate(null);
  };

  const handleLogMeal = (template, meal) => {
    meal.foods.forEach((food) => {
      const foodEntry = {
        id: Date.now() + Math.random(),
        name: food.name,
        calories: food.calories,
        protein: food.protein || 0,
        carbs: food.carbs || 0,
        fat: food.fat || 0,
        timestamp: new Date().toISOString(),
        mealType: meal.mealType,
        fromTemplate: template.name,
      };
      addFoodEntry(foodEntry);
    });

    showToast.success(
      `Logged ${meal.name}`,
      `${meal.foods.length} foods added`,
    );
  };

  const handleExportTemplate = async (template) => {
    try {
      const jsonString = await exportTemplate(template.id);

      // Create and download file
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${template.name.replace(/\s+/g, "_")}_template.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast.success("Template exported!");
    } catch (error) {
      showToast.error("Failed to export template");
    }
  };

  const handleImportTemplates = async () => {
    if (!importJson.trim()) {
      showToast.error("Please paste template JSON");
      return;
    }

    try {
      const imported = await importTemplates(importJson);
      setTemplates((prev) => [...imported, ...prev]);
      showToast.success(`Imported ${imported.length} template(s)!`);
      setShowImportModal(false);
      setImportJson("");
    } catch (error) {
      showToast.error("Invalid template format");
    }
  };

  const handleRepeatYesterday = async () => {
    const yesterdayFoods = getYesterdaysFoodLog();

    if (!yesterdayFoods || yesterdayFoods.length === 0) {
      showToast.error("No meals logged yesterday");
      return;
    }

    yesterdayFoods.forEach((food) => {
      const foodEntry = {
        id: Date.now() + Math.random(),
        name: food.name,
        calories: food.calories,
        protein: food.protein || 0,
        carbs: food.carbs || 0,
        fat: food.fat || 0,
        timestamp: new Date().toISOString(),
        mealType: food.mealType || getMealTypeByTime(),
        repeatedFrom: "yesterday",
      };
      addFoodEntry(foodEntry);
    });

    showToast.success(
      "Yesterday's meals repeated!",
      `${yesterdayFoods.length} foods added`,
    );
  };

  const handleCreateFromYesterday = async () => {
    const yesterdayFoods = getYesterdaysFoodLog();

    if (!yesterdayFoods || yesterdayFoods.length === 0) {
      showToast.error("No meals logged yesterday");
      return;
    }

    try {
      const template = await createTemplateFromMeals(
        yesterdayFoods,
        `Yesterday's Meals (${new Date().toLocaleDateString()})`,
      );
      setTemplates((prev) => [template, ...prev]);
      showToast.success("Template created from yesterday's meals!");
    } catch (error) {
      showToast.error("Failed to create template");
    }
  };

  const handleSaveTemplate = (savedTemplate) => {
    if (editingTemplate) {
      setTemplates((prev) =>
        prev.map((t) => (t.id === savedTemplate.id ? savedTemplate : t)),
      );
    } else {
      setTemplates((prev) => [savedTemplate, ...prev]);
    }
    setShowBuilder(false);
    setEditingTemplate(null);
  };

  const handleCancelBuilder = () => {
    setShowBuilder(false);
    setEditingTemplate(null);
  };

  // Show template builder
  if (showBuilder) {
    return (
      <div className="templates-page">
        <TemplateBuilder
          existingTemplate={editingTemplate}
          onSave={handleSaveTemplate}
          onCancel={handleCancelBuilder}
        />
      </div>
    );
  }

  return (
    <div className="templates-page">
      {/* Header */}
      <header className="templates-header">
        <div className="header-content">
          <h1>
            <LayoutTemplate size={28} />
            Meal Templates
          </h1>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowBuilder(true)}
          >
            <Plus size={18} />
            New Template
          </Button>
        </div>
      </header>

      {/* Quick Actions */}
      <div className="quick-actions">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleRepeatYesterday}
          className="quick-action-btn"
        >
          <RefreshCw size={16} />
          Repeat Yesterday
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleCreateFromYesterday}
          className="quick-action-btn"
        >
          <Calendar size={16} />
          Save Yesterday as Template
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowImportModal(true)}
          className="quick-action-btn"
        >
          <Upload size={16} />
          Import
        </Button>
      </div>

      {/* Search */}
      <div className="templates-search">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
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
          <LayoutTemplate size={16} />
          All
        </button>
        {Object.entries(TEMPLATE_CATEGORIES).map(([key, cat]) => {
          const Icon = CATEGORY_ICONS[key];
          return (
            <button
              key={key}
              className={`filter-btn ${selectedCategory === key ? "active" : ""}`}
              onClick={() => setSelectedCategory(key)}
              style={{ "--filter-color": cat.color }}
            >
              <Icon size={16} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Templates List */}
      <div className="templates-list">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>Loading templates...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <EmptyState
            icon={<LayoutTemplate />}
            title="No templates found"
            description={
              searchQuery
                ? "Try a different search term"
                : "Create your first meal template to get started"
            }
            action={
              <Button variant="primary" onClick={() => setShowBuilder(true)}>
                <Plus size={18} />
                Create Template
              </Button>
            }
          />
        ) : (
          <StaggerContainer className="template-grid">
            {filteredTemplates.map((template) => {
              const CategoryIcon = CATEGORY_ICONS[template.category] || Tag;
              const isExpanded = expandedTemplate === template.id;
              const categoryConfig = TEMPLATE_CATEGORIES[template.category];

              return (
                <StaggerItem key={template.id}>
                  <Card
                    className={`template-card ${isExpanded ? "expanded" : ""} ${template.isPrebuilt ? "prebuilt" : ""}`}
                  >
                    {/* Template Header */}
                    <div
                      className="template-header"
                      onClick={() =>
                        setExpandedTemplate(isExpanded ? null : template.id)
                      }
                    >
                      <div className="template-info">
                        <div
                          className="category-badge"
                          style={{
                            backgroundColor: categoryConfig?.color || "#9b59b6",
                          }}
                        >
                          <CategoryIcon size={14} />
                        </div>
                        <div className="template-details">
                          <h3 className="template-name">
                            {template.name}
                            {template.isPrebuilt && (
                              <span className="prebuilt-badge">Library</span>
                            )}
                          </h3>
                          <p className="template-description">
                            {template.description}
                          </p>
                        </div>
                      </div>
                      <div className="template-summary">
                        <span className="template-calories">
                          {Math.round(template.totalNutrition?.calories || 0)}{" "}
                          cal
                        </span>
                        <span className="meal-count">
                          {template.meals?.length || 0} meals
                        </span>
                        {isExpanded ? (
                          <ChevronUp size={18} />
                        ) : (
                          <ChevronDown size={18} />
                        )}
                      </div>
                    </div>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          className="template-content"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                        >
                          {/* Nutrition Summary */}
                          <div className="nutrition-summary">
                            <CompactMacros
                              protein={template.totalNutrition?.protein || 0}
                              carbs={template.totalNutrition?.carbs || 0}
                              fat={template.totalNutrition?.fat || 0}
                            />
                          </div>

                          {/* Tags */}
                          {template.tags && template.tags.length > 0 && (
                            <div className="template-tags">
                              {template.tags.map((tag) => (
                                <span key={tag} className="tag">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Meals */}
                          <div className="template-meals">
                            {template.meals?.map((meal) => {
                              const MealIcon =
                                MEAL_ICONS[meal.mealType] || Cookie;
                              const mealCalories = meal.foods?.reduce(
                                (sum, f) => sum + (f.calories || 0),
                                0,
                              );

                              return (
                                <div key={meal.id} className="meal-item">
                                  <div className="meal-info">
                                    <MealIcon size={16} className="meal-icon" />
                                    <div className="meal-details">
                                      <span className="meal-name">
                                        {meal.name}
                                      </span>
                                      <span className="meal-foods">
                                        {meal.foods?.length || 0} foods •{" "}
                                        {Math.round(mealCalories)} cal
                                      </span>
                                    </div>
                                  </div>
                                  <Button
                                    variant="secondary"
                                    size="xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleLogMeal(template, meal);
                                    }}
                                  >
                                    <Play size={12} />
                                    Log
                                  </Button>
                                </div>
                              );
                            })}
                          </div>

                          {/* Actions */}
                          <div className="template-actions">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleLogTemplate(template)}
                              className="log-all-btn"
                            >
                              <Play size={16} />
                              Log All Meals
                            </Button>

                            <div className="secondary-actions">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditTemplate(template)}
                                title={
                                  template.isPrebuilt ? "Edit as copy" : "Edit"
                                }
                              >
                                <Edit3 size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDuplicateTemplate(template)
                                }
                                title="Duplicate"
                              >
                                <Copy size={16} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleExportTemplate(template)}
                                title="Export"
                              >
                                <Download size={16} />
                              </Button>
                              {!template.isPrebuilt && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteTemplate(template)}
                                  title="Delete"
                                  className="delete-btn"
                                >
                                  <Trash2 size={16} />
                                </Button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        )}
      </div>

      {/* Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="import-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="modal-header">
                <h3>
                  <Upload size={20} />
                  Import Template
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowImportModal(false)}
                >
                  <X size={20} />
                </Button>
              </div>

              <div className="modal-body">
                <p>Paste the template JSON below:</p>
                <textarea
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  placeholder='{"name": "Template Name", ...}'
                  rows={10}
                />
              </div>

              <div className="modal-actions">
                <Button
                  variant="secondary"
                  onClick={() => setShowImportModal(false)}
                >
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleImportTemplates}>
                  <Upload size={16} />
                  Import
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default TemplatesPage;
