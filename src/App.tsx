import { useState, useEffect } from "react";
import SkincareScanner from "./components/SkincareScanner";
import SkincareTracker from "./components/SkincareTracker";
import StyleConsultant from "./components/StyleConsultant";
import { SkinScanResult, SavedScan, SavedLook, StyleSuggestionResult } from "./types";
import { 
  ShieldCheck, Sparkles, AlertCircle, Camera, SunDim, Shirt, Menu, X, Info 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const navigationItems = [
  { id: "skincare", label: "Face Scan", subLabel: "Derm analysis", icon: Camera },
  { id: "tracker", label: "My Routine", subLabel: "Active regimen", icon: SunDim },
  { id: "fashion", label: "Style Profile", subLabel: "Trend curation", icon: Shirt },
];

const getHeaderDetails = (tab: string) => {
  switch (tab) {
    case "skincare":
      return {
        title: "Derm-Analysis Hub",
        description: "Pixel-perfect skin scan and customized chronobiological formulations by Gemini.",
        weatherLabel: "Cloudy, 18°C",
        uvLabel: "UV: Low"
      };
    case "tracker":
      return {
        title: "Active Regimen",
        description: "Your structured morning and night skin routines with integrated progress tracking.",
        weatherLabel: "Sunny, 21°C",
        uvLabel: "UV: Moderate"
      };
    case "fashion":
      return {
        title: "Style Concierge",
        description: "Custom wardrobe recommendations based on your unique body shape and trending aesthetics.",
        weatherLabel: "Windy, 15°C",
        uvLabel: "UV: Low"
      };
    default:
      return {
        title: "Morning Insights",
        description: "AI-driven wellness and personal consultation center.",
        weatherLabel: "Cloudy, 18°C",
        uvLabel: "UV: Low"
      };
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("skincare");
  const [activeRoutine, setActiveRoutine] = useState<SkinScanResult | null>(null);
  const [savedScans, setSavedScans] = useState<SavedScan[]>([]);
  const [savedLooks, setSavedLooks] = useState<SavedLook[]>([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  const userEmail = "1veenaprakash@gmail.com";

  const getInitials = (email: string) => {
    const localPart = email.split("@")[0];
    if (localPart.length <= 2) return localPart.toUpperCase();
    return localPart.substring(0, 2).toUpperCase();
  };

  // Load initial states from localStorage
  useEffect(() => {
    try {
      const scansStr = localStorage.getItem("aura_saved_scans");
      const looksStr = localStorage.getItem("aura_saved_looks");
      const routineStr = localStorage.getItem("aura_active_routine");

      if (scansStr) setSavedScans(JSON.parse(scansStr));
      if (looksStr) setSavedLooks(JSON.parse(looksStr));
      if (routineStr) setActiveRoutine(JSON.parse(routineStr));
    } catch (e) {
      console.error("Failed to load initial localStorage state", e);
    }
  }, []);

  const handleSetRoutine = (newRoutine: SkinScanResult) => {
    setActiveRoutine(newRoutine);
    localStorage.setItem("aura_active_routine", JSON.stringify(newRoutine));
    // Automatically swap to tracker tab so user sees it instantly active!
    setActiveTab("tracker");
  };

  const handleClearRoutine = () => {
    setActiveRoutine(null);
    localStorage.removeItem("aura_active_routine");
  };

  const handleSaveScan = (newResult: SkinScanResult) => {
    const newScanRecord: SavedScan = {
      id: "scan_" + Date.now(),
      result: newResult,
      savedAt: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updated = [newScanRecord, ...savedScans];
    setSavedScans(updated);
    localStorage.setItem("aura_saved_scans", JSON.stringify(updated));
  };

  const handleDeleteScan = (id: string) => {
    const updated = savedScans.filter((s) => s.id !== id);
    setSavedScans(updated);
    localStorage.setItem("aura_saved_scans", JSON.stringify(updated));
  };

  const handleSaveLook = (newLook: StyleSuggestionResult, title: string) => {
    const newLookRecord: SavedLook = {
      id: "look_" + Date.now(),
      title: title,
      bodyType: newLook.bodyType,
      styleVibe: newLook.styleVibe,
      occasion: newLook.occasion,
      result: newLook,
      savedAt: new Date().toLocaleDateString()
    };

    const updated = [newLookRecord, ...savedLooks];
    setSavedLooks(updated);
    localStorage.setItem("aura_saved_looks", JSON.stringify(updated));
  };

  const handleDeleteLook = (id: string) => {
    const updated = savedLooks.filter((l) => l.id !== id);
    setSavedLooks(updated);
    localStorage.setItem("aura_saved_looks", JSON.stringify(updated));
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen w-full bg-[#F8F9FA] text-slate-900 font-sans antialiased" id="app-root-container">
      {/* Mobile Header */}
      <div className="lg:hidden flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 shrink-0 z-30 shadow-sm animate-fadeIn" id="mobile-header">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-extrabold shadow-md shadow-blue-200">A</div>
          <span className="text-base font-bold tracking-tight text-slate-900">AURA</span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 border border-blue-100 text-blue-600 font-mono text-xs font-bold">
            {getInitials(userEmail)}
          </div>
          <button 
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            id="mobile-menu-btn"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Sidebar - Desktop Layout */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 border-r border-slate-200 bg-white flex-col h-screen sticky top-0" id="desktop-sidebar">
        {/* Logo Section */}
        <div className="p-6 border-b border-slate-100 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-extrabold shadow-md shadow-blue-200">A</div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">AURA</h1>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 space-y-1.5 px-4 py-6" id="desktop-sidebar-nav">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-left ${
                  isActive
                    ? "bg-blue-50/80 text-blue-600 border-r-4 border-blue-600 font-medium"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
                id={`sidebar-link-${item.id}`}
              >
                <Icon className={`w-5 h-5 shrink-0 transition-colors ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                <div className="min-w-0">
                  <p className="text-xs font-bold leading-tight">{item.label}</p>
                  <p className={`text-[10px] mt-0.5 ${isActive ? "text-blue-500/80" : "text-slate-400"}`}>{item.subLabel}</p>
                </div>
              </button>
            );
          })}
        </nav>

        {/* User Info bottom of Sidebar */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-white shadow-sm flex items-center justify-center text-blue-600 font-bold font-mono">
              {getInitials(userEmail)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800 truncate">{userEmail.split("@")[0]}</p>
              <p className="text-[10px] text-slate-400 font-mono truncate">{userEmail}</p>
              <span className="inline-block mt-1 text-[9px] font-bold tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase font-mono">
                Pro Member
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Sidebar */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden fixed inset-0 bg-black z-40"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-y-0 left-0 w-64 bg-white z-50 flex flex-col border-r border-slate-200 shadow-2xl"
              id="mobile-sidebar-drawer"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-extrabold shadow-md shadow-blue-200">A</div>
                  <span className="text-lg font-bold tracking-tight text-slate-900">AURA</span>
                </div>
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 space-y-1.5 px-4 py-6">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${
                        isActive
                          ? "bg-blue-50/80 text-blue-600 border-r-4 border-blue-600 font-medium"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                      <div className="min-w-0">
                        <p className="text-xs font-bold leading-tight">{item.label}</p>
                        <p className={`text-[10px] mt-0.5 ${isActive ? "text-blue-500/80" : "text-slate-400"}`}>{item.subLabel}</p>
                      </div>
                    </button>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-white shadow-sm flex items-center justify-center text-blue-600 font-bold font-mono">
                    {getInitials(userEmail)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{userEmail.split("@")[0]}</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{userEmail}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Panel Area */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto" id="main-content-panel">
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-7xl w-full mx-auto">
          {/* Main Top Header Section */}
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 mb-8 border-b border-slate-200/80" id="main-content-header">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-1 w-6 bg-blue-600 rounded" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 font-mono">
                  Aura Intelligence Studio
                </p>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                {getHeaderDetails(activeTab).title}
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-0.5 font-light leading-relaxed max-w-2xl">
                {getHeaderDetails(activeTab).description}
              </p>
            </div>

            {/* Weather & Info Badge */}
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
              <div className="flex items-center gap-2.5 text-xs text-slate-600 px-4 py-2 bg-white border border-slate-200/80 rounded-full shadow-sm">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0"></span>
                <span className="font-medium whitespace-nowrap">{getHeaderDetails(activeTab).weatherLabel}</span>
                <span className="text-blue-600 font-bold border-l border-slate-200 pl-2.5 uppercase font-mono tracking-wider text-[10px]">
                  {getHeaderDetails(activeTab).uvLabel}
                </span>
              </div>
            </div>
          </header>

          {/* Active Tab Panel */}
          <div className="relative">
            <AnimatePresence mode="wait">
              {activeTab === "skincare" && (
                <motion.div
                  key="skincare-tab"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                >
                  <SkincareScanner 
                    onSetRoutine={handleSetRoutine} 
                    savedScans={savedScans}
                    onSaveScan={handleSaveScan}
                    onDeleteScan={handleDeleteScan}
                  />
                </motion.div>
              )}

              {activeTab === "tracker" && (
                <motion.div
                  key="tracker-tab"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                >
                  <SkincareTracker 
                    activeRoutine={activeRoutine} 
                    onClearRoutine={handleClearRoutine} 
                  />
                </motion.div>
              )}

              {activeTab === "fashion" && (
                <motion.div
                  key="fashion-tab"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                >
                  <StyleConsultant 
                    savedLooks={savedLooks}
                    onSaveLook={handleSaveLook}
                    onDeleteLook={handleDeleteLook}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* Dynamic Footer matching sidebar theme */}
        <footer className="border-t border-slate-150 bg-white py-6 mt-auto px-4 sm:px-6 lg:px-8" id="app-footer">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-light">
              <ShieldCheck className="h-4 w-4 text-slate-400" />
              <span>Secure offline local storage and encrypted API transport enabled.</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">
              Aura Premium Space • All Rights Reserved
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
