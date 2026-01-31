"use client";

import { useState } from "react";
import { X, Thermometer, CheckCircle2 } from "lucide-react";

interface CalibrationModalProps {
    onClose: () => void;
    onSubmit: (temp: number) => void;
    currentEst: number;
}

export default function CalibrationModal({ onClose, onSubmit, currentEst }: CalibrationModalProps) {
    const [value, setValue] = useState<string>("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const num = parseFloat(value);
        if (!isNaN(num)) {
            onSubmit(num);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-2 text-slate-700">
                        <Thermometer className="w-5 h-5 text-purple-600" />
                        <h3 className="font-bold">Physics Calibration</h3>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                        Help the AI learn! If the estimated temperature (<span className="font-bold text-slate-800">{currentEst}°F</span>) is wrong, please enter the <span className="underline decoration-purple-400 decoration-2">REAL</span> temperature below.
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                Actual Temperature (°F)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.1"
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    placeholder="e.g. 78.5"
                                    className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all font-medium text-lg"
                                    autoFocus
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                                    °F
                                </span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!value}
                            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-purple-500/20 active:scale-95 flex items-center justify-center gap-2"
                        >
                            <CheckCircle2 size={18} />
                            Calibrate Engine
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
