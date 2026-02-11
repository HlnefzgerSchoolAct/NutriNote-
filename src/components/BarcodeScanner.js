import React, { useState, useRef, useEffect, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { X, Flashlight, FlashlightOff, Camera, RefreshCw } from "lucide-react";
import { lookupBarcode, calculateNutrition } from "../services/barcodeService";
import devLog from "../utils/devLog";
import "./BarcodeScanner.css";

function BarcodeScanner({ onAddFood, onSwitchToAI }) {
  const [mode, setMode] = useState("idle"); // idle, scan, serving, manual
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [product, setProduct] = useState(null);
  const [manualBarcode, setManualBarcode] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("serving");
  const [cameraError, setCameraError] = useState("");
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);

  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const streamRef = useRef(null);
  const videoTrackRef = useRef(null);

  const stopCamera = useCallback(() => {
    // Stop the barcode reader first
    if (codeReaderRef.current) {
      try {
        // BrowserMultiFormatReader doesn't have a stop method,
        // but setting to null prevents further decode callbacks
        codeReaderRef.current = null;
      } catch (e) {
        devLog.warn("Error stopping barcode reader:", e);
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    videoTrackRef.current = null;
    setTorchOn(false);
    setTorchSupported(false);
  }, []);

  const handleBarcodeDetected = useCallback(
    async (barcode) => {
      stopCamera();
      setLoading(true);
      setError("");

      try {
        const productData = await lookupBarcode(barcode);
        setProduct(productData);
        setMode("serving");

        if (productData.servingQuantity) {
          setQuantity("1");
          setUnit("serving");
        }
      } catch (err) {
        setError(err.message);
        setProduct({ barcode, name: barcode });
      } finally {
        setLoading(false);
      }
    },
    [stopCamera],
  );

  const startCamera = useCallback(async () => {
    setCameraError("");
    setError("");
    setMode("scan");

    try {
      // Enhanced camera constraints for better focus and quality
      const constraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Get video track for torch control
      const videoTrack = stream.getVideoTracks()[0];
      videoTrackRef.current = videoTrack;

      // Check for torch support and apply continuous autofocus
      if (videoTrack.getCapabilities) {
        const capabilities = videoTrack.getCapabilities();

        // Check torch support
        if (capabilities.torch) {
          setTorchSupported(true);
        }

        // Apply continuous autofocus if supported
        if (
          capabilities.focusMode &&
          capabilities.focusMode.includes("continuous")
        ) {
          try {
            await videoTrack.applyConstraints({
              advanced: [{ focusMode: "continuous" }],
            });
          } catch (e) {
            devLog.log("Continuous autofocus not applied:", e);
          }
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Initialize barcode reader
      codeReaderRef.current = new BrowserMultiFormatReader();

      // Start continuous scanning
      codeReaderRef.current.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result, err) => {
          if (result) {
            handleBarcodeDetected(result.getText());
          }
        },
      );
    } catch (err) {
      devLog.error("Camera access error:", err);

      if (err.name === "NotAllowedError") {
        setCameraError(
          "Camera access denied. Please allow camera access in your browser settings.",
        );
      } else if (err.name === "NotFoundError") {
        setCameraError("No camera found on this device.");
      } else {
        setCameraError("Could not access camera. Please try again.");
      }

      setMode("manual");
    }
  }, [handleBarcodeDetected]);

  const toggleTorch = async () => {
    if (!videoTrackRef.current || !torchSupported) return;

    try {
      await videoTrackRef.current.applyConstraints({
        advanced: [{ torch: !torchOn }],
      });
      setTorchOn(!torchOn);
    } catch (e) {
      devLog.warn("Torch control failed:", e);
    }
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

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
    setMode("idle");
    setQuantity("1");
    setUnit("serving");
    setError("");
    setManualBarcode("");
  };

  const handleTryAIEstimator = () => {
    stopCamera();
    setMode("idle");
    if (onSwitchToAI) {
      onSwitchToAI(product?.name || "");
    }
  };

  const handleScanAgain = () => {
    setProduct(null);
    setError("");
    setManualBarcode("");
    startCamera();
  };

  const handleClose = () => {
    stopCamera();
    setMode("idle");
    setProduct(null);
    setError("");
  };

  const handleOpenScanner = () => {
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
      {/* Idle State - Launch Button */}
      {mode === "idle" && (
        <div className="scanner-idle">
          <button
            className="launch-scanner-btn"
            onClick={handleOpenScanner}
            aria-label="Open barcode scanner"
          >
            <Camera size={24} />
            <span>Scan Barcode</span>
          </button>
          <div className="manual-entry-inline">
            <span>or</span>
            <form onSubmit={handleManualSubmit} className="inline-form">
              <input
                type="text"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                placeholder="Enter barcode number"
                className="inline-input"
                pattern="[0-9]*"
                inputMode="numeric"
                aria-label="Barcode number"
              />
              <button type="submit" className="inline-submit">
                Look Up
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Fullscreen Scanner Modal */}
      {mode === "scan" && (
        <div className="scanner-fullscreen-modal">
          {/* Close Button */}
          <button
            className="scanner-close-btn"
            onClick={handleClose}
            aria-label="Close scanner"
          >
            <X size={24} />
          </button>

          {/* Camera Controls */}
          <div className="scanner-controls">
            {torchSupported && (
              <button
                className="scanner-control-btn"
                onClick={toggleTorch}
                aria-label={
                  torchOn ? "Turn off flashlight" : "Turn on flashlight"
                }
              >
                {torchOn ? (
                  <FlashlightOff size={20} />
                ) : (
                  <Flashlight size={20} />
                )}
              </button>
            )}
          </div>

          {cameraError ? (
            <div className="fullscreen-error">
              <p>{cameraError}</p>
              <button className="error-close-btn" onClick={handleClose}>
                Close
              </button>
            </div>
          ) : (
            <>
              {/* Fullscreen Camera Preview */}
              <div className="fullscreen-camera">
                <video
                  ref={videoRef}
                  className="fullscreen-video"
                  playsInline
                  muted
                />
                <div className="fullscreen-scan-target">
                  <div className="scan-corner top-left"></div>
                  <div className="scan-corner top-right"></div>
                  <div className="scan-corner bottom-left"></div>
                  <div className="scan-corner bottom-right"></div>
                </div>
                <div className="scan-line-animated"></div>
              </div>

              {/* Instructions */}
              <div className="scanner-instructions">
                <p>Align barcode within the frame</p>
              </div>

              {/* Manual Entry */}
              <div className="fullscreen-manual">
                <form onSubmit={handleManualSubmit} className="fullscreen-form">
                  <input
                    type="text"
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    placeholder="Or enter barcode manually"
                    className="fullscreen-input"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    aria-label="Enter barcode manually"
                  />
                  <button type="submit" className="fullscreen-submit">
                    Go
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="scanner-loading">
          <div className="spinner"></div>
          <p>Looking up product...</p>
        </div>
      )}

      {/* Error State with AI Fallback */}
      {error && !loading && mode !== "scan" && (
        <div className="scanner-error-container">
          <div className="scanner-error">{error}</div>
          <div className="scanner-fallback-buttons">
            <button className="scanner-ai-btn" onClick={handleTryAIEstimator}>
              🤖 Try AI Estimator Instead
            </button>
            <button className="scanner-retry-btn" onClick={handleScanAgain}>
              <RefreshCw size={16} /> Scan Again
            </button>
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
              <label htmlFor="barcode-input" className="form-label">
                Barcode Number
              </label>
              <input
                id="barcode-input"
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
