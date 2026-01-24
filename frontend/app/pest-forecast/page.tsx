"use client";

import { useEffect, useState } from "react";
import { fetchPestForecast } from "@/lib/api";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CloudRain, AlertOctagon, Info } from "lucide-react";
import clsx from "clsx";

interface ForecastData {
    Date: string;
    "Risk Score": number;
    Condition: string;
    Pest: string;
    "Rain (in)": number;
}

export default function PestForecastPage() {
    const [data, setData] = useState<ForecastData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Default to San Francisco coords for demo
        fetchPestForecast("Strawberries", 37.7749, -122.4194)
            .then(res => setData(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-400">Loading Forecast Model...</div>;

    const currentRisk = data[0]?.["Risk Score"] || 0;
    const riskColor = currentRisk > 80 ? "text-red-600" : currentRisk > 50 ? "text-yellow-600" : "text-emerald-600";

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                        Pest & Disease Forecast
                    </h2>
                    <p className="text-slate-500">7-Day predictive modeling based on hyper-local weather.</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-400 uppercase font-semibold">Today's Risk</p>
                    <p className={clsx("text-3xl font-bold", riskColor)}>{currentRisk}%</p>
                </div>
            </div>

            {/* Chart Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-[400px]">
                <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <AlertOctagon size={18} /> Risk Trend
                </h3>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="Date" tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { weekday: 'short' })} />
                        <YAxis />
                        <Tooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="Risk Score"
                            stroke="#ef4444"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorRisk)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Daily Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {data.slice(0, 4).map((day, i) => (
                    <div key={i} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <p className="text-sm text-slate-400 font-medium mb-1">
                            {new Date(day.Date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                        </p>
                        <div className="flex justify-between items-center mb-2">
                            <span className={clsx("px-2 py-1 rounded-md text-xs font-bold",
                                day["Risk Score"] > 70 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                            )}>
                                {day["Risk Score"] > 70 ? "High Risk" : "Safe"}
                            </span>
                            {day["Rain (in)"] > 0 && <CloudRain size={16} className="text-blue-400" />}
                        </div>
                        <p className="text-sm text-slate-700 font-medium line-clamp-2 min-h-[40px]">
                            {day.Condition}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
