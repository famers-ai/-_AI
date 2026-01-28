import Link from 'next/link';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6 border-b pb-4">Privacy Policy</h1>

                <div className="prose prose-green max-w-none text-gray-700 space-y-6">
                    <p className="text-sm text-gray-500">Last Updated: January 28, 2026</p>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Data We Collect</h2>
                        <p>To provide accurate farming insights, we collect the following data:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>**Farm Data**: Location coordinates (latitude/longitude), crop types.</li>
                            <li>**Sensor Data**: Temperature, humidity, soil moisture readings manually entered or via IoT.</li>
                            <li>**Media**: Images of crops uploaded for diagnosis.</li>
                            <li>**Usage Data**: Interaction with AI features and reports.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">2. How We Use Your Data</h2>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>To generate real-time environmental analysis (VPD, Pest Risk).</li>
                            <li>To provide personalized weekly farming reports.</li>
                            <li>To improve the accuracy of our AI crop diagnosis models.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">3. Data Security</h2>
                        <p>
                            We implement reasonable security measures to protect your personal information.
                            However, no method of transmission over the Internet is 100% secure.
                            We obfuscate location data to protect precise farm locations where possible.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Third-Party Services</h2>
                        <p>
                            We use Google Gemini API for AI analysis and USDA Mars API for market data.
                            Anonymized data may be processed by these services to generate insights.
                        </p>
                    </section>

                    <div className="pt-8 border-t mt-8 flex justify-between items-center">
                        <Link href="/" className="text-gray-500 hover:text-gray-900">
                            &larr; Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
