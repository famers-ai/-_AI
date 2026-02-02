"use client";

import { useEffect, useState } from "react";
import { fetchDashboardData, fetchAIAnalysis, fetchUserProfile, calibrateSensors, uploadImageForDiagnosis, type DashboardData } from "@/lib/api";
import { Loader2, RefreshCw, PlusCircle, AlertTriangle, Settings2, Camera, HelpCircle } from "lucide-react";
import clsx from "clsx";
import TermsAgreementModal from "@/components/TermsAgreementModal";
import DataInputModal from "@/components/DataInputModal";
import CalibrationModal from "@/components/CalibrationModal";
import ControlPanel from "@/components/ControlPanel";
import { ServerWakeupLoader, DashboardSkeleton, EnhancedLoading } from "@/components/LoadingComponents";
import ErrorDisplay from "@/components/ErrorDisplay";

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
import { useSession, signIn, signOut } from "next-auth/react";

// Loading stages for better UX
const LOADING_STAGES = [
  { time: 0, message: "🔐 Authenticating...", stage: "auth" },
  { time: 2, message: "📍 Detecting location...", stage: "location" },
  { time: 5, message: "🌤️ Fetching weather data...", stage: "weather" },
  { time: 10, message: "🧠 Analyzing with AI...", stage: "ai" },
  { time: 15, message: "⏰ Waking up server...", stage: "server" },
  { time: 30, message: "🚀 Almost ready...", stage: "final" }
];

type ErrorType = 'network' | 'auth' | 'location' | 'server' | 'timeout' | 'unknown';

interface AppError {
  type: ErrorType;
  message: string;
  details?: string;
  canRetry: boolean;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingElapsed, setLoadingElapsed] = useState(0); // Track loading time
  const [loadingStage, setLoadingStage] = useState("auth");
  const [error, setError] = useState<AppError | null>(null);
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
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const { data: session, status } = useSession();

  // Get current loading message based on elapsed time
  const getCurrentLoadingStage = () => {
    for (let i = LOADING_STAGES.length - 1; i >= 0; i--) {
      if (loadingElapsed >= LOADING_STAGES[i].time) {
        return LOADING_STAGES[i];
      }
    }
    return LOADING_STAGES[0];
  };


  // Strategy 1: Detect user's country & Check Auth (Google Only)
  useEffect(() => {
    const country = detectUserCountry();
    console.log(`🌍 Detected user country: ${country || 'Unknown'}`);

    // Auth Check - GOOGLE ONLY
    if (status === "authenticated" && session?.user?.email) {
      // Store user email as farm_id for consistency with backend
      const userId = session.user.email;
      localStorage.setItem("farm_id", userId);
      setIsLoggedIn(true);
      setIsAuthChecking(false);
      console.log(`✅ Authenticated as: ${userId}`);
    } else if (status === "unauthenticated") {
      // Clear any stale farm_id
      localStorage.removeItem("farm_id");
      setIsAuthChecking(false);
    }
    // If status is "loading", we wait.

  }, [status, session]);

  // CRITICAL: Sync auth state across tabs to prevent data mixing
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // If farm_id is removed in another tab, log out this tab too
      if (e.key === "farm_id" && e.newValue === null) {
        console.log("🚨 Logout detected in another tab - logging out this tab");
        setIsLoggedIn(false);
        signOut({ callbackUrl: "/" });
      }
      // If farm_id is added in another tab, sync login state
      else if (e.key === "farm_id" && e.newValue !== null && !isLoggedIn) {
        console.log("✅ Login detected in another tab - syncing this tab");
        window.location.reload(); // Reload to sync session
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [isLoggedIn]);

  // Loading timer effect
  useEffect(() => {
    if (!loading) return;

    const timer = setInterval(() => {
      setLoadingElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [loading]);

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
  }, [isLoggedIn]);

  // Listen for location updates from LocationDisplay component
  useEffect(() => {
    const handleLocationUpdate = (event: CustomEvent) => {
      const newLocation = event.detail;
      console.log('📍 Location updated, refreshing dashboard...', newLocation);

      // Reload dashboard data with new location
      if (newLocation.city) {
        loadData(newLocation.city, undefined, undefined, newLocation.country);
      }
    };

    window.addEventListener('locationUpdated', handleLocationUpdate as EventListener);
    return () => {
      window.removeEventListener('locationUpdated', handleLocationUpdate as EventListener);
    };
  }, []);

  async function loadData(cityName?: string, lat?: number, lon?: number, countryCode?: string) {
    setLoading(true);
    setLoadingElapsed(0); // Reset timer
    setLoadingStage("location");
    setError(null); // Clear previous errors

    try {
      const targetCity = cityName || city;

      // Strategy 1: Pass detected country (or saved country) to API for better geocoding
      const targetCountry = countryCode || detectUserCountry() || undefined;

      setLoadingStage("weather");
      let dashboardData = await fetchDashboardData(targetCity, lat, lon, targetCountry);

      // Check for backend error or empty data
      if (!dashboardData || !dashboardData.location || !dashboardData.location.name) {
        throw new Error("Invalid location data received from server");
      }

      setLoadingStage("ai");

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
      setError(null); // Clear any previous errors
    } catch (e: any) {
      console.error("Data loading error:", e);

      // Determine error type and create user-friendly message
      let errorType: ErrorType = 'unknown';
      let errorMessage = 'Failed to load data';
      let errorDetails = e.message;
      let canRetry = true;

      if (e.message?.includes('Failed to fetch') || e.message?.includes('NetworkError')) {
        errorType = 'network';
        errorMessage = 'Unable to connect to server';
        errorDetails = 'Please check your internet connection and try again.';
      } else if (e.message?.includes('401') || e.message?.includes('Unauthorized')) {
        errorType = 'auth';
        errorMessage = 'Authentication required';
        errorDetails = 'Please sign in to continue.';
        canRetry = false;
        // Auto-logout on 401
        localStorage.removeItem('farm_id');
        signOut({ callbackUrl: '/' });
      } else if (e.message?.includes('location') || e.message?.includes('Invalid location')) {
        errorType = 'location';
        errorMessage = 'Location not found';
        errorDetails = cityName
          ? `Could not find "${cityName}". Please try a different location.`
          : 'Unable to detect your location. Please enable GPS or enter manually.';
      } else if (e.message?.includes('timeout') || e.message?.includes('AbortError')) {
        errorType = 'timeout';
        errorMessage = 'Request timed out';
        errorDetails = 'The server might be waking up. Please wait a moment and try again.';
      } else if (e.message?.includes('500') || e.message?.includes('Server Error')) {
        errorType = 'server';
        errorMessage = 'Server error';
        errorDetails = 'Our servers are temporarily unavailable. Please try again in a few moments.';
      }

      setError({
        type: errorType,
        message: errorMessage,
        details: errorDetails,
        canRetry
      });

      // Keep previous data if available (don't clear on error)
      // This allows users to see stale data rather than nothing
    } finally {
      setLoading(false);
      setLoadingElapsed(0); // Reset timer
      setLoadingStage("auth");
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

  // --- RENDER LOGIC ---

  // 1. Auth Check (Splash)
  if (isAuthChecking) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-slate-900 text-slate-500">
        <div className="animate-pulse flex flex-col items-center">
          <span className="text-4xl mb-4">🌱</span>
          <p>Initializing System...</p>
        </div>
      </div>
    )
  }

  // 2. Login Screen (if not logged in) - Google Only
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
            <div className="space-y-6">
              {/* Google Login Only */}
              <button
                onClick={() => signIn("google")}
                className="w-full py-3.5 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <img src="https://authjs.dev/img/providers/google.svg" alt="Google" className="w-5 h-5" />
                Sign in with Google
              </button>

              <p className="text-xs text-slate-500 text-center">
                Secure authentication powered by Google
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-600">
            © 2025 ForHuman AI. Standard Data Rates Apply.
          </p>
        </div>
      </div>
    );
  }

  // 3. Loading Data (Authenticated but fetching)
  if (loading) {
    const currentStage = getCurrentLoadingStage();
    return <EnhancedLoading elapsed={loadingElapsed} stageMessage={currentStage.message} maxWait={60} />;
  }

  // 4. Error State
  if (error) {
    return (
      <ErrorDisplay
        type={error.type}
        message={error.message}
        details={error.details}
        canRetry={error.canRetry}
        onRetry={() => loadData()}
        onDismiss={() => setError(null)}
      />
    );
  }

  // 5. No Data (Fallback)
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
      <div className="flex justify-between items-center mb-2 px-1">
        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded font-mono">
          USER: {session?.user?.email || "..."}
        </span>
        <button onClick={async () => {
          localStorage.removeItem("farm_id");
          await signOut({ callbackUrl: "/" });
        }} className="text-xs text-red-400 hover:text-red-300">
          Logout
        </button>
      </div>
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
              Virtual Sensor System
            </h2>
            <span className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg shadow-purple-500/30 animate-pulse">
              ✨ AI-Powered
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-slate-600 font-medium">Physics-Based Environmental Modeling</p>
            {data?.indoor?.vpd_status?.includes("Virtual") && (
              <span className="bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded-full border border-emerald-200 font-medium">
                🌱 No Hardware Required
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

      {/* Virtual Sensor System Info Banner */}
      {data?.indoor?.vpd_status?.includes("Virtual") && (
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-6 shadow-xl border-2 border-purple-400/50 relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 animate-pulse"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex-shrink-0 bg-white/20 backdrop-blur-sm p-4 rounded-xl border border-white/30">
              <span className="text-5xl">🧠</span>
            </div>

            <div className="flex-1">
              <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                Virtual Sensor System Active
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full border border-white/30">Beta</span>
              </h3>
              <p className="text-purple-100 text-sm leading-relaxed mb-3">
                Our AI combines <strong>outdoor weather data</strong> with <strong>thermodynamic physics models</strong> to estimate your indoor environment.
                <strong className="text-white"> No sensors or hardware required!</strong>
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-xs text-white bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                  Real-time Weather Integration
                </div>
                <div className="flex items-center gap-2 text-xs text-white bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                  Physics-Based Modeling
                </div>
                <button
                  onClick={() => setShowCalibration(true)}
                  className="text-xs bg-white text-purple-700 hover:bg-purple-50 px-4 py-1.5 rounded-full font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105"
                >
                  ⚡ Calibrate for Better Accuracy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Metrics */}
        <div className="lg:col-span-2 space-y-6">

          {/* Environment Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Indoor Card - Virtual Sensor System */}
            <div className="metric-card bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-6 rounded-2xl shadow-md border-2 border-purple-200 flex flex-col justify-between hover:shadow-xl transition-all hover:scale-[1.02]">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 py-1 rounded-full">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                      <p className="text-xs font-bold uppercase tracking-wider">Virtual Sensor Active</p>
                    </div>
                    <div className="group relative">
                      <HelpCircle size={14} className="text-purple-400 hover:text-purple-600 cursor-help" />
                      <div className="absolute left-0 bottom-full mb-2 w-56 p-3 bg-slate-800 text-white text-xs rounded-lg shadow-xl hidden group-hover:block z-50">
                        <p className="font-bold mb-1">🧠 AI Physics Model</p>
                        Our AI combines outdoor weather data with your location to estimate indoor conditions using thermodynamic principles. No sensors needed!
                      </div>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <h3 className="text-4xl font-bold bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">
                      {data.indoor.vpd ?? "--"}
                    </h3>
                    <span className="text-sm font-semibold text-slate-500">kPa VPD</span>
                  </div>

                  <p className={clsx("text-sm font-bold mt-2 flex items-center gap-1.5",
                    data.indoor.vpd_status?.includes("Risk") ? "text-yellow-600" : "text-emerald-600"
                  )}>
                    {data.indoor.vpd_status?.includes("Risk") ? "⚠️" : "✅"} {data.indoor.vpd_status}
                  </p>

                  {data.indoor.vpd_status?.includes("Virtual") && (
                    <div className="mt-3 p-2 bg-purple-100/50 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-purple-700 font-medium">
                          <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></span>
                          AI Physics Model Running
                        </div>
                        <button
                          onClick={() => setShowCalibration(true)}
                          className="px-2 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-md text-xs font-bold uppercase tracking-wide transition-all shadow-sm hover:shadow-md"
                        >
                          Calibrate
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-right ml-4">
                  <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-purple-100 shadow-sm">
                    <div className="text-purple-600 text-xs font-bold uppercase">Temp</div>
                    <div className="font-bold text-2xl text-slate-800">{data.indoor.temperature ?? "--"}°F</div>
                    <div className="text-purple-600 text-xs font-bold uppercase mt-3">Humidity</div>
                    <div className="font-bold text-2xl text-slate-800">{data.indoor.humidity ?? "--"}%</div>
                  </div>
                </div>
              </div>

              {data.indoor.vpd && data.indoor.vpd_status?.includes("Risk") &&
                <div className="mt-4 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-400 h-full w-[80%] animate-pulse"></div>
                </div>
              }
              {!data.indoor.temperature && (
                <div className="mt-4 text-xs text-center text-purple-600 bg-purple-50 py-3 rounded-lg border border-purple-200">
                  🌱 Virtual sensors initializing...
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
          <div className="bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 rounded-2xl p-6 shadow-2xl border-2 border-purple-500/30 h-full flex flex-col text-white">
            {/* Header with Connectivity Status */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50"></span>
                  <p className="text-xs font-semibold text-purple-200 uppercase tracking-wider">AI Diagnostics Engine</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-200 to-indigo-200 bg-clip-text text-transparent">Virtual Intelligence</h3>
                  {data.ai_meta && (
                    <div className={clsx("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                      data.ai_meta.confidence_score > 0.8 ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30" : "bg-yellow-500/20 text-yellow-300 border border-yellow-400/30"
                    )}>
                      {Math.round(data.ai_meta.confidence_score * 100)}% Confidence
                    </div>
                  )}
                </div>
              </div>
              <div className="p-2 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-lg border border-purple-400/30">
                <RefreshCw className={clsx("w-6 h-6 text-purple-300", analyzing ? "animate-spin" : "")} />
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
