"use client";

import { useState } from "react";
import { MapPin, LocateFixed, X, Loader2 } from "lucide-react";

interface LocationSetupModalProps {
    isOpen: boolean;
    onLocationSet: (city?: string, lat?: number, lon?: number) => void;
    onSkip: () => void;
}

export default function LocationSetupModal({ isOpen, onLocationSet, onSkip }: LocationSetupModalProps) {
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [manualCity, setManualCity] = useState("");
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleUseGPS = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser");
            return;
        }

        setIsGettingLocation(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                onLocationSet(undefined, latitude, longitude);
                setIsGettingLocation(false);
            },
            (err) => {
                console.error("Geolocation error:", err);
                setIsGettingLocation(false);
                let msg = "Unable to retrieve your location";
                if (err.code === 1) msg = "Access denied. Please enable location permissions.";
                else if (err.code === 2) msg = "Location unavailable";
                else if (err.code === 3) msg = "Location request timed out";
                setError(msg);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualCity.trim()) {
            onLocationSet(manualCity.trim());
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-in fade-in zoom-in duration-300">
                {/* Close button */}
                <button
                    onClick={onSkip}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MapPin className="text-emerald-600" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">
                        Where is your farm?
                    </h2>
                    <p className="text-slate-600 text-sm">
                        We'll use this to provide accurate weather data and local farming insights.
                    </p>
                </div>

                {/* GPS Option */}
                <button
                    onClick={handleUseGPS}
                    disabled={isGettingLocation}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-3 transition-all mb-4 shadow-lg shadow-emerald-200 hover:shadow-xl active:scale-95"
                >
                    {isGettingLocation ? (
                        <>
                            <Loader2 className="animate-spin" size={20} />
                            Getting your location...
                        </>
                    ) : (
                        <>
                            <LocateFixed size={20} />
                            Use My Current Location
                        </>
                    )}
                </button>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200 text-center">
                        {error}
                    </div>
                )}

                {/* Divider */}
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white text-slate-500">or enter manually</span>
                    </div>
                </div>

                {/* Manual Input */}
                <form onSubmit={handleManualSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            City Name
                        </label>
                        <input
                            type="text"
                            value={manualCity}
                            onChange={(e) => setManualCity(e.target.value)}
                            onFocus={(e) => e.target.select()}
                            placeholder="e.g., New York, Tokyo, Seoul"
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!manualCity.trim()}
                        className="w-full bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 disabled:text-slate-400 text-slate-700 font-medium py-3 rounded-lg transition-all"
                    >
                        Set Location
                    </button>
                </form>

                {/* Skip */}
                <button
                    onClick={onSkip}
                    className="w-full text-slate-500 hover:text-slate-700 text-sm font-medium mt-4 transition-colors"
                >
                    Skip for now
                </button>

                {/* Privacy Note */}
                <p className="text-xs text-slate-400 text-center mt-6">
                    🔒 Your location is only used for weather data and is not shared with third parties.
                </p>
            </div>
        </div>
    );
}
