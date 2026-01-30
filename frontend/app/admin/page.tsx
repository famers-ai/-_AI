'use client';

import { useState } from 'react';
import { Trash2, AlertTriangle, Home } from 'lucide-react';

export default function AdminPage() {
    const [status, setStatus] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const handleReset = async () => {
        if (!confirm('Are you sure you want to delete test data?\n\nReal user data will be safely preserved.')) {
            return;
        }

        setLoading(true);
        setStatus('Resetting...');

        try {
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

            const res = await fetch(`${API_BASE_URL}/admin/reset-data?confirm=true`, {
                method: 'DELETE',
            });

            if (res.ok) {
                const data = await res.json();
                setStatus(`Success: ${data.message}`);
            } else {
                const errorData = await res.json();
                setStatus(`Error: ${errorData.detail || 'Reset failed'}`);
            }
        } catch (error) {
            console.error(error);
            setStatus('Network error or unable to connect to server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto mt-10">
            <div className="flex items-center gap-3 mb-6">
                <AlertTriangle className="text-red-600" size={32} />
                <h1 className="text-3xl font-bold text-red-600">Admin Zone</h1>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Trash2 size={20} />
                    Clean Test Data
                </h2>
                <p className="text-gray-600 mb-6">
                    This operation will only delete data from <strong>test users (test_user_001)</strong>.
                    <br />
                    <strong>Real user data created via Google login will be safely preserved</strong>.
                    <br /><br />
                    Items to be deleted:
                    <ul className="list-disc ml-6 mt-2">
                        <li>Test user accounts</li>
                        <li>Test sensor measurements</li>
                        <li>Test pest forecasts</li>
                    </ul>
                </p>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleReset}
                        disabled={loading}
                        className={`px-6 py-3 rounded-lg text-white font-medium transition-colors flex items-center gap-2 ${loading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-red-600 hover:bg-red-700'
                            }`}
                    >
                        <Trash2 size={18} />
                        {loading ? 'Processing...' : 'Clean Test Data'}
                    </button>

                    {status && (
                        <div className={`text-sm font-medium ${status.startsWith('Success') ? 'text-green-600' : 'text-red-500'}`}>
                            {status}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 text-center">
                <a href="/" className="text-blue-600 hover:underline flex items-center justify-center gap-2">
                    <Home size={16} />
                    Back to Dashboard
                </a>
            </div>
        </div>
    );
}
