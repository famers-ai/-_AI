"use client";

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSkeletonProps {
    message?: string;
    submessage?: string;
    showProgress?: boolean;
    progress?: number;
}

export function LoadingSkeleton({
    message = "Loading...",
    submessage,
    showProgress = false,
    progress = 0
}: LoadingSkeletonProps) {
    return (
        <div className="flex flex-col h-[50vh] items-center justify-center text-slate-400">
            <div className="relative">
                <Loader2 className="animate-spin mb-4 text-emerald-500" size={48} />
                {showProgress && (
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-xs font-mono text-emerald-400">
                        {progress}%
                    </div>
                )}
            </div>

            <h3 className="text-lg font-medium text-slate-700 mt-4">{message}</h3>

            {submessage && (
                <p className="text-sm text-slate-400 mt-2 text-center max-w-md px-4">
                    {submessage}
                </p>
            )}

            {showProgress && (
                <div className="w-64 h-2 bg-slate-200 rounded-full mt-4 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}
        </div>
    );
}

interface ServerWakeupLoaderProps {
    elapsed: number;
    maxWait?: number;
}

export function ServerWakeupLoader({ elapsed, maxWait = 60 }: ServerWakeupLoaderProps) {
    const progress = Math.min((elapsed / maxWait) * 100, 95);

    const getMessage = () => {
        if (elapsed < 10) return "Connecting to Farm Server...";
        if (elapsed < 20) return "Waking up server...";
        if (elapsed < 40) return "Server is starting up...";
        return "Almost ready...";
    };

    const getSubmessage = () => {
        if (elapsed < 10) {
            return "Establishing secure connection";
        }
        if (elapsed < 20) {
            return "The server was in sleep mode to save resources. This may take up to 60 seconds.";
        }
        if (elapsed < 40) {
            return "Loading your farm data and initializing AI systems...";
        }
        return "Just a few more seconds. Thank you for your patience!";
    };

    return (
        <LoadingSkeleton
            message={getMessage()}
            submessage={getSubmessage()}
            showProgress={true}
            progress={Math.round(progress)}
        />
    );
}

interface DashboardSkeletonProps { }

export function DashboardSkeleton({ }: DashboardSkeletonProps) {
    return (
        <div className="p-6 space-y-6 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center">
                <div className="h-8 bg-slate-200 rounded w-48"></div>
                <div className="h-10 bg-slate-200 rounded w-32"></div>
            </div>

            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-lg p-6 border border-slate-200">
                        <div className="h-4 bg-slate-200 rounded w-24 mb-4"></div>
                        <div className="h-8 bg-slate-200 rounded w-16 mb-2"></div>
                        <div className="h-3 bg-slate-200 rounded w-32"></div>
                    </div>
                ))}
            </div>

            {/* Chart Skeleton */}
            <div className="bg-white rounded-lg p-6 border border-slate-200">
                <div className="h-6 bg-slate-200 rounded w-40 mb-4"></div>
                <div className="h-64 bg-slate-100 rounded"></div>
            </div>

            {/* AI Analysis Skeleton */}
            <div className="bg-white rounded-lg p-6 border border-slate-200">
                <div className="h-6 bg-slate-200 rounded w-48 mb-4"></div>
                <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-full"></div>
                    <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                    <div className="h-4 bg-slate-200 rounded w-4/6"></div>
                </div>
            </div>
        </div>
    );
}

interface DataCardSkeletonProps {
    count?: number;
}

export function DataCardSkeleton({ count = 3 }: DataCardSkeletonProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6 border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-5 bg-slate-200 rounded w-24"></div>
                        <div className="h-8 w-8 bg-slate-200 rounded-full"></div>
                    </div>
                    <div className="h-10 bg-slate-200 rounded w-20 mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-32"></div>
                </div>
            ))}
        </div>
    );
}
