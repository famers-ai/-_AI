"use client";

import { useEffect, useState } from "react";
import { fetchDashboardData, fetchAIAnalysis, fetchUserProfile, calibrateSensors, uploadImageForDiagnosis, type DashboardData } from "@/lib/api";
import { Loader2, RefreshCw, PlusCircle, AlertTriangle, Settings2, Camera, HelpCircle } from "lucide-react";
import clsx from "clsx";
import TermsAgreementModal from "@/components/TermsAgreementModal";
import DataInputModal from "@/components/DataInputModal";
import CalibrationModal from "@/components/CalibrationModal";
import ControlPanel from "@/components/ControlPanel";

import { getFarmCondition, getVPDSignal } from "@/lib/farm-signals";
import LocationDisplay from '@/components/LocationDisplay';
import CropSelector from "@/components/CropSelector";
import { DEFAULT_CROP } from "@/lib/crops";
import {
  detectUserCountry,
  saveLocation,
  loadSavedLocation,
  isFirstVisit,
  type SavedLocation
} from "@/lib/location";

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState("San Francisco");
  const [selectedCropId, setSelectedCropId] = useState(DEFAULT_CROP);


  // User & Terms State
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsTriggerAction, setTermsTriggerAction] = useState<(() => void) | null>(null);

  // Data Input State
  const [showDataInput, setShowDataInput] = useState(false);

  // AI State
  const [analyzing, setAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  // Calibration State
  const [showCalibration, setShowCalibration] = useState(false);

  // Login / Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginFarmId, setLoginFarmId] = useState("");

  // Strategy 1: Detect user's country & Check Auth
  useEffect(() => {
    const country = detectUserCountry();
    console.log(`🌍 Detected user country: ${country || 'Unknown'}`);

    // Auth Check
    const storedFarmId = localStorage.getItem("farm_id");
    if (storedFarmId) {
      setIsLoggedIn(true);
      // Only load data if we have an ID
      // loadData is called in the next effect, or we can trigger here?
      // Let's rely on the location effect, but we need to make sure logic flows.
    }
  }, []);

  // Strategy 2: Check for saved location or show setup modal on first visit
  useEffect(() => {
    if (!isLoggedIn) return; // Don't load if not logged in

    try {
      const savedLoc = loadSavedLocation();

      if (savedLoc) {
        // Load from saved location
        console.log('📍 Using saved location:', savedLoc.name);
        if (savedLoc.lat && savedLoc.lon) {
          loadData(undefined, savedLoc.lat, savedLoc.lon);
        } else if (savedLoc.city) {
          setCity(savedLoc.city);
          loadData(savedLoc.city, undefined, undefined, savedLoc.country);
        }
      } else if (isFirstVisit()) {
        // First visit: let LocationDisplay handle the setup modal
        loadData();
      } else {
        // Regular visit without saved location
        loadData();
      }
    } catch (error) {
      // localStorage disabled (Safari private mode, etc.)
      console.warn('localStorage unavailable, using default location', error);
      loadData();
    }
  }, []);

  async function loadData(cityName?: string, lat?: number, lon?: number, countryCode?: string) {
    setLoading(true);
    // setLocationError(null);
    try {
      const targetCity = cityName || city;

      // Strategy 1: Pass detected country (or saved country) to API for better geocoding
      const targetCountry = countryCode || detectUserCountry() || undefined;
      let dashboardData = await fetchDashboardData(targetCity, lat, lon, targetCountry);

      // Check for backend error or empty data
      if (!dashboardData || !dashboardData.location || !dashboardData.location.name) {
        throw new Error("Invalid location data received from server");
      }

      // Fetch user profile to check terms agreement
      try {
        const profile = await fetchUserProfile();
        setUserProfile(profile);

        // If guest (no profile), check local storage override
        if (!profile) {
          const { getLatestLocalReading, calculateVPD } = await import("@/lib/storage");
          const localReading = getLatestLocalReading();
          if (localReading) {
            const vpd = calculateVPD(localReading.temperature, localReading.humidity);
            dashboardData = {
              ...dashboardData,
              indoor: {
                temperature: localReading.temperature,
                humidity: localReading.humidity,
                vpd: vpd,
                vpd_status: vpd < 0.4 ? 'Low' : vpd > 1.2 ? 'High' : 'Optimal'
              }
            };
          }
        }
      } catch (err) {
        console.warn("Failed to fetch user profile", err);
      }

      // Strategy 2: Save location automatically if coordinates were used
      if (lat && lon && dashboardData.location.name) {
        const locationToSave: SavedLocation = {
          lat,
          lon,
          name: dashboardData.location.name,
          country: dashboardData.location.country,
          timestamp: Date.now()
        };
        saveLocation(locationToSave);
        // Only update city if it's different to prevent loops
        if (city !== dashboardData.location.name) {
          setCity(dashboardData.location.name);
        }
      } else if (cityName && dashboardData.location.name) {
        // Save city-based location
        const locationToSave: SavedLocation = {
          city: cityName,
          name: dashboardData.location.name,
          country: dashboardData.location.country,
          timestamp: Date.now()
        };
        saveLocation(locationToSave);
        // Update displayed city name if successful
        setCity(dashboardData.location.name);
      }

      setData(dashboardData);
      // setLocationError(null);
    } catch (e: any) {
      console.error(e);
      // setData(null); // Keep previous data if possible? Or clear it? 
      // Let's keep data if available, but show error. 
      // If it's a "not found" error, maybe we should clear.
      // setLocationError(cityName ? `Could not find "${cityName}". Try another city.` : 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }



  // Removed: This caused infinite loop because loadData() can call setCity()

  // LEGAL GUARD: Check terms before any sensitive action
  const checkTermsAndAction = (action: () => void) => {
    if (userProfile?.is_terms_agreed) {
      action();
    } else {
      setTermsTriggerAction(() => action);
      setShowTermsModal(true);
    }
  };

  const executeAnalysis = async (feedback?: string) => {
    if (!data) return;
    setAnalyzing(true);
    try {
      const result = await fetchAIAnalysis(
        data.crop,
        data.indoor.temperature,
        data.indoor.humidity,
        data.weather.rain,
        data.weather.wind_speed,
        feedback // Pass feedback if exists
      );

      if (result.insight && typeof result.insight === 'object') {
        setAiInsight(result.insight.analysis_text);
        // Update global data state with new metadata
        setData(prev => prev ? ({
          ...prev,
          ai_meta: {
            confidence_score: result.insight.confidence_score,
            user_question: result.insight.validation_question
          }
        }) : null);
      } else {
        setAiInsight(result.insight);
      }
    } catch (e) {
      setAiInsight("⚠️ Connection Error: Unable to reach AI services. Please check backend logs.");
    } finally {
      setAnalyzing(false);
    }
  };

  async function handleAnalyze() {
    checkTermsAndAction(() => executeAnalysis());
  }

  async function handleFeedback(response: string) {
    // User answered the question (e.g., "Yes" leads to "Leaves are wilting")
    let feedbackText = `User visual confirmation: ${response}`;
    if (response === "Yes") feedbackText = "Visual Check: Leaves are definitely wilting/abnormal.";
    if (response === "No") feedbackText = "Visual Check: Leaves look healthy and normal.";

    // Trigger re-analysis with strict feedback
    executeAnalysis(feedbackText);
  }

  const handleCalibrationSubmit = async (realTemp: number) => {
    setShowCalibration(false);
    try {
      // Assume current weather is available in data
      await calibrateSensors(realTemp, data?.weather);
      alert("Physics Engine Calibrated! The system will now learn from this offset.");
      loadData(); // Reload to see if estimate changes (though it learns slowly)
    } catch (e) {
      alert("Calibration failed. Please try again.");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];

    setAnalyzing(true);
    try {
      const result = await uploadImageForDiagnosis(file);
      // Assuming the result comes back as a text analysis
      // We force an update to the insight view
      setAiInsight(`[IMAGE ANALYSIS RESULT]\n${result.analysis || result}`);
      // Clear meta since this is a direct image result
      setData(prev => prev ? ({ ...prev, ai_meta: undefined }) : null);
    } catch (err) {
      alert("Image analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  };


  const handleUpdateState = (newState: any) => {
    // Optimistically update the dashboard with the simulated result
    if (data) {
      setData({
        ...data,
        indoor: {
          ...data.indoor,
          temperature: newState.temperature,
          humidity: newState.humidity,
          vpd: newState.vpd,
          // Keep timestamp/action feedback
        }
      });

      // Show momentary feedback toast? handled by component
    }
  };

  const handleGenerateReport = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/dashboard/reports/weekly?crop_type=${selectedCropId}`);
      if (res.ok) {
        const json = await res.json();
        alert(json.report_text || "Report Generated!");
      } else {
        alert("Failed to generate report.");
      }
    } catch (e) {
      alert("Network error generating report.");
    }
  };

  const handleDataInputClick = () => {
    checkTermsAndAction(() => setShowDataInput(true));
  };

  const handleDataSubmit = (sensorData: any) => {
    loadData();
  };

  if (loading) {
    return (
      <div className="flex flex-col h-[50vh] items-center justify-center text-slate-400">
        <Loader2 className="animate-spin mb-4" size={40} />
        <h3 className="text-lg font-medium text-slate-700">Connecting to Farm Server...</h3>
        <p className="text-sm text-slate-400 mt-2 text-center max-w-md">
          This may take up to 60 seconds if the server is waking up from sleep mode.
          <br />(Free tier limitation)
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col h-[50vh] items-center justify-center text-slate-400">
        <div className="bg-red-50 p-4 rounded-full mb-4">
          <RefreshCw className="text-red-500" size={32} />
        </div>
        <h3 className="text-lg font-semibold text-slate-700">Connection Issue</h3>
        <p className="text-sm mt-2 mb-6 text-center max-w-sm">
          Unable to load dashboard data. Please check your internet connection or try reloading.
        </p>
        <button onClick={() => loadData()} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors">
          Retry
        </button>
      </div>
    );
  }

  // Farm condition calculation
  const farmCondition = getFarmCondition(
    data.indoor.vpd,
    data.indoor.temperature,
    data.indoor.humidity,
    data.weather.rain,
    selectedCropId
  );

  const vpdSignal = getVPDSignal(data.indoor.vpd, selectedCropId);

  // --- LOGIN SCREEN ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white">
        <div className="max-w-md w-full text-center space-y-8">
          <div>
            <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30 mb-6">
              <span className="text-3xl">🌱</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight">Smart Farm AI</h1>
            <p className="mt-2 text-slate-400">Autonomous Agricultural Intelligence</p>
          </div>

          <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 backdrop-blur-sm">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 text-left">
                  Access Code / Farm ID
                </label>
                <input
                  type="text"
                  placeholder="Enter Farm ID or create new..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  value={loginFarmId}
                  onChange={(e) => setLoginFarmId(e.target.value)}
                />
              </div>

              <button
                onClick={() => {
                  const idToUse = loginFarmId.trim() || `farm_${Math.random().toString(36).substr(2, 9)}`;
                  localStorage.setItem("farm_id", idToUse);
                  setIsLoggedIn(true);
                  // Force reload of location/data logic is tricky with useEffect deps, 
                  // so we might want to manually call loadData here or reload page.
                  window.location.reload();
                }}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/20 transition-all active:scale-95"
              >
                {loginFarmId.trim() ? "System Login" : "Initialize New Farm"}
              </button>

              {!loginFarmId.trim() && (
                <p className="text-xs text-slate-500">
                  * Leave blank to create a secure random ID
                </p>
              )}
            </div>
          </div>

          <p className="text-xs text-slate-600">
            Protected by Real-time System Integrity Check
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2 px-1">
        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded font-mono">
          FARM-ID: {typeof window !== 'undefined' ? localStorage.getItem("farm_id") : "..."}
        </span>
        <button onClick={() => {
          localStorage.removeItem("farm_id");
          window.location.reload();
        }} className="text-xs text-red-400 hover:text-red-300">
          Logout
        </button>
      </div>
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Dashboard
          </h2>
          <div className="flex items-center gap-2">
            <p className="text-slate-500">Real-time Farm Monitoring & AI Insights</p>
            {data?.indoor?.vpd_status?.includes("Virtual") && (
              <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full border border-purple-200 font-medium">
                ✨ Sensorless Optimized
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <CropSelector
            selectedCropId={selectedCropId}
            onCropChange={setSelectedCropId}
          />
          <LocationDisplay />
        </div>
      </div>

      {/* Today's Farm Condition Banner */}
      {/* Today's Farm Condition Banner */}
      <div className={clsx(
        "p-5 md:p-6 rounded-3xl border shadow-sm transition-all flex flex-col md:flex-row md:items-center gap-4 relative overflow-hidden",
        farmCondition.bgColor,
        farmCondition.borderColor
      )}>
        {/* Decorative Background Blur */}
        <div className={clsx("absolute -right-10 -top-10 w-40 h-40 rounded-full opacity-20 blur-3xl", farmCondition.color.replace('text-', 'bg-'))}></div>

        <div className="flex-shrink-0 bg-white/60 backdrop-blur-sm p-3 rounded-2xl shadow-sm border border-white/50">
          <span className="text-4xl md:text-5xl">{farmCondition.emoji}</span>
        </div>

        <div className="flex-1 z-10">
          <h3 className={clsx("text-xl md:text-2xl font-bold tracking-tight", farmCondition.color)}>
            {farmCondition.message}
          </h3>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
            <span className="text-sm text-slate-600 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
              VPD Status: {vpdSignal.emoji} <span className="text-slate-900 font-bold">{data.indoor.vpd?.toFixed(2)} kPa</span>
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/50 border border-slate-200 text-slate-500 font-medium">
              {vpdSignal.message}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Metrics */}
        <div className="lg:col-span-2 space-y-6">

          {/* Environment Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Indoor Card */}
            <div className="metric-card bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-1 mb-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Indoor Microclimate</p>
                    <div className="group relative">
                      <HelpCircle size={12} className="text-slate-300 hover:text-slate-400 cursor-help" />
                      <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-xl hidden group-hover:block z-50">
                        VPD (Vapor Pressure Deficit) measures the drying power of the air. Key for plant growth.
                      </div>
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-slate-800 mt-2">
                    {data.indoor.vpd ?? "--"} <span className="text-sm font-normal text-slate-400">kPa</span>
                  </h3>
                  <p className={clsx("text-sm font-medium mt-1",
                    data.indoor.vpd_status?.includes("Risk") ? "text-yellow-600" : "text-emerald-600"
                  )}>{data.indoor.vpd_status}</p>

                  {data.indoor.vpd_status?.includes("Virtual") && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-purple-600">
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></span>
                      Physics Model Est.
                      <button
                        onClick={() => setShowCalibration(true)}
                        className="ml-2 px-1.5 py-0.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded text-[10px] uppercase font-bold tracking-wide transition-colors"
                      >
                        Fix?
                      </button>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-slate-500 text-sm">Temp</div>
                  <div className="font-semibold text-lg">{data.indoor.temperature ?? "--"}°F</div>
                  <div className="text-slate-500 text-sm mt-2">Humidity</div>
                  <div className="font-semibold text-lg">{data.indoor.humidity ?? "--"}%</div>
                </div>
              </div>
              {data.indoor.vpd && data.indoor.vpd_status?.includes("Risk") &&
                <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-yellow-400 h-full w-[80%]"></div>
                </div>
              }
              {!data.indoor.temperature && (
                <div className="mt-4 text-xs text-center text-slate-400 bg-slate-50 py-2 rounded-lg border border-dashed border-slate-200">
                  No data recorded today
                </div>
              )}
            </div>

            {/* Outdoor Card */}
            <div className="metric-card bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Outdoor Reference</p>
                  <h3 className="text-3xl font-bold text-slate-800 mt-2">{data.weather.temperature ?? "--"}°F</h3>
                  <p className="text-sm text-slate-500 mt-1">{data.location.name}</p>
                </div>
                <div className="text-right">
                  <div className="text-slate-500 text-sm">Humidity</div>
                  <div className="font-semibold text-lg">{data.weather.humidity ?? "--"}%</div>
                  <div className="text-slate-500 text-sm mt-2">Wind</div>
                  <div className="font-semibold text-lg">{data.weather.wind_speed ?? 0} mph</div>
                </div>
              </div>
            </div>
          </div>

          {/* Empty Sensor State */}
          {/* Empty Sensor State REPLACED by Virtual Controller */}
          <div className="h-[280px]">
            {data && (
              <ControlPanel
                currentIndoor={data.indoor}
                onUpdateState={handleUpdateState}
                onGenerateReport={handleGenerateReport}
              />
            )}
          </div>
        </div>

        {/* Right Column: AI Action Plan */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-700 h-full flex flex-col text-white">
            {/* Header with Connectivity Status */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-xs font-semibold text-indigo-200 uppercase tracking-wider mb-1">AI Diagnostics</p>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold">Hybrid Intelligence</h3>
                  {data.ai_meta && (
                    <div className={clsx("px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                      data.ai_meta.confidence_score > 0.8 ? "bg-emerald-500/20 text-emerald-300" : "bg-yellow-500/20 text-yellow-300"
                    )}>
                      {Math.round(data.ai_meta.confidence_score * 100)}% Confidence
                    </div>
                  )}
                </div>
              </div>
              <div className="p-2 bg-indigo-500/20 rounded-lg">
                <RefreshCw className={clsx("w-6 h-6 text-indigo-300", analyzing ? "animate-spin" : "")} />
              </div>
            </div>

            {/* AI Content Area */}
            <div className="flex-1 overflow-y-auto mb-4 custom-scrollbar">
              {/* 1. Validation Question (High Priority) */}
              {data.ai_meta?.user_question ? (
                <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-yellow-100 mb-2">{data.ai_meta.user_question.text}</p>
                      <div className="flex flex-wrap gap-2">
                        {data.ai_meta.user_question.options.map(opt => (
                          <button
                            key={opt}
                            onClick={() => handleFeedback(opt)}
                            className="px-3 py-1.5 text-xs font-bold bg-yellow-500 text-slate-900 hover:bg-yellow-400 rounded-lg transition-colors shadow-lg shadow-yellow-500/20 active:scale-95"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* 2. Main Analysis Text */}
              {analyzing ? (
                <div className="flex flex-col items-center justify-center h-40 text-indigo-200">
                  <Loader2 className="w-8 h-8 animate-spin mb-3" />
                  <p className="text-sm font-medium">Synthesizing Physics & AI...</p>
                </div>
              ) : (
                <div className="prose prose-invert prose-sm max-w-none">
                  <div className="whitespace-pre-wrap font-light leading-relaxed text-indigo-50">
                    {aiInsight || data.ai_analysis || "System Standby. Waiting for environmental triggers..."}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-indigo-500/30 flex justify-between items-center text-xs text-indigo-300">
              <div className="flex items-center gap-2">
                <span>Safety Guard: Active</span>
                <label className="cursor-pointer hover:text-white transition-colors flex items-center gap-1" title="Upload Plant Photo">
                  <Camera className="w-3.5 h-3.5" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="hover:text-white flex items-center gap-1 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Floating Action Button */}
      <button
        onClick={handleDataInputClick}
        className="fixed bottom-8 right-8 z-40 flex items-center gap-2 px-6 py-4 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg transition-all hover:scale-105"
      >
        <PlusCircle size={24} />
        <span className="font-bold text-lg">Record Data</span>
      </button>

      {/* Modals */}
      {/* LocationSetupModal is now handled by LocationDisplay */}

      {
        showDataInput && (
          <DataInputModal
            onClose={() => setShowDataInput(false)}
            onSubmit={handleDataSubmit}
            isLoggedIn={!!userProfile}
          />
        )
      }

      {
        showTermsModal && (
          <TermsAgreementModal
            isOpen={showTermsModal}
            onAgree={() => {
              setShowTermsModal(false);
              setUserProfile({ ...userProfile, is_terms_agreed: 1 });
              if (termsTriggerAction) termsTriggerAction();
              setTermsTriggerAction(null);
            }}
          />
        )
      }

      {showCalibration && data && (
        <CalibrationModal
          currentEst={data.indoor.temperature}
          onClose={() => setShowCalibration(false)}
          onSubmit={handleCalibrationSubmit}
        />
      )}
    </div >
  );
}
