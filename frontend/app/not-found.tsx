import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-green-50 to-blue-100">
            <div className="text-center px-6">
                {/* 404 Number */}
                <div className="mb-8">
                    <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-blue-600 animate-pulse">
                        404
                    </h1>
                </div>

                {/* Icon */}
                <div className="mb-6 text-8xl">
                    🌱
                </div>

                {/* Message */}
                <h2 className="text-3xl font-bold text-gray-800 mb-4">
                    Page Not Found
                </h2>
                <p className="text-lg text-gray-600 mb-2">
                    Oops! This page seems to have wandered off the farm.
                </p>
                <p className="text-gray-500 mb-8">
                    The page you're looking for doesn't exist or has been moved.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link
                        href="/"
                        className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors shadow-md hover:shadow-lg"
                    >
                        <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                            />
                        </svg>
                        Return to Dashboard
                    </Link>

                    <Link
                        href="/crop-doctor"
                        className="inline-flex items-center px-6 py-3 border-2 border-green-600 text-green-600 font-medium rounded-lg hover:bg-green-50 transition-colors"
                    >
                        <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                        AI Crop Doctor
                    </Link>
                </div>

                {/* Helpful Links */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-4">Quick Links:</p>
                    <div className="flex flex-wrap justify-center gap-4 text-sm">
                        <Link href="/pest-forecast" className="text-green-600 hover:text-green-700 hover:underline">
                            Pest Forecast
                        </Link>
                        <Link href="/market-prices" className="text-green-600 hover:text-green-700 hover:underline">
                            Market Prices
                        </Link>
                        <Link href="/reports" className="text-green-600 hover:text-green-700 hover:underline">
                            Weekly Report
                        </Link>
                        <Link href="/voice-log" className="text-green-600 hover:text-green-700 hover:underline">
                            Voice Log
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
