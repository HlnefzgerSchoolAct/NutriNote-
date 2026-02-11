/**
 * Templates Page — M3 Redesign with Tailwind
 * Browse, create, log, import/export meal templates
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  M3Card,
  M3CardContent,
  M3Button,
  Chip,
  EmptyState,
  showToast,
  StaggerContainer,
  StaggerItem,
  CompactMacros,
  Main,
  VisuallyHidden,
  useAnnounce,
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [expandedTemplate, setExpandedTemplate] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJson, setImportJson] = useState("");
  const announce = useAnnounce();

  // ===== Initialization =====
  const initializeTemplates = useCallback(async () => {
    try {
      await initTemplateDB();
      setGetAllTemplates(getAllTemplates);
      const existingTemplates = await getAllTemplates();
      const existingIds = new Set(existingTemplates.map((t) => t.id));
      let addedCount = 0;
      for (const template of prebuiltTemplates) {
        if (!existingIds.has(template.id)) {
          await saveTemplate(template);
          addedCount++;
        }
      }
      if (addedCount > 0) devLog.log(`Added ${addedCount} prebuilt templates`);
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
    } catch (error) {
      showToast.error("Failed to load templates");
    } finally {
      setIsLoading(false);
    }
  }, [initializeTemplates]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  // ===== Filtered =====
  const filteredTemplates = useMemo(() => {
    let filtered = templates;
    if (selectedCategory !== "all") {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(query)),
      );
    }
    return filtered;
  }, [templates, searchQuery, selectedCategory]);

  // ===== Handlers =====
  const handleDeleteTemplate = useCallback(
    async (template) => {
      if (template.isPrebuilt) {
        showToast.error("Cannot delete prebuilt templates");
        return;
      }
      try {
        await deleteTemplate(template.id);
        setTemplates((prev) => prev.filter((t) => t.id !== template.id));
        showToast.success(`Deleted "${template.name}"`);
        announce(`Deleted template ${template.name}`, "assertive");
      } catch (error) {
        showToast.error("Failed to delete template");
      }
    },
    [announce],
  );

  const handleDuplicateTemplate = useCallback(async (template, openForEdit = false) => {
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
  }, []);

  const handleEditTemplate = useCallback(
    (template) => {
      if (template.isPrebuilt) {
        handleDuplicateTemplate(template, true);
        return;
      }
      setEditingTemplate(template);
      setShowBuilder(true);
    },
    [handleDuplicateTemplate],
  );

  const handleLogTemplate = useCallback(
    (template) => {
      let totalFoods = 0;
      template.meals.forEach((meal) => {
        meal.foods.forEach((food) => {
          addFoodEntry({
            id: Date.now() + Math.random(),
            name: food.name,
            calories: food.calories,
            protein: food.protein || 0,
            carbs: food.carbs || 0,
            fat: food.fat || 0,
            timestamp: new Date().toISOString(),
            mealType: meal.mealType || getMealTypeByTime(),
            fromTemplate: template.name,
          });
          totalFoods++;
        });
      });
      showToast.success("Template logged!", `${totalFoods} foods added from "${template.name}"`);
      announce(`Logged ${totalFoods} foods from template ${template.name}`, "assertive");
      setExpandedTemplate(null);
    },
    [announce],
  );

  const handleLogMeal = useCallback((template, meal) => {
    meal.foods.forEach((food) => {
      addFoodEntry({
        id: Date.now() + Math.random(),
        name: food.name,
        calories: food.calories,
        protein: food.protein || 0,
        carbs: food.carbs || 0,
        fat: food.fat || 0,
        timestamp: new Date().toISOString(),
        mealType: meal.mealType,
        fromTemplate: template.name,
      });
    });
    showToast.success(`Logged ${meal.name}`, `${meal.foods.length} foods added`);
  }, []);

  const handleExportTemplate = useCallback(async (template) => {
    try {
      const jsonString = await exportTemplate(template.id);
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
  }, []);

  const handleImportTemplates = useCallback(async () => {
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
  }, [importJson]);

  const handleRepeatYesterday = useCallback(() => {
    const yesterdayFoods = getYesterdaysFoodLog();
    if (!yesterdayFoods || yesterdayFoods.length === 0) {
      showToast.error("No meals logged yesterday");
      return;
    }
    yesterdayFoods.forEach((food) => {
      addFoodEntry({
        id: Date.now() + Math.random(),
        name: food.name,
        calories: food.calories,
        protein: food.protein || 0,
        carbs: food.carbs || 0,
        fat: food.fat || 0,
        timestamp: new Date().toISOString(),
        mealType: food.mealType || getMealTypeByTime(),
        repeatedFrom: "yesterday",
      });
    });
    showToast.success("Yesterday's meals repeated!", `${yesterdayFoods.length} foods added`);
  }, []);

  const handleCreateFromYesterday = useCallback(async () => {
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
  }, []);

  const handleSaveTemplate = useCallback(
    (savedTemplate) => {
      if (editingTemplate) {
        setTemplates((prev) =>
          prev.map((t) => (t.id === savedTemplate.id ? savedTemplate : t)),
        );
      } else {
        setTemplates((prev) => [savedTemplate, ...prev]);
      }
      setShowBuilder(false);
      setEditingTemplate(null);
    },
    [editingTemplate],
  );

  const handleCancelBuilder = useCallback(() => {
    setShowBuilder(false);
    setEditingTemplate(null);
  }, []);

  // ===== Builder View =====
  if (showBuilder) {
    return (
      <Main className="px-4 pt-6 pb-24 max-w-150 mx-auto md:max-w-210 lg:pb-8 lg:pl-70">
        <TemplateBuilder
          existingTemplate={editingTemplate}
          onSave={handleSaveTemplate}
          onCancel={handleCancelBuilder}
        />
      </Main>
    );
  }

  // ===== Main View =====
  return (
    <Main className="px-4 pt-6 pb-24 max-w-150 mx-auto md:max-w-210 lg:pb-8 lg:pl-70">
      <VisuallyHidden>
        <h1>Meal Templates</h1>
      </VisuallyHidden>

      {/* Header */}
      <header className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <LayoutTemplate size={26} className="text-primary" aria-hidden="true" />
          <h2 className="text-headline-sm font-bold text-on-surface m-0" aria-hidden="true">
            Meal Templates
          </h2>
        </div>
        <M3Button variant="filled" size="sm" icon={<Plus size={18} />} onClick={() => setShowBuilder(true)}>
          New Template
        </M3Button>
      </header>

      {/* Quick Actions */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
        <M3Button variant="tonal" size="sm" icon={<RefreshCw size={16} />} onClick={handleRepeatYesterday} className="shrink-0">
          Repeat Yesterday
        </M3Button>
        <M3Button variant="tonal" size="sm" icon={<Calendar size={16} />} onClick={handleCreateFromYesterday} className="shrink-0">
          Save Yesterday
        </M3Button>
        <M3Button variant="tonal" size="sm" icon={<Upload size={16} />} onClick={() => setShowImportModal(true)} className="shrink-0">
          Import
        </M3Button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" aria-hidden="true" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search templates..."
          className="w-full pl-10 pr-4 py-3 bg-surface-container border border-outline-variant rounded-xl text-body-md text-on-surface outline-none transition-colors duration-150 focus:border-primary placeholder:text-on-surface-variant"
          aria-label="Search templates"
        />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none" role="tablist" aria-label="Filter by category">
        <Chip variant="filter" selected={selectedCategory === "all"} onClick={() => setSelectedCategory("all")} role="tab" aria-selected={selectedCategory === "all"}>
          <LayoutTemplate size={14} className="mr-1" /> All
        </Chip>
        {Object.entries(TEMPLATE_CATEGORIES).map(([key, cat]) => {
          const Icon = CATEGORY_ICONS[key];
          return (
            <Chip key={key} variant="filter" selected={selectedCategory === key} onClick={() => setSelectedCategory(key)} role="tab" aria-selected={selectedCategory === key}>
              <Icon size={14} className="mr-1" /> {cat.label}
            </Chip>
          );
        })}
      </div>

      {/* Templates List */}
      <div className="flex flex-col gap-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-on-surface-variant">
            <div className="w-10 h-10 border-3 border-surface-container-highest border-t-primary rounded-full animate-spin mb-3" />
            <p className="text-body-sm">Loading templates...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <EmptyState
            icon={<LayoutTemplate />}
            title="No templates found"
            description={searchQuery ? "Try a different search term" : "Create your first meal template to get started"}
            actionLabel={!searchQuery ? "Create Template" : undefined}
            onAction={!searchQuery ? () => setShowBuilder(true) : undefined}
          />
        ) : (
          <StaggerContainer className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-4">
            {filteredTemplates.map((template) => (
              <StaggerItem key={template.id}>
                <TemplateCard
                  template={template}
                  isExpanded={expandedTemplate === template.id}
                  onToggleExpand={() => setExpandedTemplate(expandedTemplate === template.id ? null : template.id)}
                  onLog={handleLogTemplate}
                  onLogMeal={handleLogMeal}
                  onEdit={handleEditTemplate}
                  onDuplicate={handleDuplicateTemplate}
                  onExport={handleExportTemplate}
                  onDelete={handleDeleteTemplate}
                />
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>

      {/* Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <motion.div
            className="fixed inset-0 bg-scrim/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowImportModal(false)}
          >
            <motion.div
              className="bg-surface w-full max-w-125 rounded-t-3xl sm:rounded-3xl p-6 max-h-[85vh] overflow-y-auto"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="flex items-center gap-2 text-title-lg font-semibold text-on-surface m-0">
                  <Upload size={20} /> Import Template
                </h3>
                <button
                  className="flex items-center justify-center w-10 h-10 bg-transparent border-none rounded-full text-on-surface-variant cursor-pointer hover:bg-surface-container-high"
                  onClick={() => setShowImportModal(false)}
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-body-sm text-on-surface-variant mb-3">Paste the template JSON below:</p>
              <textarea
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder='{"name": "Template Name", ...}'
                rows={10}
                className="w-full p-3 border border-outline-variant rounded-xl bg-surface-container text-body-sm text-on-surface font-mono resize-y outline-none transition-colors duration-150 focus:border-primary mb-4"
              />
              <div className="flex justify-end gap-2">
                <M3Button variant="text" onClick={() => setShowImportModal(false)}>Cancel</M3Button>
                <M3Button variant="filled" icon={<Upload size={16} />} onClick={handleImportTemplates}>Import</M3Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Main>
  );
}

/* =============================================
   SUB-COMPONENTS
   ============================================= */

/** Template card with expandable detail */
function TemplateCard({
  template,
  isExpanded,
  onToggleExpand,
  onLog,
  onLogMeal,
  onEdit,
  onDuplicate,
  onExport,
  onDelete,
}) {
  const CategoryIcon = CATEGORY_ICONS[template.category] || Tag;
  const categoryConfig = TEMPLATE_CATEGORIES[template.category];

  return (
    <M3Card
      variant="filled"
      className={`overflow-hidden transition-shadow duration-200 ${isExpanded ? "shadow-md" : ""} ${template.isPrebuilt ? "border-l-3 border-l-primary" : ""}`}
    >
      {/* Header (clickable) */}
      <button
        className="flex items-start justify-between w-full px-4 py-3 bg-transparent border-none cursor-pointer text-left text-on-surface transition-colors duration-150 hover:bg-surface-container-high"
        onClick={onToggleExpand}
        aria-expanded={isExpanded}
      >
        <div className="flex gap-3 flex-1 min-w-0">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-lg text-inverse-surface shrink-0"
            style={{ backgroundColor: categoryConfig?.color || "#9b59b6" }}
          >
            <CategoryIcon size={14} />
          </div>
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <span className="flex items-center gap-2 text-body-md font-semibold">
              {template.name}
              {template.isPrebuilt && (
                <span className="text-label-sm font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  Library
                </span>
              )}
            </span>
            {template.description && (
              <span className="text-body-sm text-on-surface-variant line-clamp-2">
                {template.description}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-3">
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-body-sm font-bold text-primary tabular-nums">
              {Math.round(template.totalNutrition?.calories || 0)} cal
            </span>
            <span className="text-label-sm text-on-surface-variant">
              {template.meals?.length || 0} meals
            </span>
          </div>
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="border-t border-outline-variant px-4 py-3">
              {/* Nutrition */}
              <div className="px-3 py-3 bg-surface-container rounded-xl mb-3">
                <CompactMacros
                  protein={template.totalNutrition?.protein || 0}
                  carbs={template.totalNutrition?.carbs || 0}
                  fat={template.totalNutrition?.fat || 0}
                />
              </div>

              {/* Tags */}
              {template.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {template.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-surface-container-high rounded-full text-label-sm text-on-surface-variant">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Meals */}
              <div className="flex flex-col gap-2 mb-3">
                {template.meals?.map((meal) => {
                  const MealIcon = MEAL_ICONS[meal.mealType] || Cookie;
                  const mealCalories = meal.foods?.reduce((sum, f) => sum + (f.calories || 0), 0);
                  return (
                    <div key={meal.id} className="flex items-center justify-between px-3 py-2.5 bg-surface-container border border-outline-variant rounded-lg">
                      <div className="flex items-center gap-2 min-w-0">
                        <MealIcon size={16} className="text-on-surface-variant shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-body-sm font-medium text-on-surface truncate">{meal.name}</span>
                          <span className="text-label-sm text-on-surface-variant">
                            {meal.foods?.length || 0} foods • {Math.round(mealCalories)} cal
                          </span>
                        </div>
                      </div>
                      <M3Button variant="tonal" size="sm" icon={<Play size={12} />} onClick={(e) => { e.stopPropagation(); onLogMeal(template, meal); }}>
                        Log
                      </M3Button>
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-outline-variant flex-wrap gap-2">
                <M3Button variant="filled" size="sm" icon={<Play size={16} />} onClick={() => onLog(template)}>
                  Log All Meals
                </M3Button>
                <div className="flex gap-1">
                  <IconBtn icon={<Edit3 size={16} />} label={template.isPrebuilt ? "Edit as copy" : "Edit"} onClick={() => onEdit(template)} />
                  <IconBtn icon={<Copy size={16} />} label="Duplicate" onClick={() => onDuplicate(template)} />
                  <IconBtn icon={<Download size={16} />} label="Export" onClick={() => onExport(template)} />
                  {!template.isPrebuilt && (
                    <IconBtn icon={<Trash2 size={16} />} label="Delete" onClick={() => onDelete(template)} danger />
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </M3Card>
  );
}

/** Small icon-only action button */
function IconBtn({ icon, label, onClick, danger = false }) {
  return (
    <button
      className={`flex items-center justify-center w-9 h-9 bg-transparent border-none rounded-lg cursor-pointer transition-colors duration-150 ${
        danger
          ? "text-on-surface-variant hover:bg-error/10 hover:text-error"
          : "text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface"
      }`}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );
}

export default TemplatesPage;
