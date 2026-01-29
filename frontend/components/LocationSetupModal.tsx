'use client';

import { useState, useEffect } from 'react';
import { MapPin, X, Loader2, Globe } from 'lucide-react';

interface LocationSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLocationSet: (city: string, region: string, country: string) => void;
}

export default function LocationSetupModal({ isOpen, onClose, onLocationSet }: LocationSetupModalProps) {
    const [step, setStep] = useState<'choice' | 'auto' | 'manual'>('choice');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Manual input state
    const [city, setCity] = useState('');
    const [region, setRegion] = useState('');
    const [country, setCountry] = useState('');

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep('choice');
            setCity('');
            setRegion('');
            setCountry('');
            setError(null);
            setLoading(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleAutoDetect = async () => {
        setStep('auto');
        setLoading(true);
        setError(null);

        try {
            // Client-side detection ensures correct User IP usage and transparency
            // Using ipapi.co (Primary)
            let response = await fetch('https://ipapi.co/json/');
            let data;

            if (response.ok) {
                data = await response.json();
            } else {
                // Fallback: ip-api.com
                console.warn('ipapi.co failed, trying fallback...');
                response = await fetch('http://ip-api.com/json/');
                const fallbackData = await response.json();
                if (fallbackData.status === 'success') {
                    data = {
                        city: fallbackData.city,
                        region: fallbackData.regionName,
                        country: fallbackData.country
                    };
                } else {
                    throw new Error('All location services failed');
                }
            }

            if (!data.city) throw new Error('City not found in response');

            // Show detected location and ask for confirmation
            setCity(data.city);
            setRegion(data.region || '');
            setCountry(data.country || data.country_name || '');
            setLoading(false);

        } catch (err) {
            console.error(err);
            setError('Unable to detect location automatically. Please try manual input.');
            setLoading(false);
            setStep('manual');
        }
    };

    const handleManualInput = () => {
        setStep('manual');
        setCity('');
        setRegion('');
        setCountry('');
    };

    const handleSaveLocation = async () => {
        if (!city || !country) {
            setError('Please enter at least city and country');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/location/set`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    city,
                    region,
                    country,
                    consent: true
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save location');
            }

            onLocationSet(city, region, country);
            onClose();

        } catch (err) {
            setError('Failed to save location. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <X size={24} />
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MapPin className="text-green-600" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Set Your Location</h2>
                    <p className="text-sm text-gray-500 mt-2">
                        Get personalized weather and pest forecasts for your farm
                    </p>
                </div>

                {/* Content */}
                {step === 'choice' && (
                    <div className="space-y-4">
                        <button
                            onClick={handleAutoDetect}
                            className="w-full py-4 px-6 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <Globe size={20} />
                            Auto-Detect Location
                        </button>

                        <button
                            onClick={handleManualInput}
                            className="w-full py-4 px-6 border-2 border-green-600 text-green-600 hover:bg-green-50 rounded-lg font-medium transition-colors"
                        >
                            Enter Manually
                        </button>

                        <button
                            onClick={onClose}
                            className="w-full py-2 text-gray-500 hover:text-gray-700 text-sm"
                        >
                            Skip for now
                        </button>

                        {/* Privacy notice */}
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-xs text-blue-800">
                                <strong>🔒 Privacy:</strong> We only store your city and region, not your exact GPS coordinates.
                                You can change or delete this anytime in Settings.
                            </p>
                        </div>
                    </div>
                )}

                {step === 'auto' && (
                    <div className="space-y-4">
                        {loading ? (
                            <div className="text-center py-8">
                                <Loader2 className="animate-spin mx-auto text-green-600 mb-4" size={40} />
                                <p className="text-gray-600">Detecting your location...</p>
                            </div>
                        ) : (
                            <>
                                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                    <p className="text-sm text-gray-600">Detected location:</p>
                                    <p className="text-lg font-semibold text-gray-900">
                                        {city}, {region}, {country}
                                    </p>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={handleSaveLocation}
                                        disabled={loading}
                                        className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                                    >
                                        Confirm
                                    </button>
                                    <button
                                        onClick={handleManualInput}
                                        className="flex-1 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                                    >
                                        Edit
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {step === 'manual' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                City *
                            </label>
                            <input
                                type="text"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                placeholder="e.g., San Francisco"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                State/Region
                            </label>
                            <input
                                type="text"
                                value={region}
                                onChange={(e) => setRegion(e.target.value)}
                                placeholder="e.g., California"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Country *
                            </label>
                            <input
                                type="text"
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                placeholder="e.g., United States"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-800">{error}</p>
                            </div>
                        )}

                        <button
                            onClick={handleSaveLocation}
                            disabled={loading || !city || !country}
                            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Saving...
                                </>
                            ) : (
                                'Save Location'
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
