'use client';

export default function TestAdminPage() {
    const handleCleanup = async () => {
        try {
            // Try multiple possible backend URLs
            const possibleUrls = [
                'https://forhumanai.net/api/admin/reset-data?confirm=true',
                'https://www.forhumanai.net/api/admin/reset-data?confirm=true',
                '/api/admin/reset-data?confirm=true'
            ];

            for (const url of possibleUrls) {
                try {
                    console.log(`Trying: ${url}`);
                    const res = await fetch(url, { method: 'DELETE' });
                    const text = await res.text();
                    console.log(`Response from ${url}:`, res.status, text);
                    alert(`Response from ${url}: ${res.status}\n${text.substring(0, 200)}`);
                } catch (err) {
                    console.error(`Failed ${url}:`, err);
                }
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error: ' + error);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto mt-10">
            <h1 className="text-3xl font-bold mb-6">🔧 Admin Test Page</h1>

            <div className="bg-white p-6 rounded-lg shadow-md border">
                <h2 className="text-xl font-semibold mb-4">Backend Connection Test</h2>
                <p className="text-gray-600 mb-6">
                    This page will try to connect to the backend API and clean up test data.
                </p>

                <button
                    onClick={handleCleanup}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                >
                    Test Backend Connection & Cleanup
                </button>
            </div>

            <div className="mt-8 text-center">
                <a href="/" className="text-blue-600 hover:underline">← Back to Dashboard</a>
            </div>
        </div>
    );
}
