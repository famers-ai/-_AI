"use client";

import { useState } from "react";
import { Droplets, Wind, ThermometerSun, Radio, FileText } from "lucide-react";

interface ControlPanelProps {
    currentIndoor: any;
    onUpdateState: (newState: any) => void;
    onGenerateReport: () => void;
}

export default function ControlPanel({ currentIndoor, onUpdateState, onGenerateReport }: ControlPanelProps) {
    const [loadingAction, setLoadingAction] = useState<string | null>(null);

    const performAction = async (action: string) => {
        setLoadingAction(action);
        try {
            // Direct fetch to backend control endpoint/
            // In prod we would use the api.ts wrapper but this is fine for component isolation.
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/dashboard/control`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action,
                    current_state: currentIndoor
                })
            });

            if (res.ok) {
                const newState = await res.json();
                onUpdateState(newState); // Update parent state visually
            }
        } catch (e) {
            console.error("Control Failed", e);
        } finally {
            setTimeout(() => setLoadingAction(null), 800); // Visual delay for effect
        }
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Radio className="text-red-500 animate-pulse" size={18} />
                    Live Control
                </h3>
                <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500 font-mono">
                    MANUAL OVERRIDE
                </span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
                <ControlButton
                    icon={<Droplets size={24} />}
                    label="Irrigate"
                    color="bg-blue-500"
                    onClick={() => performAction('irrigate')}
                    loading={loadingAction === 'irrigate'}
                />
                <ControlButton
                    icon={<Wind size={24} />}
                    label="Ventilate"
                    color="bg-emerald-500"
                    onClick={() => performAction('ventilate')}
                    loading={loadingAction === 'ventilate'}
                />
                <ControlButton
                    icon={<ThermometerSun size={24} />}
                    label="Heater"
                    color="bg-orange-500"
                    onClick={() => performAction('warm')}
                    loading={loadingAction === 'warm'}
                />
            </div>

            <div className="mt-auto pt-6 border-t border-slate-100">
                <button
                    onClick={onGenerateReport}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-slate-900/20"
                >
                    <FileText size={18} />
                    <span className="font-semibold text-sm">Download Weekly Report</span>
                </button>
            </div>

            {currentIndoor.action_feedback && (
                <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-700 font-medium text-center animate-in fade-in slide-in-from-bottom-2">
                    {currentIndoor.action_feedback}
                </div>
            )}
        </div>
    );
}

function ControlButton({ icon, label, color, onClick, loading }: any) {
    return (
        <button
            onClick={onClick}
            disabled={loading}
            className={`flex flex-col items-center justify-center p-4 rounded-xl text-white transition-all active:scale-95 hover:shadow-lg ${color} ${loading ? 'opacity-70 scale-95' : ''}`}
        >
            <div className={loading ? 'animate-bounce' : ''}>
                {icon}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider mt-2">
                {label}
            </span>
        </button>
    )
}
