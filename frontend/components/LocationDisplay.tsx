'use client';

import { useState, useEffect } from 'react';
import { MapPin, Settings, AlertCircle, CheckCircle2 } from 'lucide-react';
import LocationSetupModal from './LocationSetupModal';
import { saveLocation, getCachedGeocode, setCachedGeocode } from '@/lib/location';

// Helper to get auth headers
function getAuthHeaders() {
    const headers: Record<string, string> = {
        "Content-Type": "application/json"
    };
    if (typeof window !== 'undefined') {
        const farmId = localStorage.getItem("farm_id");
        if (farmId) {
            headers["X-Farm-ID"] = farmId;
        }
    }
    return headers;
}

// Reverse geocoding with timeout, caching, and better error handling
async function reverseGeocode(lat: number, lon: number): Promise<{
    city: string;
    region: string;
    country: string;
} | null> {
    // Check cache first
    const cached = getCachedGeocode(lat, lon);
    if (cached) {
        return cached;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
            {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'SmartFarmAI/1.0' // Nominatim requires User-Agent
                }
            }
        );
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Geocoding failed: ${response.status}`);
        }

        const data = await response.json();
        const address = data.address;

        const city = address.city || address.town || address.village || address.suburb || address.county;
        const region = address.state || address.region || address.province;
        const country = address.country;

        if (!city) {
            console.warn("Could not determine city from coordinates");
            return null;
        }

        // Cache the successful result
        setCachedGeocode(lat, lon, city, region, country);

        return { city, region, country };
    } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
            console.error("Reverse geocoding timed out");
        } else {
            console.error("Reverse geocoding failed:", error);
        }
        return null;
    }
}

export default function LocationDisplay() {
    const [location, setLocation] = useState<{
        city: string | null;
        region: string | null;
        country: string | null;
        hasLocation: boolean;
    }>({
        city: null,
        region: null,
        country: null,
        hasLocation: false
    });
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        fetchLocation();
    }, []);

    const fetchLocation = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/location/get`, {
                headers: getAuthHeaders()
            });

            if (response.ok) {
                const data = await response.json();
                setLocation(data);

                // Show modal if no location is set
                if (!data.hasLocation) {
                    setShowModal(true);
                }
            } else if (response.status === 401) {
                console.error("Unauthorized - user not logged in");
                setError("Please log in to set your location");
            } else {
                throw new Error(`Failed to fetch location: ${response.status}`);
            }
        } catch (error) {
            console.error('Failed to fetch location:', error);
            setError("Unable to load location. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleLocationSet = async (city?: string, lat?: number, lon?: number) => {
        let cityName = city;
        let regionName = "";
        let countryName = "";
        setError(null);

        // If we have coordinates but no city, perform reverse geocoding
        if (!cityName && lat && lon) {
            const geocodeResult = await reverseGeocode(lat, lon);

            if (geocodeResult) {
                cityName = geocodeResult.city;
                regionName = geocodeResult.region;
                countryName = geocodeResult.country;
            } else {
                // Fallback: use coordinates as identifier
                cityName = `Location (${lat.toFixed(2)}, ${lon.toFixed(2)})`;
                setError("Could not determine city name, but location was saved");
            }
        }

        // Send to backend
        try {
            const payload = {
                city: cityName,
                region: regionName,
                country: countryName,
                consent: true
            };

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/location/set`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                // Optimistically update local state (no full page reload)
                const newLocation = {
                    city: cityName || null,
                    region: regionName || null,
                    country: countryName || null,
                    hasLocation: true
                };
                setLocation(newLocation);

                // Sync with localStorage
                if (cityName) {
                    saveLocation({
                        name: cityName,
                        city: cityName,
                        country: countryName || undefined,
                        lat: lat,
                        lon: lon,
                        timestamp: Date.now()
                    });
                }

                setShowModal(false);
                setSuccessMessage(`Location set to ${cityName}`);

                // Clear success message after 3 seconds
                setTimeout(() => setSuccessMessage(null), 3000);

                // Trigger a custom event for other components to refresh
                window.dispatchEvent(new CustomEvent('locationUpdated', {
                    detail: newLocation
                }));
            } else if (response.status === 401) {
                setError("Please log in to set your location");
            } else {
                const errorData = await response.json().catch(() => ({}));
                setError(errorData.detail || "Failed to save location");
            }
        } catch (error) {
            console.error("Error saving location:", error);
            setError("Network error. Please check your connection.");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-lg shadow-sm border border-slate-200 animate-pulse">
                <MapPin className="text-slate-300" size={18} />
                <div className="h-4 w-32 bg-slate-200 rounded"></div>
            </div>
        );
    }

    return (
        <>
            {/* Error Toast */}
            {error && (
                <div className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top-2">
                    <AlertCircle size={18} className="text-red-500" />
                    <span className="text-sm font-medium">{error}</span>
                    <button
                        onClick={() => setError(null)}
                        className="ml-2 text-red-400 hover:text-red-600"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Success Toast */}
            {successMessage && (
                <div className="fixed top-4 right-4 z-50 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top-2">
                    <CheckCircle2 size={18} className="text-emerald-500" />
                    <span className="text-sm font-medium">{successMessage}</span>
                </div>
            )}

            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <MapPin className="text-green-600" size={18} />

                {location.hasLocation ? (
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                            {location.city}
                            {location.region && `, ${location.region}`}
                        </span>
                        <button
                            onClick={() => setShowModal(true)}
                            className="text-gray-400 hover:text-green-600 transition-colors p-1 rounded hover:bg-green-50"
                            title="Change location"
                        >
                            <Settings size={14} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowModal(true)}
                        className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
                    >
                        Set your location
                    </button>
                )}
            </div>

            <LocationSetupModal
                isOpen={showModal}
                onSkip={() => setShowModal(false)}
                onLocationSet={handleLocationSet}
            />
        </>
    );
}
