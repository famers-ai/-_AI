"use client";

import { useEffect, useState } from "react";
import { fetchDashboardData, fetchAIAnalysis, fetchUserProfile, type DashboardData } from "@/lib/api";
import { Loader2, RefreshCw, MapPin, Search, PlusCircle } from "lucide-react";
import clsx from "clsx";
import TermsAgreementModal from "@/components/TermsAgreementModal";
import DataInputModal from "@/components/DataInputModal";
import { getFarmCondition, getVPDSignal } from "@/lib/farm-signals";

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState("San Francisco");
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [tempCity, setTempCity] = useState(city);

  // User & Terms State
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsTriggerAction, setTermsTriggerAction] = useState<(() => void) | null>(null);

  // Data Input State
  const [showDataInput, setShowDataInput] = useState(false);

  // AI State
  const [analyzing, setAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);



  async function loadData() {
    setLoading(true);
    try {
      let dashboardData = await fetchDashboardData(city); // use let to allow modification

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

      setData(dashboardData);
    } catch (e) {
      console.error(e);
      // Retry logic could go here, but for now just clear data to show error state
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  function handleCitySubmit(e: React.FormEvent) {
    e.preventDefault();
    setCity(tempCity);
    setIsEditingLocation(false);

  }

  // Effect to reload when city changes (skip initial load as it's handled by empty dep array effect, 
  // but actually let's just combine them)
  useEffect(() => {
    loadData();
  }, [city]);

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
    // Refresh dashboard data after input (in a real app, optimize this)
    loadData();
    // Maybe show a toast notification here
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

  // 농사 컨디션 계산
  const farmCondition = getFarmCondition(
    data.indoor.vpd,
    data.indoor.temperature,
    data.indoor.humidity,
    data.weather.rain
  );

  const vpdSignal = getVPDSignal(data.indoor.vpd);

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
          {isEditingLocation ? (
            <form onSubmit={handleCitySubmit} className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-sm">
              <Search size={14} className="text-slate-400" />
              <input
                type="text"
                value={tempCity}
                onChange={(e) => setTempCity(e.target.value)}
                className="text-sm outline-none text-slate-700 w-32"
                placeholder="Enter City..."
                autoFocus
              />
              <button type="submit" className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-medium hover:bg-emerald-200">
                Set
              </button>
            </form>
          ) : (
            <button
              onClick={() => {
                setTempCity(city);
                setIsEditingLocation(true);
              }}
              className="flex items-center gap-1.5 text-sm bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm hover:border-emerald-200 hover:text-emerald-700 transition-all group"
            >
              <MapPin size={14} className="text-slate-400 group-hover:text-emerald-500" />
              <span className="font-medium text-slate-600 group-hover:text-emerald-700">{data.location.name}</span>
            </button>
          )}

          <button onClick={() => loadData()} className="text-sm text-slate-400 hover:text-emerald-600 font-medium flex items-center gap-1 px-2">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* 🚜 오늘의 농사 컨디션 배너 */}
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
              실내 VPD: {vpdSignal.emoji} {
                data.indoor.vpd !== null && data.indoor.vpd !== undefined && !isNaN(data.indoor.vpd)
                  ? `${data.indoor.vpd.toFixed(2)} kPa`
                  : '측정 중'
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
              {/* Visual bar only shows if risky and data exists */}
              {data.indoor.vpd && data.indoor.vpd_status?.includes("Risk") &&
                <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-yellow-400 h-full w-[80%]"></div>
                </div>
              }
              {/* Data Record Prompt if empty */}
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
