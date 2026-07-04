import React, { useState, useRef, useEffect, ChangeEvent } from "react";
import { 
  Camera, Upload, ShieldAlert, Sparkles, RefreshCw, Check, 
  RotateCcw, Info, Calendar, Moon, Sun, Droplet, 
  HeartPulse, ShieldCheck, CheckCircle2, Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SkinScanResult, SavedScan } from "../types";

interface SkincareScannerProps {
  onSetRoutine: (scanResult: SkinScanResult) => void;
  savedScans: SavedScan[];
  onSaveScan: (scanResult: SkinScanResult) => void;
  onDeleteScan: (id: string) => void;
}

const COMMON_CONCERNS = [
  { id: "acne", label: "Acne Breakouts", description: "Pimples, pustules, papules" },
  { id: "blackheads", label: "Clogged Pores / Blackheads", description: "Sebaceous congestion" },
  { id: "redness", label: "Redness / Irritation", description: "Erythema, compromised barrier" },
  { id: "dryness", label: "Dry / Flaky Skin", description: "Dehydration, rough patches" },
  { id: "oiliness", label: "Excess Sebum", description: "Greasy sheen, enlarged pores" },
  { id: "sensitivity", label: "Highly Sensitive", description: "Prone to stinging or reacting" },
  { id: "hyperpigmentation", label: "Dark Spots / Scars", description: "Post-acne marks, sun spots" },
];

const LOADING_STEPS = [
  "Initializing premium skin scan interface...",
  "Analyzing facial image pixels and contours...",
  "Evaluating localized skin surface moisture balance...",
  "Checking for follicular congestion and active acne regions...",
  "Cross-referencing lipid-moisture barrier markers...",
  "Formulating active ingredient synergies...",
  "Generating optimal chronobiological morning and night routines..."
];

export default function SkincareScanner({ onSetRoutine, savedScans, onSaveScan, onDeleteScan }: SkincareScannerProps) {
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const [scanResult, setScanResult] = useState<SkinScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeResultTab, setActiveResultTab] = useState<"analysis" | "morning" | "night" | "ingredients">("analysis");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cycling loading text
  useEffect(() => {
    let timer: any;
    if (isLoading) {
      timer = setInterval(() => {
        setLoadingStepIdx((prev) => (prev + 1) % LOADING_STEPS.length);
      }, 2500);
    } else {
      setLoadingStepIdx(0);
    }
    return () => clearInterval(timer);
  }, [isLoading]);

  // Clean up camera stream
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const toggleConcern = (id: string) => {
    setSelectedConcerns((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
        setCapturedImage(null);
      }
    } catch (err: any) {
      console.error("Camera access denied:", err);
      setError("Unable to access the camera. Please check your system permissions or upload an image instead.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      const width = videoRef.current.videoWidth;
      const height = videoRef.current.videoHeight;
      canvasRef.current.width = width;
      canvasRef.current.height = height;
      
      if (context) {
        // Draw the current video frame onto the canvas
        context.drawImage(videoRef.current, 0, 0, width, height);
        const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.9);
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setCapturedImage(reader.result as string);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerScan = async () => {
    setError(null);
    setIsLoading(true);
    setScanResult(null);

    try {
      const response = await fetch("/api/skincare/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: capturedImage,
          concerns: selectedConcerns,
          additionalInfo: additionalNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to scan skin profile.");
      }

      const data: SkinScanResult = await response.json();
      setScanResult(data);
      onSaveScan(data); // Save to local storage history list
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during analysis.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadSavedScan = (scan: SavedScan) => {
    setScanResult(scan.result);
    setCapturedImage(scan.imageUrl || null);
    setActiveResultTab("analysis");
  };

  const handleSetRoutine = () => {
    if (scanResult) {
      onSetRoutine(scanResult);
      // Let user know it succeeded with feedback
      alert("This skin scan routine is now active! Check the 'Skincare Daily Tracker' tab.");
    }
  };

  const resetAll = () => {
    setScanResult(null);
    setCapturedImage(null);
    setSelectedConcerns([]);
    setAdditionalNotes("");
    setError(null);
    stopCamera();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="skincare-scanner-module">
      {/* Controls & Scanner Side */}
      <div className="lg:col-span-5 space-y-6">
        <div className="stat-card p-6 shadow-sm">
          <h2 className="font-display text-xl font-bold text-gray-900 flex items-center gap-2">
            <Camera className="h-5 w-5 text-blue-600" /> Skin Profiler & Scanner
          </h2>
          <p className="text-gray-500 text-xs mt-1">
            Provide details of your skin symptoms and capture/upload an image of your face to scan with Gemini.
          </p>

          {/* Step 1: Select Concerns */}
          <div className="mt-6 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">
              Step 1: Primary Symptoms / Concerns
            </h3>
            <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
              {COMMON_CONCERNS.map((concern) => {
                const isSelected = selectedConcerns.includes(concern.id);
                return (
                  <button
                    key={concern.id}
                    onClick={() => toggleConcern(concern.id)}
                    className={`flex items-start text-left p-2.5 rounded-xl border transition-all text-xs ${
                      isSelected
                        ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                        : "bg-gray-50/50 border-gray-200/80 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center h-4 mr-2">
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                        isSelected ? "bg-white border-white text-blue-900" : "bg-white border-gray-300"
                      }`}>
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold">{concern.label}</p>
                      <p className={`text-[10px] ${isSelected ? "text-blue-100" : "text-gray-400"}`}>
                        {concern.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Facial Photo Capture or Upload */}
          <div className="mt-6 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
              Step 2: Add Face Photo (Highly Recommended)
            </h3>

            {/* Hidden Input File */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Display / Capture Box */}
            <div className="relative border-2 border-dashed border-slate-200 rounded-2xl h-64 overflow-hidden bg-slate-50 flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                {isCameraActive ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black flex items-center justify-center"
                    key="camera"
                  >
                    <video
                      ref={videoRef}
                      className="h-full w-full object-cover scale-x-[-1]"
                      playsInline
                      muted
                    />
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 px-4">
                      <button
                        onClick={capturePhoto}
                        className="bg-white hover:bg-slate-100 text-slate-950 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg transition-transform hover:scale-105"
                      >
                        <Camera className="h-4 w-4" /> Capture Photo
                      </button>
                      <button
                        onClick={stopCamera}
                        className="bg-slate-900/80 hover:bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-medium backdrop-blur-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                ) : capturedImage ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col justify-between"
                    key="captured"
                  >
                    <img src={capturedImage} className="h-full w-full object-cover" alt="Captured Face Scan" />
                    <button
                      onClick={() => {
                        setCapturedImage(null);
                        startCamera();
                      }}
                      className="absolute top-3 right-3 bg-slate-900/85 hover:bg-slate-900 text-white p-2 rounded-xl shadow-md transition-all"
                      title="Retake Image"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-6 text-center flex flex-col items-center"
                    key="instructions"
                  >
                    <div className="p-3 bg-gray-100 rounded-2xl text-gray-600 mb-3">
                      <Camera className="h-6 w-6" />
                    </div>
                    <p className="text-gray-800 text-xs font-medium">Capture or Upload your face</p>
                    <p className="text-gray-400 text-[10px] mt-1 max-w-[240px]">
                      A bright selfie helps Gemini analyze surface textures, pore blockages, and irritation.
                    </p>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={startCamera}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <Camera className="h-3.5 w-3.5" /> Start Camera
                      </button>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                      >
                        <Upload className="h-3.5 w-3.5" /> Upload File
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Step 3: Additional Notes */}
          <div className="mt-5 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono block">
              Step 3: Notes (E.g., current products, allergies)
            </label>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="List any sensitive ingredients, current products, prescription topical creams, or diet context..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all resize-none h-16"
            />
          </div>

          {/* Trigger scan CTA */}
          <div className="mt-6">
            <button
              onClick={triggerScan}
              disabled={isLoading || (selectedConcerns.length === 0 && !capturedImage)}
              className={`w-full py-3.5 rounded-xl font-display font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm ${
                isLoading || (selectedConcerns.length === 0 && !capturedImage)
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg shadow-blue-100"
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Analyzing Skin...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Start Skin Consultation
                </>
              )}
            </button>
            {selectedConcerns.length === 0 && !capturedImage && (
              <p className="text-center text-[10px] text-gray-400 mt-2">
                * Select at least one skin concern or add a photo to trigger analysis.
              </p>
            )}
          </div>
        </div>

        {/* Saved Scan History Section */}
        {savedScans.length > 0 && (
          <div className="stat-card p-5 shadow-sm">
            <h3 className="font-display font-semibold text-gray-900 text-xs uppercase tracking-wider mb-3">
              Consultation History ({savedScans.length})
            </h3>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {savedScans.map((scan) => (
                <div
                  key={scan.id}
                  className="group flex items-center justify-between p-2 rounded-xl bg-gray-50/50 hover:bg-gray-100/80 border border-gray-200/50 transition-all"
                >
                  <button
                    onClick={() => loadSavedScan(scan)}
                    className="flex-1 text-left flex items-center gap-3.5"
                  >
                    {scan.imageUrl ? (
                      <img
                        src={scan.imageUrl}
                        className="w-10 h-10 object-cover rounded-lg border border-slate-200"
                        alt=""
                      />
                    ) : (
                      <div className="w-10 h-10 bg-slate-200 text-slate-500 rounded-lg flex items-center justify-center text-xs font-semibold">
                        N/A
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        Skin Type: {scan.result.skinType}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {scan.savedAt}
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteScan(scan.id);
                    }}
                    className="text-slate-400 hover:text-rose-500 p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Delete Scan"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results Display Side */}
      <div className="lg:col-span-7 flex flex-col h-full min-h-[400px]">
        {/* Error state */}
        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl p-5 text-xs flex items-start gap-3 mb-4 shadow-sm animate-fadeIn">
            <ShieldAlert className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Consultation Error</p>
              <p className="text-rose-700 mt-1">{error}</p>
              <button 
                onClick={resetAll}
                className="mt-3 bg-white hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-lg text-[10px] font-bold text-rose-800 transition-all"
              >
                Reset Scanner
              </button>
            </div>
          </div>
        )}

        {/* Loading / Results Switcher */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-2xl border border-gray-200/80 p-8 flex-1 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gray-50/20 pointer-events-none" />
              
              {/* Spinning micro-scanner rings */}
              <div className="relative h-20 w-20 flex items-center justify-center mb-6">
                <div className="absolute inset-0 border-2 border-gray-100 rounded-full" />
                <div className="absolute inset-0 border-t-2 border-blue-600 rounded-full animate-spin" />
                <div className="absolute inset-2 border border-gray-100 rounded-full" />
                <div className="absolute inset-2 border-b border-orange-500 rounded-full animate-spin [animation-duration:1.5s]" />
                <Droplet className="h-6 w-6 text-blue-600 absolute animate-pulse" />
              </div>

              <div className="max-w-md space-y-2">
                <h3 className="font-display font-bold text-gray-900 text-lg">Analyzing Your Derm Profile</h3>
                
                <div className="h-8 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={loadingStepIdx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="text-xs text-gray-500 italic"
                    >
                      {LOADING_STEPS[loadingStepIdx]}
                    </motion.p>
                  </AnimatePresence>
                </div>

                <div className="w-48 h-1 bg-gray-100 mx-auto rounded-full overflow-hidden mt-4">
                  <motion.div 
                    className="h-full bg-blue-600" 
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 15, ease: "linear" }}
                  />
                </div>
              </div>
            </motion.div>
          ) : scanResult ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="stat-card shadow-md flex-1 flex flex-col overflow-hidden"
              id="skin-analysis-results"
            >
              {/* Header Result Card with Professional Blue Gradient */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 relative">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <ShieldCheck className="w-32 h-32" />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded bg-white/20 text-[9px] uppercase font-mono tracking-widest font-bold">
                        Gemini Scan Completed
                      </span>
                      <span className="text-[10px] text-blue-100 flex items-center gap-1 font-mono">
                        <Calendar className="h-3 w-3" /> {scanResult.analysisDate}
                      </span>
                    </div>
                    <h3 className="font-display text-2xl font-bold mt-2">
                      Skin Type: <span className="text-orange-300 font-sans">{scanResult.skinType}</span>
                    </h3>
                    <p className="text-blue-50 text-xs mt-1 max-w-xl font-light">
                      {scanResult.skinTypeDescription}
                    </p>
                  </div>
                  
                  <button
                    onClick={handleSetRoutine}
                    className="bg-white hover:bg-gray-50 text-blue-600 text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02]"
                  >
                    <CheckCircle2 className="h-4 w-4 text-blue-600" /> Apply Active Routine
                  </button>
                </div>
              </div>

              {/* Result Tabs styled with Professional Polish gray background */}
              <div className="border-b border-gray-200/80 bg-gray-50/50 flex">
                {[
                  { id: "analysis", label: "Skin Analysis", icon: Info },
                  { id: "morning", label: "Morning Sequence", icon: Sun },
                  { id: "night", label: "Night Sequence", icon: Moon },
                  { id: "ingredients", label: "Target Actives", icon: HeartPulse },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeResultTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveResultTab(tab.id as any)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-xs font-semibold border-b-2 transition-all ${
                        isActive
                          ? "border-blue-600 text-blue-600 bg-white"
                          : "border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/40"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Results Content Box */}
              <div className="p-6 flex-1 overflow-y-auto max-h-[500px]">
                <AnimatePresence mode="wait">
                  {activeResultTab === "analysis" && (
                    <motion.div
                      key="analysis"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      {/* Concerns Detected */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider mb-2">
                          Detected Derm Profile Markers
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {scanResult.detectedConcerns.map((concern, idx) => (
                            <span
                              key={idx}
                              className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs px-2.5 py-1 rounded-full font-medium"
                            >
                              {concern}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Skin Explanation & Acne Causes */}
                      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                        <h4 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider mb-2 flex items-center gap-1.5">
                          <Droplet className="h-4 w-4 text-slate-700" /> Follicular & Barrier Analysis
                        </h4>
                        <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-line">
                          {scanResult.concernAnalysis}
                        </p>
                      </div>

                      {/* Generic Products / Products Recommended */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider mb-3">
                          Ideal Formulations to Spot
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {scanResult.recommendedProducts.map((prod, idx) => (
                            <div
                              key={idx}
                              className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-white shadow-sm flex flex-col justify-between"
                            >
                              <div>
                                <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase block font-semibold">
                                  {prod.category}
                                </span>
                                <p className="text-xs font-bold text-slate-900 mt-1">
                                  {prod.productName}
                                </p>
                                <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                  Actives: {prod.activeIngredients}
                                </p>
                              </div>
                              <p className="text-slate-600 text-[11px] mt-2.5 pt-2 border-t border-slate-50 leading-normal italic">
                                "{prod.advice}"
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Lifestyle tips */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider mb-2">
                          Daily Skin Habits
                        </h4>
                        <ul className="space-y-1.5">
                          {scanResult.lifestyleTips.map((tip, idx) => (
                            <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-slate-900 shrink-0 mt-1.5" />
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}

                  {activeResultTab === "morning" && (
                    <motion.div
                      key="morning"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-2 text-amber-600 pb-2 border-b border-slate-100">
                        <Sun className="h-5 w-5" />
                        <div>
                          <h4 className="text-xs font-bold uppercase font-mono tracking-wider">
                            Morning Chrono-Routine
                          </h4>
                          <p className="text-[10px] text-slate-400">Designed to defend, hydrate, and guard against ultraviolet damage.</p>
                        </div>
                      </div>

                      <div className="relative border-l border-slate-200 ml-3.5 pl-6 space-y-6 py-2">
                        {scanResult.morningRoutine.map((step) => (
                          <div key={step.stepNumber} className="relative">
                            {/* Step Badge */}
                            <div className="absolute -left-[37px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-950 text-white font-mono text-[10px] font-bold">
                              {step.stepNumber}
                            </div>

                            <div>
                              <span className="inline-block text-[9px] font-mono tracking-wider uppercase bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
                                {step.category}
                              </span>
                              <p className="text-xs font-bold text-slate-950 mt-1">
                                {step.action}
                              </p>
                              <p className="text-slate-500 text-[11px] mt-1 italic">
                                Look for: {step.productsOrIngredients}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {activeResultTab === "night" && (
                    <motion.div
                      key="night"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-2 text-indigo-700 pb-2 border-b border-slate-100">
                        <Moon className="h-5 w-5" />
                        <div>
                          <h4 className="text-xs font-bold uppercase font-mono tracking-wider">
                            Night Repair & Reset Sequence
                          </h4>
                          <p className="text-[10px] text-slate-400">Focuses on deep purification, targeted acne correction, and epidermal healing.</p>
                        </div>
                      </div>

                      <div className="relative border-l border-slate-200 ml-3.5 pl-6 space-y-6 py-2">
                        {scanResult.nightRoutine.map((step) => (
                          <div key={step.stepNumber} className="relative">
                            {/* Step Badge */}
                            <div className="absolute -left-[37px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white font-mono text-[10px] font-bold">
                              {step.stepNumber}
                            </div>

                            <div>
                              <span className="inline-block text-[9px] font-mono tracking-wider uppercase bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
                                {step.category}
                              </span>
                              <p className="text-xs font-bold text-slate-950 mt-1">
                                {step.action}
                              </p>
                              <p className="text-slate-500 text-[11px] mt-1 italic">
                                Look for: {step.productsOrIngredients}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {activeResultTab === "ingredients" && (
                    <motion.div
                      key="ingredients"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <h4 className="text-xs font-bold text-slate-900 uppercase font-mono tracking-wider mb-2">
                        Your Target Skincare Active Ingredients
                      </h4>
                      
                      <div className="space-y-3">
                        {scanResult.targetIngredients.map((ing, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-xl border border-slate-100 bg-slate-50/50"
                          >
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-slate-950" />
                              <h5 className="text-xs font-bold text-slate-900">{ing.name}</h5>
                            </div>
                            <p className="text-slate-600 text-xs mt-1.5 leading-normal pl-4">
                              <span className="font-semibold text-slate-800">Purpose:</span> {ing.purpose}
                            </p>
                            <p className="text-slate-500 text-[11px] mt-1.5 italic pl-4 border-l border-slate-200 ml-1">
                              How to use: {ing.howToUse}
                            </p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Reset / Rescan footer */}
              <div className="border-t border-slate-100 p-4 bg-slate-50/30 flex justify-between items-center">
                <p className="text-[10px] text-slate-400">
                  AI systems can make mistakes. Consult a licensed dermatologist for chronic issues.
                </p>
                <button
                  onClick={resetAll}
                  className="text-xs font-medium text-slate-500 hover:text-slate-950 border border-slate-200 hover:border-slate-950 bg-white px-3 py-1.5 rounded-lg transition-all"
                >
                  Reset & New Scan
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-2xl border border-slate-100 p-8 flex-1 flex flex-col items-center justify-center text-center shadow-sm"
            >
              <div className="max-w-md space-y-3">
                <div className="mx-auto h-12 w-12 text-slate-300">
                  <ShieldCheck className="h-full w-full" />
                </div>
                <h3 className="font-display font-bold text-slate-900 text-base">Awaiting Diagnostic Input</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Select your symptoms, capture a selfie or upload a photo, and click "Start Skin Consultation" to get a comprehensive dermatological assessment.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
