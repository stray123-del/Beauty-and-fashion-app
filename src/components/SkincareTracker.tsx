import { useState, useEffect } from "react";
import { 
  Check, Sun, Moon, Sparkles, Award, RotateCcw, 
  Flame, Droplet, GlassWater, Eye, Ban, CalendarCheck2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SkinScanResult, RoutineStep } from "../types";

interface SkincareTrackerProps {
  activeRoutine: SkinScanResult | null;
  onClearRoutine: () => void;
}

// Built-in skin type templates for instant sandbox use if user has no scan yet
const TEMPLATES = [
  {
    name: "Oily & Acne-Prone Barrier",
    skinType: "Oily / Acne-Prone",
    skinTypeDescription: "Pore congestion and excessive sebum production leading to frequent breakouts.",
    morningRoutine: [
      { stepNumber: 1, category: "Cleanser", action: "Gentle Salicylic Acid Cleansing", productsOrIngredients: "2% Salicylic Acid Gel Cleanser" },
      { stepNumber: 2, category: "Toner", action: "Hydrate and Balance pores", productsOrIngredients: "Niacinamide & Zinc PCA balancing mist" },
      { stepNumber: 3, category: "Treatment", action: "Sebum Control & Spot Defense", productsOrIngredients: "Niacinamide (5%) or Azelaic Acid" },
      { stepNumber: 4, category: "Sunscreen", action: "Non-comedogenic UV defense", productsOrIngredients: "Fluid SPF 50+ (Matte finish)" },
    ],
    nightRoutine: [
      { stepNumber: 1, category: "Double Cleansing", action: "Melt makeup & sunscreen", productsOrIngredients: "Light Micellar Water or Centella Oil" },
      { stepNumber: 2, category: "Purifying Wash", action: "Deep follicular cleanse", productsOrIngredients: "Gentle foaming gel cleanser" },
      { stepNumber: 3, category: "Acne Correction", action: "Speed up cellular turnover", productsOrIngredients: "Retinol (0.2%) or Salicylic Spot Gel" },
      { stepNumber: 4, category: "Moisturizer", action: "Soothe and protect barrier", productsOrIngredients: "Light Gel Cream (Centella & Ceramides)" },
    ]
  },
  {
    name: "Dry & Dehydrated Repair",
    skinType: "Dry / Flaky Skin",
    skinTypeDescription: "Lack of lipid production resulting in a tight, dull, compromised skin barrier.",
    morningRoutine: [
      { stepNumber: 1, category: "Cleanser", action: "Mild non-foaming wash", productsOrIngredients: "Hydrating Glycerin & Oat Cleansing Milk" },
      { stepNumber: 2, category: "Essence", action: "Plump skin moisture cells", productsOrIngredients: "Hyaluronic Acid & Beta Glucan" },
      { stepNumber: 3, category: "Moisturizer", action: "Lock in hydration", productsOrIngredients: "Rich barrier cream with Ceramide NP" },
      { stepNumber: 4, category: "Sunscreen", action: "Dewy UV protection", productsOrIngredients: "Dewy Chemical SPF 50+ with Panthenol" },
    ],
    nightRoutine: [
      { stepNumber: 1, category: "Cream Cleanse", action: "Soothe and remove debris", productsOrIngredients: "Gentle cleansing balm" },
      { stepNumber: 2, category: "Treatment", action: "Dermal barrier recovery", productsOrIngredients: "Panthenol, Squalane, or Madecassoside serum" },
      { stepNumber: 3, category: "Barrier Lock", action: "Prevent trans-epidermal water loss", productsOrIngredients: "Ceramide rich overnight recovery cream" },
      { stepNumber: 4, category: "Oil Seal (Optional)", action: "Deep lipid replenishment", productsOrIngredients: "100% Pure Squalane Oil" },
    ]
  }
];

export default function SkincareTracker({ activeRoutine, onClearRoutine }: SkincareTrackerProps) {
  const [routine, setRoutine] = useState<SkinScanResult | null>(null);
  const [completedMorning, setCompletedMorning] = useState<number[]>([]);
  const [completedNight, setCompletedNight] = useState<number[]>([]);
  const [streak, setStreak] = useState(0);
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [habits, setHabits] = useState({
    noPicking: false,
    cleanPillowcase: false,
    avoidTouching: false,
  });

  // Load routine and state on mount / update
  useEffect(() => {
    if (activeRoutine) {
      setRoutine(activeRoutine);
    } else {
      // Check local storage for active routine, or default to first template
      const saved = localStorage.getItem("aura_active_routine");
      if (saved) {
        setRoutine(JSON.parse(saved));
      } else {
        const defaultTemplate: SkinScanResult = {
          skinType: TEMPLATES[0].skinType,
          skinTypeDescription: TEMPLATES[0].skinTypeDescription,
          detectedConcerns: ["Sebum Congestion", "Acne breakouts"],
          concernAnalysis: "Pores are prone to excess sebum backup.",
          morningRoutine: TEMPLATES[0].morningRoutine,
          nightRoutine: TEMPLATES[0].nightRoutine,
          targetIngredients: [
            { name: "Salicylic Acid", purpose: "Unclogs follicular walls", howToUse: "Use in cleanser morning or spot treatment night" }
          ],
          recommendedProducts: [
            { category: "Cleanser", productName: "Gentle Salicylic Wash", activeIngredients: "BHA", advice: "Purifies pores" }
          ],
          lifestyleTips: ["Change pillowcase frequently"],
          analysisDate: new Date().toLocaleDateString()
        };
        setRoutine(defaultTemplate);
      }
    }

    // Load progress state from local storage
    const savedMorning = localStorage.getItem("aura_tracker_morning");
    const savedNight = localStorage.getItem("aura_tracker_night");
    const savedStreak = localStorage.getItem("aura_tracker_streak");
    const savedWater = localStorage.getItem("aura_tracker_water");
    const savedHabits = localStorage.getItem("aura_tracker_habits");

    if (savedMorning) setCompletedMorning(JSON.parse(savedMorning));
    if (savedNight) setCompletedNight(JSON.parse(savedNight));
    if (savedStreak) setStreak(parseInt(savedStreak, 10));
    if (savedWater) setWaterGlasses(parseInt(savedWater, 10));
    if (savedHabits) setHabits(JSON.parse(savedHabits));
  }, [activeRoutine]);

  // Persist values
  const saveState = (morning: number[], night: number[], currentStreak: number, water: number, habs: typeof habits) => {
    localStorage.setItem("aura_tracker_morning", JSON.stringify(morning));
    localStorage.setItem("aura_tracker_night", JSON.stringify(night));
    localStorage.setItem("aura_tracker_streak", currentStreak.toString());
    localStorage.setItem("aura_tracker_water", water.toString());
    localStorage.setItem("aura_tracker_habits", JSON.stringify(habs));
  };

  const handleMorningToggle = (stepNum: number) => {
    const next = completedMorning.includes(stepNum)
      ? completedMorning.filter((n) => n !== stepNum)
      : [...completedMorning, stepNum];
    
    setCompletedMorning(next);
    evaluateStreak(next, completedNight);
    saveState(next, completedNight, streak, waterGlasses, habits);
  };

  const handleNightToggle = (stepNum: number) => {
    const next = completedNight.includes(stepNum)
      ? completedNight.filter((n) => n !== stepNum)
      : [...completedNight, stepNum];
    
    setCompletedNight(next);
    evaluateStreak(completedMorning, next);
    saveState(completedMorning, next, streak, waterGlasses, habits);
  };

  const incrementWater = () => {
    const next = Math.min(waterGlasses + 1, 12);
    setWaterGlasses(next);
    saveState(completedMorning, completedNight, streak, next, habits);
  };

  const resetWater = () => {
    setWaterGlasses(0);
    saveState(completedMorning, completedNight, streak, 0, habits);
  };

  const handleHabitToggle = (key: keyof typeof habits) => {
    const next = { ...habits, [key]: !habits[key] };
    setHabits(next);
    saveState(completedMorning, completedNight, streak, waterGlasses, next);
  };

  const evaluateStreak = (morning: number[], night: number[]) => {
    if (!routine) return;
    
    const morningCount = routine.morningRoutine.length;
    const nightCount = routine.nightRoutine.length;
    
    // If user completed all morning and all night steps, lock in a streak point
    const allCompleted = morning.length === morningCount && night.length === nightCount;
    if (allCompleted) {
      // Avoid infinitely bumping by only incrementing when they first hit 100%
      const previouslyAllCompleted = completedMorning.length === morningCount && completedNight.length === nightCount;
      if (!previouslyAllCompleted) {
        setStreak((prev) => {
          const next = prev + 1;
          localStorage.setItem("aura_tracker_streak", next.toString());
          return next;
        });
      }
    }
  };

  const resetProgress = () => {
    if (confirm("Are you sure you want to reset today's checklist and water counts?")) {
      setCompletedMorning([]);
      setCompletedNight([]);
      setWaterGlasses(0);
      setHabits({ noPicking: false, cleanPillowcase: false, avoidTouching: false });
      saveState([], [], streak, 0, { noPicking: false, cleanPillowcase: false, avoidTouching: false });
    }
  };

  const applyTemplate = (tpl: typeof TEMPLATES[0]) => {
    const customized: SkinScanResult = {
      skinType: tpl.skinType,
      skinTypeDescription: tpl.skinTypeDescription,
      detectedConcerns: [tpl.name],
      concernAnalysis: "Active routine built from professional pre-sets.",
      morningRoutine: tpl.morningRoutine,
      nightRoutine: tpl.nightRoutine,
      targetIngredients: [],
      recommendedProducts: [],
      lifestyleTips: [],
      analysisDate: new Date().toLocaleDateString()
    };
    setRoutine(customized);
    localStorage.setItem("aura_active_routine", JSON.stringify(customized));
    setCompletedMorning([]);
    setCompletedNight([]);
    saveState([], [], streak, waterGlasses, habits);
  };

  if (!routine) return null;

  // Calculate percentages
  const totalSteps = routine.morningRoutine.length + routine.nightRoutine.length;
  const completedSteps = completedMorning.length + completedNight.length;
  const percentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="skincare-tracker-module">
      {/* Tracker Side */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Progress Overview Hero with Professional Gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <span className="px-2.5 py-1 rounded bg-white/20 text-[9px] font-mono tracking-widest uppercase font-bold">
              Active Routine: {routine.skinType}
            </span>
            <h3 className="font-display font-bold text-xl md:text-2xl mt-1">Daily Completion Hub</h3>
            <p className="text-blue-100 text-xs font-light max-w-md">
              Perform your customized routines twice daily to optimize follicular health, barrier defense, and clear active acne.
            </p>
          </div>

          {/* Interactive Circle Progress */}
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-20 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  className="stroke-current text-white/10"
                  strokeWidth="6"
                  fill="transparent"
                />
                <motion.circle
                  cx="40"
                  cy="40"
                  r="34"
                  className="stroke-current text-emerald-400"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={213.6}
                  initial={{ strokeDashoffset: 213.6 }}
                  animate={{ strokeDashoffset: 213.6 - (213.6 * percentage) / 100 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </svg>
              <span className="absolute font-mono font-bold text-sm text-white">{percentage}%</span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-orange-300 font-mono text-sm font-bold animate-pulse">
                <Flame className="h-4 w-4 fill-orange-300" />
                <span>{streak} Day Streak</span>
              </div>
              <p className="text-[10px] text-blue-100">
                {completedSteps} / {totalSteps} steps completed today
              </p>
            </div>
          </div>
        </div>

        {/* Morning & Night Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Morning Checklist */}
          <div className="stat-card p-5 shadow-sm">
            <div className="flex items-center gap-2 text-orange-600 border-b border-gray-100 pb-3 mb-4">
              <Sun className="h-5 w-5" />
              <div>
                <h4 className="font-display font-bold text-gray-900 text-sm">Morning Routine</h4>
                <p className="text-[10px] text-gray-400">Apply after waking</p>
              </div>
            </div>

            <div className="space-y-3">
              {routine.morningRoutine.map((step) => {
                const isChecked = completedMorning.includes(step.stepNumber);
                return (
                  <button
                    key={step.stepNumber}
                    onClick={() => handleMorningToggle(step.stepNumber)}
                    className={`w-full text-left p-3 rounded-xl border flex items-start gap-3 transition-all ${
                      isChecked
                        ? "bg-emerald-50/60 border-emerald-100 text-gray-600"
                        : "bg-gray-50/50 border-gray-200/50 text-gray-800 hover:border-gray-300"
                    }`}
                  >
                    <div className={`mt-0.5 h-4.5 w-4.5 rounded border flex items-center justify-center shrink-0 transition-all ${
                      isChecked 
                        ? "bg-emerald-600 border-emerald-600 text-white" 
                        : "bg-white border-gray-300"
                    }`}>
                      {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>

                    <div className="min-w-0">
                      <span className="text-[9px] font-mono uppercase text-gray-400 tracking-wider font-bold">
                        Step {step.stepNumber} • {step.category}
                      </span>
                      <p className={`text-xs font-semibold mt-0.5 ${isChecked ? "line-through text-gray-400" : "text-gray-950"}`}>
                        {step.action}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5 leading-normal font-light">
                        Active formulation: {step.productsOrIngredients}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Night Checklist */}
          <div className="stat-card p-5 shadow-sm">
            <div className="flex items-center gap-2 text-indigo-600 border-b border-gray-100 pb-3 mb-4">
              <Moon className="h-5 w-5" />
              <div>
                <h4 className="font-display font-bold text-gray-900 text-sm">Night Routine</h4>
                <p className="text-[10px] text-gray-400">Apply before sleeping</p>
              </div>
            </div>

            <div className="space-y-3">
              {routine.nightRoutine.map((step) => {
                const isChecked = completedNight.includes(step.stepNumber);
                return (
                  <button
                    key={step.stepNumber}
                    onClick={() => handleNightToggle(step.stepNumber)}
                    className={`w-full text-left p-3 rounded-xl border flex items-start gap-3 transition-all ${
                      isChecked
                        ? "bg-emerald-50/60 border-emerald-100 text-gray-600"
                        : "bg-gray-50/50 border-gray-200/50 text-gray-800 hover:border-gray-300"
                    }`}
                  >
                    <div className={`mt-0.5 h-4.5 w-4.5 rounded border flex items-center justify-center shrink-0 transition-all ${
                      isChecked 
                        ? "bg-emerald-600 border-emerald-600 text-white" 
                        : "bg-white border-gray-300"
                    }`}>
                      {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>

                    <div className="min-w-0">
                      <span className="text-[9px] font-mono uppercase text-gray-400 tracking-wider font-bold">
                        Step {step.stepNumber} • {step.category}
                      </span>
                      <p className={`text-xs font-semibold mt-0.5 ${isChecked ? "line-through text-gray-400" : "text-gray-950"}`}>
                        {step.action}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5 leading-normal font-light">
                        Active formulation: {step.productsOrIngredients}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Reset Utility bar */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={resetProgress}
            className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors border border-slate-200 hover:border-slate-400 bg-white px-3 py-1.5 rounded-lg"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset Today's Progress
          </button>
        </div>
      </div>

      {/* Holistic Habit Columns (Right Panel) */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Hydration Tracker */}
        <div className="stat-card p-5 shadow-sm">
          <h3 className="font-display font-bold text-gray-900 text-sm flex items-center gap-1.5">
            <GlassWater className="h-4.5 w-4.5 text-blue-500" /> Hydration Monitor
          </h3>
          <p className="text-gray-400 text-[10px] mt-0.5">Hydration flushes toxins and plumps dermal matrix.</p>

          <div className="mt-5 text-center">
            <p className="font-mono text-2xl font-bold text-gray-950">{waterGlasses} / 8 <span className="text-xs font-sans text-gray-400 font-normal">glasses</span></p>
            
            {/* Water levels progress */}
            <div className="flex items-center justify-center gap-1 mt-3">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-7 w-5 rounded-md border flex items-end justify-center overflow-hidden transition-all duration-300 ${
                    idx < waterGlasses ? "border-blue-300 bg-blue-50" : "border-gray-200 bg-gray-50/50"
                  }`}
                >
                  {idx < waterGlasses && (
                    <motion.div 
                      className="w-full bg-blue-500" 
                      initial={{ height: 0 }}
                      animate={{ height: "100%" }}
                      transition={{ type: "spring", stiffness: 100 }}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={incrementWater}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 rounded-xl shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <Droplet className="h-3.5 w-3.5" /> Log Glass
              </button>
              <button
                onClick={resetWater}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold text-xs px-3 py-2 rounded-xl transition-all cursor-pointer"
                title="Reset Water count"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Holistic Barrier Habits Checklist */}
        <div className="stat-card p-5 shadow-sm">
          <h3 className="font-display font-bold text-gray-900 text-sm flex items-center gap-1.5">
            <CalendarCheck2 className="h-4.5 w-4.5 text-blue-600" /> Holistic Habits
          </h3>
          <p className="text-gray-400 text-[10px] mt-0.5">Topical skincare works best with daily physical discipline.</p>

          <div className="mt-4 space-y-2.5">
            {/* No picking declaration */}
            <button
              onClick={() => handleHabitToggle("noPicking")}
              className={`w-full p-2.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                habits.noPicking ? "bg-blue-50/60 border-blue-100" : "bg-gray-50/50 border-gray-200/50 hover:border-gray-300"
              }`}
            >
              <div className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center shrink-0 ${
                habits.noPicking ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-300"
              }`}>
                {habits.noPicking && <Check className="h-3 w-3 stroke-[3]" />}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-950 flex items-center gap-1">
                  <Ban className="h-3 w-3 text-blue-500" /> Did Not Pick Acne
                </p>
                <p className="text-[10px] text-gray-400">Protects against scarring and spread of bacteria.</p>
              </div>
            </button>

            {/* Clean Silk pillowcase */}
            <button
              onClick={() => handleHabitToggle("cleanPillowcase")}
              className={`w-full p-2.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                habits.cleanPillowcase ? "bg-blue-50/60 border-blue-100" : "bg-gray-50/50 border-gray-200/50 hover:border-gray-300"
              }`}
            >
              <div className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center shrink-0 ${
                habits.cleanPillowcase ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-300"
              }`}>
                {habits.cleanPillowcase && <Check className="h-3 w-3 stroke-[3]" />}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-950 flex items-center gap-1">
                  <Award className="h-3.5 w-3.5 text-orange-500" /> Clean Pillowcase Today
                </p>
                <p className="text-[10px] text-gray-400">Reduces bacterial accumulation over overnight repair cycles.</p>
              </div>
            </button>

            {/* Avoided touching face */}
            <button
              onClick={() => handleHabitToggle("avoidTouching")}
              className={`w-full p-2.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                habits.avoidTouching ? "bg-blue-50/60 border-blue-100" : "bg-gray-50/50 border-gray-200/50 hover:border-gray-300"
              }`}
            >
              <div className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center shrink-0 ${
                habits.avoidTouching ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-300"
              }`}>
                {habits.avoidTouching && <Check className="h-3 w-3 stroke-[3]" />}
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-950 flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5 text-emerald-500" /> Avoided Touching Face
                </p>
                <p className="text-[10px] text-gray-400">Halts mechanical transmission of sebum and dirt.</p>
              </div>
            </button>
          </div>
        </div>

        {/* Templates selector for Sandbox */}
        <div className="stat-card p-5 shadow-sm">
          <h3 className="font-display font-bold text-gray-900 text-sm flex items-center gap-1.5">
            <Sparkles className="h-4.5 w-4.5 text-orange-400 animate-pulse" /> Try Skin Templates
          </h3>
          <p className="text-gray-400 text-[10px] mt-0.5">Quickly apply standard routines for sandbox testing.</p>

          <div className="mt-3.5 space-y-2">
            {TEMPLATES.map((tpl, idx) => (
              <button
                key={idx}
                onClick={() => applyTemplate(tpl)}
                className="w-full text-left p-3 rounded-xl bg-gray-50/70 hover:bg-gray-100 border border-gray-200/50 text-xs transition-all flex flex-col justify-between cursor-pointer"
              >
                <span className="font-bold text-gray-900">{tpl.name}</span>
                <span className="text-[10px] text-gray-400 mt-0.5 truncate max-w-full font-light">
                  {tpl.skinTypeDescription}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
