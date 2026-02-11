import React, { useState, useRef, useCallback } from "react";
import { Camera, ImagePlus, X, RotateCcw, Check, Loader2 } from "lucide-react";
import {
  identifyFoodFromPhoto,
  captureVideoFrame,
  readFileAsDataUrl,
  resizeImage,
} from "../services/photoFoodService";
import { CompactMicronutrients } from "./common";
import devLog from "../utils/devLog";
import "./FoodPhotoCapture.css";

function FoodPhotoCapture({ onAddFood, onClose }) {
  const [mode, setMode] = useState("select"); // select, camera, preview, loading, results
  const [capturedImage, setCapturedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState(null);
  const [cameraError, setCameraError] = useState("");
  const [addedFoods, setAddedFoods] = useState(new Set());

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError("");
    setError("");
    setMode("camera");

    try {
      const constraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      devLog.error("Camera error:", err);

      if (err.name === "NotAllowedError") {
        setCameraError("Camera access denied. Please allow camera permissions and try again.");
      } else if (err.name === "NotFoundError") {
        setCameraError("No camera found on this device.");
      } else if (err.name === "NotReadableError") {
        setCameraError("Camera is in use by another app.");
      } else {
        setCameraError("Could not start camera: " + err.message);
      }
      setMode("select");
    }
  }, []);

  const handleCapture = useCallback(() => {
    if (!videoRef.current) return;

    const dataUrl = captureVideoFrame(videoRef.current, 0.8);
    setCapturedImage(dataUrl);
    stopCamera();
    setMode("preview");
  }, [stopCamera]);

  const handleFileSelect = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    // Validate file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      setError("Image too large. Please select an image under 10MB.");
      return;
    }

    try {
      setError("");
      const dataUrl = await readFileAsDataUrl(file);
      const resized = await resizeImage(dataUrl, 1024, 0.8);
      setCapturedImage(resized);
      setMode("preview");
    } catch (err) {
      devLog.error("File read error:", err);
      setError("Could not read the image. Please try another file.");
    }

    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleRetake = useCallback(() => {
    setCapturedImage(null);
    setResults(null);
    setError("");
    setAddedFoods(new Set());
    setMode("select");
  }, []);

  const handleIdentify = useCallback(async () => {
    if (!capturedImage) return;

    setLoading(true);
    setError("");
    setMode("loading");

    try {
      const data = await identifyFoodFromPhoto(capturedImage);

      if (!data.foods || data.foods.length === 0) {
        setError(data.message || "No food detected in the image. Try a clearer photo.");
        setMode("preview");
      } else {
        setResults(data);
        setMode("results");
      }
    } catch (err) {
      devLog.error("Photo identification error:", err);
      setError(err.message || "Failed to identify food. Please try again.");
      setMode("preview");
    } finally {
      setLoading(false);
    }
  }, [capturedImage]);

  const handleAddFoodItem = useCallback(
    (foodItem) => {
      const foodEntry = {
        id: Date.now() + Math.random(),
        name: foodItem.serving + " " + foodItem.name,
        calories: foodItem.nutrition.calories,
        protein: foodItem.nutrition.protein,
        carbs: foodItem.nutrition.carbs,
        fat: foodItem.nutrition.fat,
        fiber: foodItem.nutrition.fiber,
        sodium: foodItem.nutrition.sodium,
        sugar: foodItem.nutrition.sugar,
        cholesterol: foodItem.nutrition.cholesterol,
        vitaminA: foodItem.nutrition.vitaminA,
        vitaminC: foodItem.nutrition.vitaminC,
        vitaminD: foodItem.nutrition.vitaminD,
        vitaminE: foodItem.nutrition.vitaminE,
        vitaminK: foodItem.nutrition.vitaminK,
        vitaminB1: foodItem.nutrition.vitaminB1,
        vitaminB2: foodItem.nutrition.vitaminB2,
        vitaminB3: foodItem.nutrition.vitaminB3,
        vitaminB6: foodItem.nutrition.vitaminB6,
        vitaminB12: foodItem.nutrition.vitaminB12,
        folate: foodItem.nutrition.folate,
        calcium: foodItem.nutrition.calcium,
        iron: foodItem.nutrition.iron,
        magnesium: foodItem.nutrition.magnesium,
        zinc: foodItem.nutrition.zinc,
        potassium: foodItem.nutrition.potassium,
        timestamp: new Date().toISOString(),
        aiEstimated: true,
        photoScanned: true,
        nutritionSource: foodItem.source,
      };

      onAddFood(foodEntry);
      setAddedFoods((prev) => new Set([...prev, foodItem.name]));
    },
    [onAddFood],
  );

  const handleAddAll = useCallback(() => {
    if (!results?.foods) return;
    results.foods.forEach((food) => {
      if (!addedFoods.has(food.name)) {
        handleAddFoodItem(food);
      }
    });
  }, [results, addedFoods, handleAddFoodItem]);

  const handleClose = useCallback(() => {
    stopCamera();
    if (onClose) onClose();
  }, [stopCamera, onClose]);

  return (
    <div className="photo-capture">
      <div className="photo-capture-header">
        <h4 className="photo-capture-title">
          <Camera size={18} aria-hidden="true" /> Photo Food ID
        </h4>
        <button
          className="photo-capture-close"
          onClick={handleClose}
          aria-label="Close photo capture"
        >
          <X size={18} />
        </button>
      </div>

      {/* Mode: Select input method */}
      {mode === "select" && (
        <div className="photo-select-mode">
          <p className="photo-hint">
            Take a photo or upload an image of your food to identify it and get nutrition info.
          </p>
          <div className="photo-input-buttons">
            <button className="photo-input-btn camera-btn" onClick={startCamera}>
              <Camera size={24} />
              <span>Take Photo</span>
            </button>
            <button
              className="photo-input-btn gallery-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImagePlus size={24} />
              <span>Upload Photo</span>
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="photo-file-input"
            aria-label="Upload a food photo"
          />
          {cameraError && <div className="photo-error">{cameraError}</div>}
          {error && <div className="photo-error">{error}</div>}
        </div>
      )}

      {/* Mode: Camera preview */}
      {mode === "camera" && (
        <div className="photo-camera-mode">
          <div className="photo-video-container">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="photo-video"
            />
            <div className="photo-camera-overlay">
              <div className="photo-camera-frame" />
            </div>
          </div>
          <div className="photo-camera-controls">
            <button
              className="photo-cancel-btn"
              onClick={() => {
                stopCamera();
                setMode("select");
              }}
            >
              <X size={20} />
            </button>
            <button className="photo-shutter-btn" onClick={handleCapture}>
              <div className="shutter-inner" />
            </button>
            <div className="photo-spacer" />
          </div>
        </div>
      )}

      {/* Mode: Preview captured image */}
      {(mode === "preview" || mode === "loading") && capturedImage && (
        <div className="photo-preview-mode">
          <div className="photo-preview-container">
            <img src={capturedImage} alt="Food to identify" className="photo-preview-img" />
            {mode === "loading" && (
              <div className="photo-loading-overlay">
                <Loader2 size={32} className="photo-spinner" />
                <span>Identifying food...</span>
              </div>
            )}
          </div>
          {error && <div className="photo-error">{error}</div>}
          {mode === "preview" && (
            <div className="photo-preview-actions">
              <button className="photo-retake-btn" onClick={handleRetake}>
                <RotateCcw size={16} />
                Retake
              </button>
              <button
                className="photo-identify-btn"
                onClick={handleIdentify}
                disabled={loading}
              >
                <Camera size={16} />
                Identify Food
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mode: Results */}
      {mode === "results" && results && (
        <div className="photo-results-mode">
          <div className="photo-preview-small">
            <img src={capturedImage} alt="Identified food" className="photo-thumb" />
            <div className="photo-results-summary">
              <span className="photo-results-count">
                {results.foods.length} food{results.foods.length !== 1 ? "s" : ""} identified
              </span>
              <span className="photo-results-time">
                {(results.responseTime / 1000).toFixed(1)}s
              </span>
            </div>
          </div>

          <div className="photo-food-list">
            {results.foods.map((food, index) => {
              const isAdded = addedFoods.has(food.name);
              return (
                <div key={index} className="photo-food-card">
                  <div className="photo-food-header">
                    <div className="photo-food-info">
                      <span className="photo-food-name">{food.name}</span>
                      <span className="photo-food-serving">{food.serving}</span>
                    </div>
                    <span
                      className={
                        "photo-source-badge " +
                        (food.source === "usda" ? "badge-usda" : "badge-ai")
                      }
                    >
                      {food.source === "usda" ? "USDA" : "AI Est."}
                    </span>
                  </div>
                  <div className="photo-food-macros">
                    <div className="photo-macro">
                      <span className="photo-macro-value">{food.nutrition.calories}</span>
                      <span className="photo-macro-label">Cal</span>
                    </div>
                    <div className="photo-macro">
                      <span className="photo-macro-value protein">{food.nutrition.protein}g</span>
                      <span className="photo-macro-label">Protein</span>
                    </div>
                    <div className="photo-macro">
                      <span className="photo-macro-value carbs">{food.nutrition.carbs}g</span>
                      <span className="photo-macro-label">Carbs</span>
                    </div>
                    <div className="photo-macro">
                      <span className="photo-macro-value fat">{food.nutrition.fat}g</span>
                      <span className="photo-macro-label">Fat</span>
                    </div>
                  </div>

                  {(food.nutrition.fiber || food.nutrition.sodium || food.nutrition.sugar) && (
                    <div className="photo-food-micros">
                      <CompactMicronutrients
                        fiber={food.nutrition.fiber}
                        sodium={food.nutrition.sodium}
                        sugar={food.nutrition.sugar}
                      />
                    </div>
                  )}

                  <button
                    className={"photo-add-item-btn" + (isAdded ? " added" : "")}
                    onClick={() => handleAddFoodItem(food)}
                    disabled={isAdded}
                  >
                    {isAdded ? (
                      <>
                        <Check size={14} /> Added
                      </>
                    ) : (
                      "Add to Log"
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="photo-results-actions">
            {results.foods.length > 1 && addedFoods.size < results.foods.length && (
              <button className="photo-add-all-btn" onClick={handleAddAll}>
                <Check size={16} /> Add All to Log
              </button>
            )}
            <button className="photo-retake-btn" onClick={handleRetake}>
              <RotateCcw size={16} /> Scan Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default FoodPhotoCapture;
