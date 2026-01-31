"use client";

import { useEffect, useState } from "react";
import { fetchDashboardData, fetchAIAnalysis, fetchUserProfile, calibrateSensors, uploadImageForDiagnosis, type DashboardData } from "@/lib/api";
import { Loader2, RefreshCw, PlusCircle, AlertTriangle, Settings2, Camera } from "lucide-react";
import clsx from "clsx";
import TermsAgreementModal from "@/components/TermsAgreementModal";
import DataInputModal from "@/components/DataInputModal";
import CalibrationModal from "@/components/CalibrationModal";

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

  // Strategy 1: Detect user's country on mount
  useEffect(() => {
    const country = detectUserCountry();
    // setUserCountry removed
    console.log(`🌍 Detected user country: ${country || 'Unknown'}`);
  }, []);

  // Strategy 2: Check for saved location or show setup modal on first visit
  useEffect(() => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      {/* Header */}
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
      <div className={clsx(
        "p-4 md:p-6 rounded-2xl border-2 shadow-sm transition-all",
        farmCondition.bgColor,
        farmCondition.borderColor
      )}>
        <div className="flex items-center gap-3">
          <div className="text-4xl md:text-5xl">{farmCondition.emoji}</div>
          <div className="flex-1">
            <h3 className={clsx("text-lg md:text-xl font-bold", farmCondition.color)}>
              {farmCondition.message}
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Indoor VPD: {vpdSignal.emoji} {
                data.indoor.vpd !== null && data.indoor.vpd !== undefined && !isNaN(data.indoor.vpd)
                  ? `${data.indoor.vpd.toFixed(2)} kPa`
                  : 'Measuring...'
              } - {vpdSignal.message}
            </p>
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
                  <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Indoor Environment</p>
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
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm text-slate-400 mb-3">
              <span className="text-2xl">📡</span>
            </div>
            <h3 className="font-medium text-slate-900">No Physical Sensors Connected</h3>
            <p className="text-sm text-slate-500 mt-1">Connect IoT devices to view real-time Soil Moisture & EC.</p>
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
