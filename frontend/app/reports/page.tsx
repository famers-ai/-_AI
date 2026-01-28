'use client';

import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface WeeklySummary {
    avgVpd: number;
    avgTemp: number;
    avgHumidity: number;
    pestRisk: number;
    vpdChange: number;
    tempChange: number;
    humidityChange: number;
    pestChange: number;
}

interface ChartData {
    labels: string[];
    vpd: number[];
    temperature: number[];
    humidity: number[];
}

export default function WeeklyReportPage() {
    const [summary, setSummary] = useState<WeeklySummary>({
        avgVpd: 0.68,
        avgTemp: 67.2,
        avgHumidity: 68,
        pestRisk: 12,
        vpdChange: 5,
        tempChange: -2,
        humidityChange: 3,
        pestChange: 3,
    });

    const [chartData, setChartData] = useState<ChartData>({
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        vpd: [0.65, 0.68, 0.70, 0.67, 0.69, 0.68, 0.67],
        temperature: [66, 67, 68, 67, 68, 67, 66],
        humidity: [70, 68, 66, 69, 67, 68, 70],
    });

    const vpdChartData = {
        labels: chartData.labels,
        datasets: [
            {
                label: 'VPD (kPa)',
                data: chartData.vpd,
                borderColor: 'rgb(16, 185, 129)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4,
            },
        ],
    };

    const tempHumidityChartData = {
        labels: chartData.labels,
        datasets: [
            {
                label: 'Temperature (°F)',
                data: chartData.temperature,
                borderColor: 'rgb(239, 68, 68)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                fill: false,
                tension: 0.4,
                yAxisID: 'y',
            },
            {
                label: 'Humidity (%)',
                data: chartData.humidity,
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: false,
                tension: 0.4,
                yAxisID: 'y1',
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
            },
        },
        scales: {
            y: {
                type: 'linear' as const,
                display: true,
                position: 'left' as const,
            },
            y1: {
                type: 'linear' as const,
                display: true,
                position: 'right' as const,
                grid: {
                    drawOnChartArea: false,
                },
            },
        },
    };

    const getChangeColor = (change: number) => {
        if (change > 0) return 'text-green-600';
        if (change < 0) return 'text-red-600';
        return 'text-gray-600';
    };

    const getChangeIcon = (change: number) => {
        if (change > 0) return '▲';
        if (change < 0) return '▼';
        return '●';
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Weekly Report</h1>
                <p className="text-gray-600">
                    Summary of your farm's performance over the past 7 days
                </p>
            </div>

            {/* Weekly Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-600">Avg VPD</h3>
                        <span className={`text-sm font-semibold ${getChangeColor(summary.vpdChange)}`}>
                            {getChangeIcon(summary.vpdChange)} {Math.abs(summary.vpdChange)}%
                        </span>
                    </div>
                    <div className="text-3xl font-bold text-gray-800">
                        {summary.avgVpd.toFixed(2)} <span className="text-lg text-gray-500">kPa</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Optimal range: 0.4-1.2 kPa</p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-600">Avg Temperature</h3>
                        <span className={`text-sm font-semibold ${getChangeColor(summary.tempChange)}`}>
                            {getChangeIcon(summary.tempChange)} {Math.abs(summary.tempChange)}%
                        </span>
                    </div>
                    <div className="text-3xl font-bold text-gray-800">
                        {summary.avgTemp.toFixed(1)} <span className="text-lg text-gray-500">°F</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Target: 65-75°F</p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-600">Avg Humidity</h3>
                        <span className={`text-sm font-semibold ${getChangeColor(summary.humidityChange)}`}>
                            {getChangeIcon(summary.humidityChange)} {Math.abs(summary.humidityChange)}%
                        </span>
                    </div>
                    <div className="text-3xl font-bold text-gray-800">
                        {summary.avgHumidity} <span className="text-lg text-gray-500">%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Target: 60-70%</p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-600">Pest Risk</h3>
                        <span className={`text-sm font-semibold ${getChangeColor(summary.pestChange)}`}>
                            {getChangeIcon(summary.pestChange)} {Math.abs(summary.pestChange)}%
                        </span>
                    </div>
                    <div className="text-3xl font-bold text-gray-800">
                        {summary.pestRisk} <span className="text-lg text-gray-500">%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Low risk threshold</p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">VPD Trend</h2>
                    <div className="h-64">
                        <Line data={vpdChartData} options={{ ...chartOptions, scales: undefined }} />
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                        Temperature & Humidity
                    </h2>
                    <div className="h-64">
                        <Line data={tempHumidityChartData} options={chartOptions} />
                    </div>
                </div>
            </div>

            {/* AI Insights */}
            <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="text-2xl mr-2">🤖</span>
                    AI Insights & Recommendations
                </h2>
                <div className="space-y-3">
                    <div className="flex items-start">
                        <span className="text-green-600 text-xl mr-3">✅</span>
                        <div>
                            <p className="font-medium text-gray-800">VPD levels optimal for growth</p>
                            <p className="text-sm text-gray-600">
                                Your average VPD of 0.68 kPa is within the ideal range for most crops.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start">
                        <span className="text-yellow-600 text-xl mr-3">⚠️</span>
                        <div>
                            <p className="font-medium text-gray-800">Slight temperature drop detected</p>
                            <p className="text-sm text-gray-600">
                                Temperature decreased by 2% this week. Monitor heating systems.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start">
                        <span className="text-blue-600 text-xl mr-3">💡</span>
                        <div>
                            <p className="font-medium text-gray-800">
                                Consider adjusting humidity control
                            </p>
                            <p className="text-sm text-gray-600">
                                Humidity increased by 3%. Ensure proper ventilation to prevent mold.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start">
                        <span className="text-green-600 text-xl mr-3">📊</span>
                        <div>
                            <p className="font-medium text-gray-800">Pest risk remains low</p>
                            <p className="text-sm text-gray-600">
                                Current conditions are unfavorable for pest development. Continue monitoring.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Weekly Highlights */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Weekly Highlights</h2>
                <div className="space-y-4">
                    <div className="border-l-4 border-green-500 pl-4">
                        <p className="font-medium text-gray-800">Best Day: Wednesday</p>
                        <p className="text-sm text-gray-600">
                            Optimal VPD (0.70 kPa) and temperature (68°F) achieved
                        </p>
                    </div>
                    <div className="border-l-4 border-yellow-500 pl-4">
                        <p className="font-medium text-gray-800">Attention Needed: Monday & Sunday</p>
                        <p className="text-sm text-gray-600">
                            Higher humidity levels (70%) detected. Increase ventilation.
                        </p>
                    </div>
                    <div className="border-l-4 border-blue-500 pl-4">
                        <p className="font-medium text-gray-800">Data Quality: Excellent</p>
                        <p className="text-sm text-gray-600">
                            100% sensor uptime this week. All readings within expected ranges.
                        </p>
                    </div>
                </div>
            </div>

            {/* Export Options */}
            <div className="mt-8 flex justify-end space-x-4">
                <button className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                    Export as PDF
                </button>
                <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    Email Report
                </button>
            </div>
        </div>
    );
}
