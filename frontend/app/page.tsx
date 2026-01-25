"use client";

import { useEffect, useState } from "react";
import { fetchDashboardData, fetchAIAnalysis, type DashboardData } from "@/lib/api";
import { Loader2, RefreshCw } from "lucide-react";
import clsx from "clsx";

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // AI State
  const [analyzing, setAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const dashboardData = await fetchDashboardData();
      setData(dashboardData);
    } catch (e) {
      console.error(e);
      // Retry logic could go here, but for now just clear data to show error state
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyze() {
    if (!data) return;
    setAnalyzing(true);
    try {
      // Pass combined indoor/outdoor context logic here, simplified for demo
      const result = await fetchAIAnalysis(
        data.crop,
        data.indoor.temperature, // Using indoor temp for analysis context
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
  }

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
        <h3 className="text-lg font-semibold text-slate-700">Unable to Connect</h3>
        <p className="text-sm mt-2 mb-6">The SmartFarm Backend seems to be offline.</p>
        <button onClick={loadData} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors">
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Dashboard
          </h2>
          <p className="text-slate-500">Real-time Farm Monitoring & AI Insights</p>
        </div>
        <button onClick={loadData} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
          <RefreshCw size={14} /> Refresh
        </button>
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
                  <h3 className="text-3xl font-bold text-slate-800 mt-2">{data.indoor.vpd} <span className="text-sm font-normal text-slate-400">kPa</span></h3>
                  <p className={clsx("text-sm font-medium mt-1",
                    data.indoor.vpd_status.includes("Risk") ? "text-yellow-600" : "text-emerald-600"
                  )}>{data.indoor.vpd_status}</p>
                </div>
                <div className="text-right">
                  <div className="text-slate-500 text-sm">Temp</div>
                  <div className="font-semibold text-lg">{data.indoor.temperature}°F</div>
                  <div className="text-slate-500 text-sm mt-2">Humidity</div>
                  <div className="font-semibold text-lg">{data.indoor.humidity}%</div>
                </div>
              </div>
              {/* Visual bar only shows if risky */}
              {data.indoor.vpd_status.includes("Risk") &&
                <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-yellow-400 h-full w-[80%]"></div>
                </div>
              }
            </div>

            {/* Outdoor Card */}
            <div className="metric-card bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Outdoor Reference</p>
                  <h3 className="text-3xl font-bold text-slate-800 mt-2">{data.weather.temperature}°F</h3>
                  <p className="text-sm text-slate-500 mt-1">{data.location.name}</p>
                </div>
                <div className="text-right">
                  <div className="text-slate-500 text-sm">Humidity</div>
                  <div className="font-semibold text-lg">{data.weather.humidity}%</div>
                  <div className="text-slate-500 text-sm mt-2">Wind</div>
                  <div className="font-semibold text-lg">{data.weather.wind_speed} mph</div>
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
                    Click analyze to get a real-time diagnosis for your {data.crop}.
                  </p>
                )}
              </div>

              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className={clsx(
                  "w-full font-medium py-3 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2",
                  analyzing ? "bg-slate-100 text-slate-400 shadow-none cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200"
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
    </div>
  );
}
