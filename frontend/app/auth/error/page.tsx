'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const errorMessages: { [key: string]: string } = {
    Configuration: 'There is a problem with the server configuration. Please contact the administrator.',
    AccessDenied: 'Access denied.',
    Verification: 'The authentication token has expired or has already been used.',
    Default: 'An error occurred during authentication.',
};

function ErrorContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get('error');
    const message = errorMessages[error || 'Default'] || errorMessages.Default;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                            className="w-8 h-8 text-red-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                        </svg>
                    </div>

                    <h1 className="text-2xl font-bold text-slate-800 mb-2">
                        Login Error
                    </h1>

                    <p className="text-slate-600 mb-6">
                        {message}
                    </p>

                    <div className="space-y-3">
                        <a
                            href="/"
                            className="block w-full px-6 py-3 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition-colors"
                        >
                            Back to Home
                        </a>

                        {error && (
                            <p className="text-xs text-slate-400">
                                Error code: {error}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AuthErrorPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-slate-600">Loading...</p>
            </div>
        }>
            <ErrorContent />
        </Suspense>
    );
}
