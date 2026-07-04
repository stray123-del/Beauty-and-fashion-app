import React, { useState, useRef, ChangeEvent } from "react";
import { 
  Shirt, Sparkles, RefreshCw, Heart, Bookmark, TrendingUp, 
  ThumbsUp, ThumbsDown, CloudRain, Sun, Flame, Wind, 
  User, Layers, Trash2, Camera, Upload, Check, BookmarkCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { StyleSuggestionResult, SavedLook } from "../types";

interface StyleConsultantProps {
  savedLooks: SavedLook[];
  onSaveLook: (look: StyleSuggestionResult, title: string) => void;
  onDeleteLook: (id: string) => void;
}

const BODY_TYPES = [
  { id: "Hourglass", label: "Hourglass", desc: "Balanced hips & shoulders with a defined waist" },
  { id: "Rectangle", label: "Rectangle", desc: "Uniform shoulders, waist, and hips alignment" },
  { id: "Pear", label: "Pear", desc: "Wider hip profile relative to shoulder span" },
  { id: "Inverted Triangle", label: "Inverted Triangle", desc: "Broader shoulder span relative to hips" },
  { id: "Apple", label: "Apple", desc: "Fuller torso with slender legs and arms" },
  { id: "Athletic", label: "Athletic", desc: "Muscular silhouette with broad contours" },
];

const STYLE_VIBES = [
  { id: "Minimalist", label: "Quiet Luxury / Minimalist", desc: "Tailored capsule pieces, neutral tones" },
  { id: "Casual Chic", label: "Casual Chic", desc: "Effortless styling, denims, loafers" },
  { id: "Corporate Creative", label: "Corporate Creative", desc: "Sharp blazers, smart structures, bold metals" },
  { id: "Streetwear", label: "Contemporary Streetwear", desc: "Relaxed fits, sneakers, vintage graphics" },
  { id: "Edgy Grunge", label: "Edgy / Grunge", desc: "Leather jackets, distressed layers, utility boots" },
  { id: "Elegant Classic", label: "Classic Elegance", desc: "Sleek drapes, refined dresses, silk touches" },
  { id: "Retro Indie", label: "Retro / Indie Vintage", desc: "70s/90s block patterns, high rise, flares" },
];

const OCCASIONS = [
  { id: "Everyday", label: "Everyday Casual" },
  { id: "Date Night", label: "Date Night" },
  { id: "Job Interview", label: "Job Interview / Corporate" },
  { id: "Wedding Guest", label: "Wedding Guest" },
  { id: "Beach Vacation", label: "Beach Getaway" },
  { id: "Party Night Out", label: "Night Out / Festive Party" },
];

const WEATHER_CONTEXTS = [
  { id: "Summer / Sunny", label: "Hot & Sunny", icon: Sun },
  { id: "Transitional / Mild", label: "Mild & Breezy", icon: Wind },
  { id: "Rainy / Cool", label: "Cool & Wet", icon: CloudRain },
  { id: "Winter / Cold", label: "Chilly & Freezing", icon: Flame }, // Warm up in winter!
];

const LOADING_STEPS = [
  "Gathering current high-street trend forecasts...",
  "Analyzing body geometry and proportion balancing ratios...",
  "Aligning color spectrum to selected climate context...",
  "Constructing curated capsule pieces...",
  "Draping layering items and incorporating active trend accessories...",
  "Structuring Do's and Don'ts styling guidelines..."
];

export default function StyleConsultant({ savedLooks, onSaveLook, onDeleteLook }: StyleConsultantProps) {
  const [selectedBody, setSelectedBody] = useState("");
  const [selectedVibe, setSelectedVibe] = useState("");
  const [selectedOccasion, setSelectedOccasion] = useState("");
  const [selectedWeather, setSelectedWeather] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [clothingImage, setClothingImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const [styleResult, setStyleResult] = useState<StyleSuggestionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedTitle, setSavedTitle] = useState("");
  const [isSavedThisSession, setIsSavedThisSession] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
        setClothingImage(null);
      }
    } catch (err: any) {
      console.error("Camera access denied:", err);
      setError("Unable to access the camera. Please upload an image of your garment instead.");
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
        context.drawImage(videoRef.current, 0, 0, width, height);
        const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.9);
        setClothingImage(dataUrl);
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
        setClothingImage(reader.result as string);
        stopCamera();
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerStyling = async () => {
    setError(null);
    setIsLoading(true);
    setStyleResult(null);
    setIsSavedThisSession(false);
    setSavedTitle("");

    let timer = setInterval(() => {
      setLoadingStepIdx((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 2500);

    try {
      const response = await fetch("/api/fashion/style", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bodyType: selectedBody,
          styleVibe: selectedVibe,
          occasion: selectedOccasion,
          weather: selectedWeather,
          image: clothingImage,
          additionalNotes: additionalNotes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate styling advice.");
      }

      const data: StyleSuggestionResult = await response.json();
      setStyleResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during styling formulation.");
    } finally {
      clearInterval(timer);
      setIsLoading(false);
    }
  };

  const handleSaveResult = () => {
    if (styleResult) {
      const title = savedTitle.trim() || `${styleResult.styleVibe} look for ${styleResult.occasion}`;
      onSaveLook(styleResult, title);
      setIsSavedThisSession(true);
    }
  };

  const loadSavedLook = (look: SavedLook) => {
    setStyleResult(look.result);
    setSelectedBody(look.bodyType);
    setSelectedVibe(look.styleVibe);
    setSelectedOccasion(look.occasion);
    setIsSavedThisSession(true);
  };

  const resetAll = () => {
    setStyleResult(null);
    setSelectedBody("");
    setSelectedVibe("");
    setSelectedOccasion("");
    setSelectedWeather("");
    setClothingImage(null);
    setAdditionalNotes("");
    setError(null);
    setIsSavedThisSession(false);
    stopCamera();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="style-consultant-module">
      {/* Settings Panel Left */}
      <div className="lg:col-span-5 space-y-6">
        <div className="stat-card p-6 shadow-sm">
          <h2 className="font-display text-xl font-bold text-gray-900 flex items-center gap-2">
            <Shirt className="h-5 w-5 text-orange-500" /> Style & Trend Profiler
          </h2>
          <p className="text-gray-500 text-xs mt-1">
            Input your physical layout and preferences to generate custom trend-focused outfits.
          </p>

          {/* Body Shape Selector */}
          <div className="mt-6 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">
              1. Physical Body Structure
            </h3>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {BODY_TYPES.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBody(b.id)}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all flex flex-col justify-between cursor-pointer ${
                    selectedBody === b.id
                      ? "bg-orange-500 border-orange-500 text-white shadow-sm"
                      : "bg-gray-50/50 border-gray-200/80 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span className="font-bold">{b.label}</span>
                  <span className={`text-[9px] mt-1 leading-normal ${selectedBody === b.id ? "text-orange-100" : "text-gray-400"}`}>
                    {b.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Aesthetic style vibe */}
          <div className="mt-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">
              2. Design Aesthetic
            </h3>
            <div className="grid grid-cols-1 gap-2 max-h-44 overflow-y-auto pr-1">
              {STYLE_VIBES.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVibe(v.id)}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                    selectedVibe === v.id
                      ? "bg-orange-500 border-orange-500 text-white shadow-sm"
                      : "bg-gray-50/50 border-gray-200/80 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div>
                    <span className="font-bold block">{v.label}</span>
                    <span className={`text-[10px] ${selectedVibe === v.id ? "text-orange-100" : "text-gray-400"}`}>
                      {v.desc}
                    </span>
                  </div>
                  {selectedVibe === v.id && <Check className="h-4 w-4 shrink-0 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Occasions & Climate Group */}
          <div className="grid grid-cols-2 gap-4 mt-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono block">
                3. Occasion
              </label>
              <select
                value={selectedOccasion}
                onChange={(e) => setSelectedOccasion(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-950"
              >
                <option value="">Select event...</option>
                {OCCASIONS.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono block">
                4. Climate
              </label>
              <select
                value={selectedWeather}
                onChange={(e) => setSelectedWeather(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-950"
              >
                <option value="">Select weather...</option>
                {WEATHER_CONTEXTS.map((w) => (
                  <option key={w.id} value={w.id}>{w.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Clothing Anchor Upload / Snapshot */}
          <div className="mt-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 font-mono">
              5. Outfit Focal Piece (Optional)
            </h3>
            <p className="text-[10px] text-gray-400 mt-1">
              Add a photo of a skirt, jacket, shirt, or boots you already own to style outfits around.
            </p>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
            <canvas ref={canvasRef} className="hidden" />

            <div className="relative border border-dashed border-gray-200/80 rounded-xl h-28 overflow-hidden bg-gray-50/50 flex flex-col items-center justify-center">
              {isCameraActive ? (
                <div className="absolute inset-0 bg-black flex items-center justify-center">
                  <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
                  <div className="absolute bottom-2 flex gap-2">
                    <button onClick={capturePhoto} className="bg-white text-gray-900 px-3 py-1 rounded text-[10px] font-bold cursor-pointer">
                      Capture
                    </button>
                    <button onClick={stopCamera} className="bg-gray-900 text-white px-3 py-1 rounded text-[10px] cursor-pointer">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : clothingImage ? (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <img src={clothingImage} className="h-full w-full object-contain" alt="Anchor piece" />
                  <button
                    onClick={() => setClothingImage(null)}
                    className="absolute top-2 right-2 bg-gray-950/80 hover:bg-gray-950 text-white p-1 rounded-lg text-[10px] shadow cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="text-center p-3">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={startCamera}
                      className="bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-sm"
                    >
                      Use Camera
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-white border border-gray-200 text-gray-700 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-sm"
                    >
                      Upload File
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step 6: Custom Preferences */}
          <div className="mt-5 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono block">
              6. Styling requests (optional)
            </label>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="e.g. 'Must include trousers', 'No bright neon colors', 'Prefer layered cottons'..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all resize-none h-16"
            />
          </div>

          {/* Trigger styling consultation CTA */}
          <div className="mt-6">
            <button
              onClick={triggerStyling}
              disabled={isLoading || !selectedBody || !selectedVibe}
              className={`w-full py-3.5 rounded-xl font-display font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm ${
                isLoading || !selectedBody || !selectedVibe
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-orange-500 hover:bg-orange-600 text-white hover:shadow-lg shadow-orange-100 cursor-pointer"
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Drafting Looks...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Formulate Outfits
                </>
              )}
            </button>
            {(!selectedBody || !selectedVibe) && (
              <p className="text-center text-[10px] text-gray-400 mt-2">
                * Please select both a Body Type and a Style Vibe to trigger formulation.
              </p>
            )}
          </div>
        </div>

        {/* History of Saved looks */}
        {savedLooks.length > 0 && (
          <div className="stat-card p-5 shadow-sm">
            <h3 className="font-display font-semibold text-gray-900 text-xs uppercase tracking-wider mb-3">
              Virtual Closet Lookbooks ({savedLooks.length})
            </h3>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {savedLooks.map((look) => (
                <div
                  key={look.id}
                  className="group flex items-center justify-between p-2.5 rounded-xl bg-gray-50/50 hover:bg-gray-100/85 border border-gray-200/50 transition-all"
                >
                  <button
                    onClick={() => loadSavedLook(look)}
                    className="flex-1 text-left flex items-center gap-3 cursor-pointer"
                  >
                    <div className="h-9 w-9 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">
                      <Shirt className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">
                        {look.title}
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono">
                        {look.savedAt} • {look.bodyType} • {look.styleVibe}
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteLook(look.id);
                    }}
                    className="text-gray-400 hover:text-rose-500 p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                    title="Delete saved look"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

        {/* Suggestion Output Side */}
      <div className="lg:col-span-7 flex flex-col h-full min-h-[400px]">
        {error && (
          <div className="bg-rose-50 border border-rose-100/65 text-rose-800 rounded-2xl p-5 text-xs flex items-start gap-3 mb-4 shadow-sm">
            <ThumbsDown className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Styling Error</p>
              <p className="text-rose-700 mt-1">{error}</p>
              <button onClick={resetAll} className="mt-3 bg-white border border-rose-200 px-3 py-1.5 rounded-lg text-[10px] font-bold text-rose-800 cursor-pointer">
                Reset Form
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="stat-card p-8 flex-1 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden">
            <div className="relative h-20 w-20 flex items-center justify-center mb-6">
              <div className="absolute inset-0 border-2 border-gray-100 rounded-full" />
              <div className="absolute inset-0 border-t-2 border-orange-500 rounded-full animate-spin" />
              <div className="absolute inset-2 border border-gray-100 rounded-full animate-pulse" />
              <Shirt className="h-6 w-6 text-orange-500 absolute" />
            </div>

            <div className="max-w-md space-y-2">
              <h3 className="font-display font-bold text-gray-900 text-lg">Curating Personal Lookbook</h3>
              
              <div className="h-8 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={loadingStepIdx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="text-xs text-gray-500 italic font-semibold"
                  >
                    {LOADING_STEPS[loadingStepIdx]}
                  </motion.p>
                </AnimatePresence>
              </div>

              <div className="w-48 h-1 bg-gray-100 mx-auto rounded-full overflow-hidden mt-4">
                <motion.div 
                  className="h-full bg-orange-500" 
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 15, ease: "linear" }}
                />
              </div>
            </div>
          </div>
        ) : styleResult ? (
          <div className="stat-card shadow-md flex-1 flex flex-col overflow-hidden animate-fadeIn" id="stylist-lookbook-results">
            
            {/* Header style card with Warm Orange Trend Gradient */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-600 text-white p-6 relative">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <span className="px-2.5 py-1 rounded bg-white/20 text-[9px] uppercase font-mono tracking-widest font-bold">
                    Style Capsule Drafted
                  </span>
                  <h3 className="font-display text-xl font-bold mt-2 text-white">
                    Proportion Balance: {styleResult.bodyType}
                  </h3>
                  <p className="text-orange-50 text-xs mt-1 leading-normal font-light max-w-xl">
                    {styleResult.analysis}
                  </p>
                </div>
              </div>

              {/* Save look widget */}
              <div className="mt-5 border-t border-white/10 pt-4 flex items-center justify-between gap-3">
                <div className="flex-1 max-w-xs">
                  <input
                    type="text"
                    value={savedTitle}
                    onChange={(e) => setSavedTitle(e.target.value)}
                    placeholder="Enter Lookbook Title (e.g., Casual Spring Blazer)"
                    className="w-full text-[11px] p-2 rounded-lg bg-white/15 border border-white/10 text-white focus:outline-none focus:ring-1 focus:ring-white placeholder-white/50"
                  />
                </div>
                <button
                  onClick={handleSaveResult}
                  disabled={isSavedThisSession}
                  className={`text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 shadow transition-all cursor-pointer ${
                    isSavedThisSession
                      ? "bg-amber-700/50 text-orange-200 cursor-default"
                      : "bg-white text-orange-600 hover:bg-gray-50"
                  }`}
                >
                  {isSavedThisSession ? (
                    <>
                      <BookmarkCheck className="h-4 w-4 text-white" /> Saved to Closet
                    </>
                  ) : (
                    <>
                      <Bookmark className="h-4 w-4" /> Save Lookbook
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Looks Grid Scroll */}
            <div className="p-6 flex-1 overflow-y-auto space-y-8 max-h-[520px]">
              {/* Outfit looks */}
              <div>
                <h4 className="text-xs font-bold text-gray-900 uppercase font-mono tracking-wider mb-4 flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-orange-500" /> Curated Outfits ({styleResult.curatedLooks.length})
                </h4>
                
                <div className="space-y-6">
                  {styleResult.curatedLooks.map((look, index) => (
                    <div
                      key={index}
                      className="border border-gray-100 hover:border-gray-200/80 rounded-2xl p-5 bg-gray-50/20 relative shadow-sm"
                    >
                      <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3.5">
                        <div>
                          <span className="text-[9px] font-mono tracking-wider font-semibold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded uppercase">
                            Outfit {index + 1}
                          </span>
                          <h5 className="font-display font-bold text-gray-900 text-sm mt-1">{look.name}</h5>
                        </div>
                        
                        {/* Palette bubbles */}
                        <div className="flex gap-1">
                          {look.colorPalette.map((color, cIdx) => (
                            <span
                              key={cIdx}
                              className="text-[9px] font-mono bg-white text-gray-500 border border-gray-200/50 px-1.5 py-0.5 rounded"
                              title={color}
                            >
                              {color}
                            </span>
                          ))}
                        </div>
                      </div>

                      <p className="text-gray-600 text-xs italic mb-4">"{look.description}"</p>

                      {/* Pieces list */}
                      <div className="space-y-3">
                        <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">Garments & Pieces</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {look.pieces.map((p, pIdx) => (
                            <div key={pIdx} className="bg-white p-3 rounded-xl border border-gray-100/60 flex flex-col justify-between shadow-sm">
                              <p className="text-xs font-bold text-gray-900">{p.item}</p>
                              <p className="text-[10px] text-gray-500 mt-1 leading-normal italic font-light">
                                Stylist Tip: {p.styleTip}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Accessories */}
                      {look.accessories.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-2">Accents & Accessories</p>
                          <div className="flex flex-wrap gap-1.5">
                            {look.accessories.map((acc, aIdx) => (
                              <span
                                key={aIdx}
                                className="bg-gray-100 text-gray-700 text-[10px] px-2 py-0.5 rounded-md border border-gray-200 font-semibold"
                              >
                                {acc}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Trends & Dos and Don'ts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                {/* Active trend predictions */}
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100/80">
                  <h4 className="text-xs font-bold text-gray-900 uppercase font-mono tracking-wider mb-3 flex items-center gap-1.5">
                    <TrendingUp className="h-4.5 w-4.5 text-orange-500" /> Season Trend Matches
                  </h4>
                  <ul className="space-y-2">
                    {styleResult.keyTrends.map((trend, idx) => (
                      <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0 mt-1.5" />
                        <span>{trend}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Dos and Don'ts checklist */}
                <div className="space-y-4">
                  {/* Dos */}
                  <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100/50">
                    <h4 className="text-xs font-bold text-emerald-800 uppercase font-mono tracking-wider mb-2 flex items-center gap-1.5">
                      <ThumbsUp className="h-4 w-4 text-emerald-600" /> Styling Do's
                    </h4>
                    <ul className="space-y-1.5">
                      {styleResult.styleDos.map((doItem, idx) => (
                        <li key={idx} className="text-[11px] text-gray-600 flex items-start gap-1.5 font-light">
                          <span className="text-emerald-600 shrink-0 font-bold">✓</span>
                          <span>{doItem}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Don'ts */}
                  <div className="bg-rose-50/40 rounded-2xl p-4 border border-rose-100/30">
                    <h4 className="text-xs font-bold text-rose-800 uppercase font-mono tracking-wider mb-2 flex items-center gap-1.5">
                      <ThumbsDown className="h-4 w-4 text-rose-500" /> Styling Don'ts
                    </h4>
                    <ul className="space-y-1.5">
                      {styleResult.styleDonts.map((dontItem, idx) => (
                        <li key={idx} className="text-[11px] text-gray-600 flex items-start gap-1.5 font-light">
                          <span className="text-rose-500 shrink-0 font-bold">✕</span>
                          <span>{dontItem}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Reset look footer */}
            <div className="border-t border-gray-100 p-4 bg-gray-50/40 flex justify-between items-center">
              <p className="text-[10px] text-gray-400 max-w-xs leading-normal">
                AI stylists generate combinations based on geometric rules. Style what makes you feel confident!
              </p>
              <button
                onClick={resetAll}
                className="text-xs font-semibold text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 bg-white px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                Reset & New Profile
              </button>
            </div>
          </div>
        ) : (
          <div className="stat-card p-8 flex-1 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="max-w-md space-y-3">
              <div className="mx-auto h-12 w-12 text-orange-200 animate-bounce duration-1000">
                <Shirt className="h-full w-full" />
              </div>
              <h3 className="font-display font-bold text-gray-900 text-base">Awaiting Stylist Input</h3>
              <p className="text-gray-400 text-xs leading-relaxed font-light">
                Choose your body shape, selected vibe, occasion, and climate context. Once ready, click "Formulate Outfits" to design your custom capsule lookbook.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
