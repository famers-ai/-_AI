"use client";

import { useEffect, useState } from "react";
import { fetchMarketPrices } from "@/lib/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Info } from "lucide-react";
import { formatToUSDate } from "@/lib/utils";

interface PriceData {
    Date: string;
    "Price ($/lb)": number;
}

export default function MarketPricesPage() {
    const [data, setData] = useState<PriceData[]>([]);
    const [source, setSource] = useState("Loading...");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMarketPrices("Strawberries")
            .then(res => {
                setData(res.data);
                setSource(res.source);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-400">Loading Market Data...</div>;

    const currentPrice = data[data.length - 1]?.["Price ($/lb)"] || 0;
    const previousPrice = data[data.length - 2]?.["Price ($/lb)"] || 0;
    const trend = currentPrice >= previousPrice ? "up" : "down";

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                        Market Prices
                    </h2>
                    <p className="text-slate-500">Wholesale price trends (USDA Mars API).</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                        <TrendingUp size={18} /> 7-Day Price Trend
                    </h3>
                    <ResponsiveContainer width="100%" height={320}>
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="Date" tickFormatter={(str) => formatToUSDate(str, { weekday: 'short' })} />
                            <YAxis domain={['auto', 'auto']} tickFormatter={(val) => `$${val}`} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px' }}
                                formatter={(val) => [`$${val}`, "Price"]}
                                labelFormatter={(label) => formatToUSDate(label, { weekday: 'long', month: 'short', day: 'numeric' })}
                            />
                            <Line type="monotone" dataKey="Price ($/lb)" stroke="#059669" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Stats Column */}
                <div className="space-y-4">
                    <div className="bg-emerald-600 text-white p-6 rounded-2xl shadow-lg shadow-emerald-100">
                        <p className="text-emerald-100 text-sm font-medium mb-1">Current Price</p>
                        <h3 className="text-4xl font-bold flex items-center gap-1">
                            <span className="text-2xl opacity-80">$</span>{currentPrice.toFixed(2)}
                        </h3>
                        <p className="text-sm mt-2 flex items-center gap-1 opacity-90">
                            {trend === "up" ? "▲" : "▼"} vs yesterday
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <h4 className="font-semibold text-slate-700 mb-2">Data Source</h4>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            {source}
                        </p>
                        <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2 text-xs text-slate-400">
                            <Info size={14} /> Updated daily at 8:00 AM EST
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
