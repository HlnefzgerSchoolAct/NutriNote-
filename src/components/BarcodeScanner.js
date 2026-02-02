import React, { useState, useRef, useEffect, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { lookupBarcode, calculateNutrition } from "../services/barcodeService";
import "./BarcodeScanner.css";

function BarcodeScanner({ onAddFood, onSwitchToAI }) {
  const [mode, setMode] = useState("scan"); // scan, serving, manual
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [product, setProduct] = useState(null);
  const [manualBarcode, setManualBarcode] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("serving");
  const [cameraError, setCameraError] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const streamRef = useRef(null);

  const stopCamera = useCallback(() => {
    if (codeReaderRef.current) {
      // Reset the reader
      codeReaderRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  }, []);

  const handleBarcodeDetected = useCallback(
    async (barcode) => {
      // Stop scanning
      stopCamera();
      setLoading(true);
      setError("");

      try {
        const productData = await lookupBarcode(barcode);
        setProduct(productData);
        setMode("serving");

        // Set default quantity based on serving size
        if (productData.servingQuantity) {
          setQuantity("1");
          setUnit("serving");
        }
      } catch (err) {
        setError(err.message);
        setProduct({ barcode, name: barcode }); // Store barcode for AI fallback
      } finally {
        setLoading(false);
      }
    },
    [stopCamera],
  );

  const startCamera = useCallback(async () => {
    setCameraError("");
    setError("");

    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Prefer rear camera
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Initialize barcode reader
      codeReaderRef.current = new BrowserMultiFormatReader();
      setIsScanning(true);

      // Start continuous scanning
      codeReaderRef.current.decodeFromVideoDevice(
        undefined, // Use default device
        videoRef.current,
        (result, err) => {
          if (result) {
            handleBarcodeDetected(result.getText());
          }
          // Ignore errors during scanning (they're continuous)
        },
      );
    } catch (err) {
      console.error("Camera access error:", err);

      if (err.name === "NotAllowedError") {
        setCameraError(
          "Camera access denied. Please allow camera access in your browser settings, or enter the barcode manually below.",
        );
      } else if (err.name === "NotFoundError") {
        setCameraError(
          "No camera found. Please enter the barcode manually below.",
        );
      } else {
        setCameraError(
          "Could not access camera. Please enter the barcode manually below.",
        );
      }

      setMode("manual");
    }
  }, [handleBarcodeDetected]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Start camera when component mounts in scan mode
  useEffect(() => {
    if (mode === "scan" && !isScanning && !cameraError) {
      startCamera();
    }
    return () => {
      if (mode !== "scan") {
        stopCamera();
      }
    };
  }, [mode, isScanning, cameraError, startCamera, stopCamera]);

  const handleManualSubmit = async (e) => {
    e.preventDefault();

    if (!manualBarcode.trim()) {
      setError("Please enter a barcode");
      return;
    }

    await handleBarcodeDetected(manualBarcode.trim());
  };

  const handleAddFood = () => {
    if (!product || !product.nutritionPer100g) return;

    const nutrition = calculateNutrition(
      product.nutritionPer100g,
      parseFloat(quantity),
      unit,
      product.servingQuantity || 100,
    );

    const displayName = product.brand
      ? `${product.name} (${product.brand})`
      : product.name;

    const foodEntry = {
      id: Date.now(),
      name: `${quantity} ${unit} ${displayName}`,
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
      timestamp: new Date().toISOString(),
      barcodeScanned: true,
      barcode: product.barcode,
    };

    onAddFood(foodEntry);

    // Reset state
    setProduct(null);
    setMode("scan");
    setQuantity("1");
    setUnit("serving");
    setError("");
    setManualBarcode("");
  };

  const handleTryAIEstimator = () => {
    // Pass product name to AI estimator if available
    if (onSwitchToAI) {
      onSwitchToAI(product?.name || "");
    }
  };

  const handleScanAgain = () => {
    setProduct(null);
    setError("");
    setMode("scan");
    setManualBarcode("");
    startCamera();
  };

  const calculatedNutrition = product?.nutritionPer100g
    ? calculateNutrition(
        product.nutritionPer100g,
        parseFloat(quantity) || 0,
        unit,
        product.servingQuantity || 100,
      )
    : null;

  return (
    <div className="barcode-scanner">
      <h3 className="scanner-title">
        <span>📷</span> Barcode Scanner
      </h3>

      {/* Loading State */}
      {loading && (
        <div className="scanner-loading">
          <div className="spinner"></div>
          <p>Looking up product...</p>
        </div>
      )}

      {/* Error State with AI Fallback */}
      {error && !loading && (
        <div className="scanner-error-container">
          <div className="scanner-error">{error}</div>
          <div className="scanner-fallback-buttons">
            <button className="scanner-ai-btn" onClick={handleTryAIEstimator}>
              🤖 Try AI Estimator Instead
            </button>
            <button className="scanner-retry-btn" onClick={handleScanAgain}>
              📷 Scan Again
            </button>
          </div>
        </div>
      )}

      {/* Scan Mode */}
      {mode === "scan" && !loading && !error && (
        <div className="scanner-camera-container">
          {cameraError ? (
            <div className="camera-error-message">
              <p>{cameraError}</p>
            </div>
          ) : (
            <>
              <div className="camera-preview">
                <video
                  ref={videoRef}
                  className="camera-video"
                  playsInline
                  muted
                />
                <div className="scan-target">
                  <div className="scan-target-corner top-left"></div>
                  <div className="scan-target-corner top-right"></div>
                  <div className="scan-target-corner bottom-left"></div>
                  <div className="scan-target-corner bottom-right"></div>
                </div>
                <div className="scan-line"></div>
              </div>
              <p className="scan-instruction">Point your camera at a barcode</p>
            </>
          )}

          {/* Manual Entry Fallback */}
          <div className="manual-entry-section">
            <p className="manual-entry-label">Or enter barcode manually:</p>
            <form onSubmit={handleManualSubmit} className="manual-entry-form">
              <input
                type="text"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                placeholder="Enter barcode number"
                className="manual-input"
                pattern="[0-9]*"
                inputMode="numeric"
              />
              <button type="submit" className="manual-submit-btn">
                Look Up
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Manual Mode (after camera error) */}
      {mode === "manual" && !loading && !error && (
        <div className="scanner-manual-mode">
          {cameraError && (
            <div className="camera-error-banner">{cameraError}</div>
          )}
          <form onSubmit={handleManualSubmit} className="manual-form">
            <div className="form-group">
              <label className="form-label">Barcode Number</label>
              <input
                type="text"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                placeholder="Enter barcode number"
                className="form-input"
                pattern="[0-9]*"
                inputMode="numeric"
                autoFocus
              />
            </div>
            <button type="submit" className="lookup-btn">
              🔍 Look Up Product
            </button>
          </form>
        </div>
      )}

      {/* Serving Size Mode */}
      {mode === "serving" && product && !error && !loading && (
        <div className="scanner-result-container">
          <div className="product-info">
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="product-image"
              />
            )}
            <div className="product-details">
              <h4 className="product-name">{product.name}</h4>
              {product.brand && (
                <p className="product-brand">{product.brand}</p>
              )}
              <p className="product-serving">
                Serving: {product.servingSize || "100g"}
              </p>
            </div>
          </div>

          {/* Serving Size Form */}
          <div className="serving-form">
            <div className="serving-row">
              <div className="serving-group">
                <label className="serving-label">Quantity</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="1"
                  step="0.5"
                  min="0"
                  className="serving-input"
                />
              </div>

              <div className="serving-group">
                <label className="serving-label">Unit</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="serving-select"
                >
                  <option value="serving">serving</option>
                  <option value="g">grams</option>
                  <option value="oz">oz</option>
                  <option value="package">package</option>
                </select>
              </div>
            </div>
          </div>

          {/* Calculated Nutrition */}
          {calculatedNutrition && (
            <div className="nutrition-preview">
              <h5 className="nutrition-preview-title">Nutrition</h5>
              <div className="nutrition-grid">
                <div className="nutrition-item">
                  <div className="nutrition-value">
                    {calculatedNutrition.calories}
                  </div>
                  <div className="nutrition-label">Calories</div>
                </div>
                <div className="nutrition-item">
                  <div className="nutrition-value">
                    {calculatedNutrition.protein}g
                  </div>
                  <div className="nutrition-label">Protein</div>
                </div>
                <div className="nutrition-item">
                  <div className="nutrition-value">
                    {calculatedNutrition.carbs}g
                  </div>
                  <div className="nutrition-label">Carbs</div>
                </div>
                <div className="nutrition-item">
                  <div className="nutrition-value">
                    {calculatedNutrition.fat}g
                  </div>
                  <div className="nutrition-label">Fat</div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="result-actions">
            <button className="add-food-btn" onClick={handleAddFood}>
              ✓ Add to Food Log
            </button>
            <button className="scan-again-btn" onClick={handleScanAgain}>
              📷 Scan Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BarcodeScanner;
