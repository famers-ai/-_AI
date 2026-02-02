"use client";

import { AlertTriangle, RefreshCw, Wifi, Lock, MapPin, Server, Clock } from "lucide-react";

type ErrorType = 'network' | 'auth' | 'location' | 'server' | 'timeout' | 'unknown';

interface ErrorDisplayProps {
    type: ErrorType;
    message: string;
    details?: string;
    canRetry: boolean;
    onRetry?: () => void;
    onDismiss?: () => void;
}

const ERROR_ICONS = {
    network: Wifi,
    auth: Lock,
    location: MapPin,
    server: Server,
    timeout: Clock,
    unknown: AlertTriangle
};

const ERROR_COLORS = {
    network: 'from-orange-500 to-red-500',
    auth: 'from-purple-500 to-pink-500',
    location: 'from-blue-500 to-indigo-500',
    server: 'from-red-500 to-rose-500',
    timeout: 'from-yellow-500 to-orange-500',
    unknown: 'from-gray-500 to-slate-500'
};

export default function ErrorDisplay({
    type,
    message,
    details,
    canRetry,
    onRetry,
    onDismiss
}: ErrorDisplayProps) {
    const Icon = ERROR_ICONS[type];
    const colorClass = ERROR_COLORS[type];

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="max-w-md w-full">
                {/* Error Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-slate-200">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div className={`p-6 rounded-full bg-gradient-to-br ${colorClass} shadow-lg`}>
                            <Icon className="w-12 h-12 text-white" />
                        </div>
                    </div>

                    {/* Message */}
                    <h2 className="text-2xl font-bold text-center text-slate-800 mb-3">
                        {message}
                    </h2>

                    {/* Details */}
                    {details && (
                        <p className="text-center text-slate-600 mb-6 leading-relaxed">
                            {details}
                        </p>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        {canRetry && onRetry && (
                            <button
                                onClick={onRetry}
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={20} />
                                Try Again
                            </button>
                        )}

                        {onDismiss && (
                            <button
                                onClick={onDismiss}
                                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-6 rounded-xl transition-all"
                            >
                                Dismiss
                            </button>
                        )}
                    </div>

                    {/* Help Text */}
                    <div className="mt-6 pt-6 border-t border-slate-200">
                        <p className="text-xs text-center text-slate-500">
                            Need help? Contact{' '}
                            <a
                                href="mailto:support@forhumanai.net"
                                className="text-purple-600 hover:text-purple-700 font-semibold"
                            >
                                support@forhumanai.net
                            </a>
                        </p>
                    </div>
                </div>

                {/* Additional Tips */}
                {type === 'network' && (
                    <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl p-4">
                        <p className="text-sm text-orange-800 font-medium mb-2">💡 Quick Tips:</p>
                        <ul className="text-xs text-orange-700 space-y-1 ml-4 list-disc">
                            <li>Check your WiFi or mobile data connection</li>
                            <li>Try disabling VPN if you're using one</li>
                            <li>Refresh the page after connection is restored</li>
                        </ul>
                    </div>
                )}

                {type === 'location' && (
                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <p className="text-sm text-blue-800 font-medium mb-2">💡 Quick Tips:</p>
                        <ul className="text-xs text-blue-700 space-y-1 ml-4 list-disc">
                            <li>Enable location services in your browser settings</li>
                            <li>Try entering your city name manually</li>
                            <li>Make sure you're using a supported location</li>
                        </ul>
                    </div>
                )}

                {type === 'timeout' && (
                    <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <p className="text-sm text-yellow-800 font-medium mb-2">⏰ Server Waking Up</p>
                        <p className="text-xs text-yellow-700">
                            Our server may be in sleep mode. It usually takes 30-60 seconds to wake up.
                            Please wait a moment and try again.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
