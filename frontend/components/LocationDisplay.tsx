'use client';

import { useState, useEffect } from 'react';
import { MapPin, Settings } from 'lucide-react';
import LocationSetupModal from './LocationSetupModal';

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

    useEffect(() => {
        fetchLocation();
    }, []);

    const fetchLocation = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/location/get`);

            if (response.ok) {
                const data = await response.json();
                setLocation(data);

                // Show modal if no location is set
                if (!data.hasLocation) {
                    setShowModal(true);
                }
            }
        } catch (error) {
            console.error('Failed to fetch location:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLocationSet = (city: string, region: string, country: string) => {
        setLocation({
            city,
            region,
            country,
            hasLocation: true
        });
        setShowModal(false);
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-gray-400 animate-pulse">
                <MapPin size={16} />
                <span className="text-sm">Loading location...</span>
            </div>
        );
    }

    return (
        <>
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                <MapPin className="text-green-600" size={18} />

                {location.hasLocation ? (
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                            {location.city}
                            {location.region && `, ${location.region}`}
                        </span>
                        <button
                            onClick={() => setShowModal(true)}
                            className="text-gray-400 hover:text-green-600 transition-colors"
                            title="Change location"
                        >
                            <Settings size={14} />
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowModal(true)}
                        className="text-sm text-green-600 hover:text-green-700 font-medium"
                    >
                        Set your location
                    </button>
                )}
            </div>

            <LocationSetupModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onLocationSet={handleLocationSet}
            />
        </>
    );
}
