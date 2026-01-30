"use client";

import { useEffect, useState } from "react";
import { fetchDashboardData, fetchAIAnalysis, fetchUserProfile, type DashboardData } from "@/lib/api";
import { Loader2, RefreshCw, MapPin, Search, PlusCircle, LocateFixed } from "lucide-react";
import clsx from "clsx";
import TermsAgreementModal from "@/components/TermsAgreementModal";
import DataInputModal from "@/components/DataInputModal";
import LocationSetupModal from "@/components/LocationSetupModal";
import { getFarmCondition, getVPDSignal } from "@/lib/farm-signals";
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
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [tempCity, setTempCity] = useState(city);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Location Setup Modal (for first-time visitors)
  const [showLocationSetup, setShowLocationSetup] = useState(false);

  // User & Terms State
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsTriggerAction, setTermsTriggerAction] = useState<(() => void) | null>(null);

  // Data Input State
  const [showDataInput, setShowDataInput] = useState(false);

  // AI State
  const [analyzing, setAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  // Strategy 1: Detect user's country on mount
  useEffect(() => {
    const country = detectUserCountry();
    setUserCountry(country);
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
          setTempCity(savedLoc.city);
          loadData(savedLoc.city);
        }
      } else if (isFirstVisit()) {
        // First visit: show location setup modal
        setShowLocationSetup(true);
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

  async function loadData(cityName?: string, lat?: number, lon?: number) {
    setLoading(true);
    setLocationError(null);
    try {
      const targetCity = cityName || city;

      // Strategy 1: Pass detected country to API for better geocoding
      let dashboardData = await fetchDashboardData(targetCity, lat, lon, userCountry || undefined);

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
          timestamp: Date.now()
        };
        saveLocation(locationToSave);
        // Only update city if it's different to prevent loops
        if (city !== dashboardData.location.name) {
          setCity(dashboardData.location.name);
          setTempCity(dashboardData.location.name);
        }
      } else if (cityName && dashboardData.location.name) {
        // Save city-based location
        const locationToSave: SavedLocation = {
          city: cityName,
          name: dashboardData.location.name,
          timestamp: Date.now()
        };
        saveLocation(locationToSave);
        // Update displayed city name if successful
        setCity(dashboardData.location.name);
        setTempCity(dashboardData.location.name);
      }

      setData(dashboardData);
      setLocationError(null);
    } catch (e: any) {
      console.error(e);
      // setData(null); // Keep previous data if possible? Or clear it? 
      // Let's keep data if available, but show error. 
      // If it's a "not found" error, maybe we should clear.
      setLocationError(cityName ? `Could not find "${cityName}". Try another city.` : 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }

  function handleCitySubmit(e: React.FormEvent) {
    e.preventDefault();
    setCity(tempCity);
    setIsEditingLocation(false);
    // Explicitly load data since we removed the useEffect
    loadData(tempCity);
  }

  // Handle "Use My Location" button
  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        loadData(undefined, latitude, longitude);
        setIsGettingLocation(false);
        setIsEditingLocation(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsGettingLocation(false);
        let msg = "Unable to retrieve your location";
        if (error.code === 1) msg = "Location permission denied";
        else if (error.code === 2) msg = "Location unavailable";
        else if (error.code === 3) msg = "Location request timed out";
        setLocationError(msg);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }

  // Handle location setup modal
  const handleLocationSetup = (city?: string, lat?: number, lon?: number) => {
    setShowLocationSetup(false);
    if (lat && lon) {
      loadData(undefined, lat, lon);
    } else if (city) {
      setCity(city);
      setTempCity(city);
      loadData(city);
    }
  };

  const handleSkipLocationSetup = () => {
    setShowLocationSetup(false);
    loadData(); // Load with default
  };

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

  const executeAnalysis = async () => {
    if (!data) return;
    setAnalyzing(true);
    try {
      const result = await fetchAIAnalysis(
        data.crop,
        data.indoor.temperature,
        data.indoor.humidity,
        data.weather.rain,
        data.weather.wind_speed
      );
      setAiInsight(result.insight);
    } catch (e) {
      setAiInsight("⚠️ Connection Error: Unable to reach AI services. Please check backend logs.");
    } finally {
      setAnalyzing(false);
    }
  };

  async function handleAnalyze() {
    checkTermsAndAction(executeAnalysis);
  }

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
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Dashboard
          </h2>
          <p className="text-slate-500">Real-time Farm Monitoring & AI Insights</p>
        </div>

        <div className="flex items-center gap-2">
          <CropSelector
            selectedCropId={selectedCropId}
            onCropChange={setSelectedCropId}
          />

          {isEditingLocation ? (
            <form onSubmit={handleCitySubmit} className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-sm">
              <Search size={14} className="text-slate-400" />
              <input
                type="text"
                value={tempCity}
                onChange={(e) => setTempCity(e.target.value)}
                onFocus={(e) => e.target.select()}
                className="text-sm outline-none text-slate-700 w-32"
                placeholder="Enter City..."
                autoFocus
              />
              <button type="button" onClick={handleUseCurrentLocation} className="text-slate-400 hover:text-emerald-600" title="Use My Location">
                {isGettingLocation ? <Loader2 size={14} className="animate-spin" /> : <LocateFixed size={14} />}
              </button>
              <button type="submit" className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-medium hover:bg-emerald-200">
                Set
              </button>
            </form>
          ) : (
            <button
              onClick={() => {
                setTempCity('');
                setIsEditingLocation(true);
                setLocationError(null);
              }}
              className="flex items-center gap-1.5 text-sm bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm hover:border-emerald-200 hover:text-emerald-700 transition-all group"
            >
              <MapPin size={14} className="text-slate-400 group-hover:text-emerald-500" />
              <span className="font-medium text-slate-600 group-hover:text-emerald-700">{data.location.name}</span>
            </button>
          )}

          <button
            onClick={handleUseCurrentLocation}
            className="text-sm text-slate-400 hover:text-emerald-600 font-medium flex items-center gap-1 px-2"
            title="Use My Location"
            disabled={isGettingLocation}
          >
            {isGettingLocation ? <Loader2 size={14} className="animate-spin" /> : <LocateFixed size={14} />}
          </button>
        </div>
        {locationError && (
          <div className="mt-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
            {locationError}
          </div>
        )}
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
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl p-6 shadow-sm border border-slate-200 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🤖</span>
              <h3 className="font-bold text-slate-800">AI Agronomist Plan</h3>
            </div>

            <div className="space-y-4 flex-1">
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm min-h-[120px]">
                {aiInsight ? (
                  <div className="prose prose-sm prose-slate max-w-none">
                    <p className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed font-medium">
                      {aiInsight}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic text-center mt-8">
                    {!data.indoor.temperature ?
                      "Please record farm data first to get AI diagnosis." :
                      `Click analyze to get a real-time diagnosis for your ${data.crop}.`
                    }
                  </p>
                )}
              </div>

              <button
                onClick={handleAnalyze}
                disabled={analyzing || !data.indoor.temperature}
                className={clsx(
                  "w-full font-medium py-3 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2",
                  (analyzing || !data.indoor.temperature) ? "bg-slate-100 text-slate-400 shadow-none cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200"
                )}
              >
                {analyzing ? (
                  <><Loader2 className="animate-spin" /> Analyzing...</>
                ) : (
                  <span>Analyze Conditions</span>
                )}
              </button>

              <div className="text-center mt-auto">
                <p className="text-xs text-slate-400">Powered by Gemini 1.5 Flash</p>
              </div>
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
      {showLocationSetup && (
        <LocationSetupModal
          isOpen={showLocationSetup}
          onLocationSet={handleLocationSetup}
          onSkip={handleSkipLocationSetup}
        />
      )}

      {showDataInput && (
        <DataInputModal
          onClose={() => setShowDataInput(false)}
          onSubmit={handleDataSubmit}
          isLoggedIn={!!userProfile}
        />
      )}

      {showTermsModal && (
        <TermsAgreementModal
          isOpen={showTermsModal}
          onAgree={() => {
            setShowTermsModal(false);
            setUserProfile({ ...userProfile, is_terms_agreed: 1 });
            if (termsTriggerAction) termsTriggerAction();
            setTermsTriggerAction(null);
          }}
        />
      )}
    </div>
  );
}
