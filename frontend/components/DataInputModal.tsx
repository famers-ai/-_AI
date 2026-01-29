'use client';

import { useState } from 'react';

interface DataInputModalProps {
    onClose: () => void;
    onSubmit: (data: SensorData) => void;
}

interface SensorData {
    temperature: number;
    humidity: number;
    soil_moisture?: number;
    notes?: string;
}

export default function DataInputModal({ onClose, onSubmit }: DataInputModalProps) {
    const [temperature, setTemperature] = useState('');
    const [humidity, setHumidity] = useState('');
    const [soilMoisture, setSoilMoisture] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const data: SensorData = {
                temperature: parseFloat(temperature),
                humidity: parseFloat(humidity),
                soil_moisture: soilMoisture ? parseFloat(soilMoisture) : undefined,
                notes: notes || undefined,
            };

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/sensors/record`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Failed to record data');
            }

            const result = await response.json();
            onSubmit(data);
            onClose();
        } catch (err) {
            setError('Failed to save data. Please try again.');
            console.error('Error recording data:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">📊 Record Farm Data</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                        ×
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Temperature */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            🌡️ Temperature (°F) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            value={temperature}
                            onChange={(e) => setTemperature(e.target.value)}
                            required
                            min="-50"
                            max="150"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="e.g., 68.5"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Typical range: 60-85°F
                        </p>
                    </div>

                    {/* Humidity */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            💧 Humidity (%) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            value={humidity}
                            onChange={(e) => setHumidity(e.target.value)}
                            required
                            min="0"
                            max="100"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="e.g., 65"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Typical range: 40-80%
                        </p>
                    </div>

                    {/* Soil Moisture (Optional) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            🌱 Soil Moisture (%) <span className="text-gray-400">(Optional)</span>
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            value={soilMoisture}
                            onChange={(e) => setSoilMoisture(e.target.value)}
                            min="0"
                            max="100"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder="e.g., 45"
                        />
                    </div>

                    {/* Notes (Optional) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            📝 Notes <span className="text-gray-400">(Optional)</span>
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            maxLength={500}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                            placeholder="Any observations or notes about today's conditions..."
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {notes.length}/500 characters
                        </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Saving...
                                </span>
                            ) : (
                                'Save Data'
                            )}
                        </button>
                    </div>
                </form>

                {/* Info Box */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800">
                        <strong>💡 Tip:</strong> Record data daily for accurate weekly reports and AI insights.
                        The more data you provide, the better recommendations you'll receive!
                    </p>
                </div>
            </div>
        </div>
    );
}
