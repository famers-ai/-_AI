'use client';

import Link from 'next/link';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6 border-b pb-4">Privacy Policy</h1>

                <div className="prose prose-green max-w-none text-gray-700 space-y-6">
                    <p className="text-sm text-gray-500">Last Updated: January 28, 2026</p>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Introduction</h2>
                        <p>
                            Smart Farm AI ("we", "our", or "us") is committed to protecting your privacy.
                            This Privacy Policy explains how we collect, use, and protect your personal information.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">2. Information We Collect</h2>

                        <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">2.1 Account Information</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Email address (from Google OAuth)</li>
                            <li>Name (from Google OAuth)</li>
                            <li>Profile picture (from Google OAuth)</li>
                        </ul>

                        <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">2.2 Farm Information</h3>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Farm name (optional)</li>
                            <li>Crop type</li>
                            <li>Sensor data (temperature, humidity, etc.)</li>
                            <li>Pest incident reports</li>
                            <li>Crop diagnosis images and results</li>
                        </ul>

                        <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">2.3 Location Information (NEW)</h3>
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r">
                            <p className="font-bold text-blue-800">Privacy-First Approach:</p>
                            <ul className="list-disc pl-5 space-y-1 mt-2 text-blue-700">
                                <li><strong>What we collect:</strong> City, region/state, and country only</li>
                                <li><strong>What we DON'T collect:</strong> Exact GPS coordinates, street addresses, or IP addresses</li>
                                <li><strong>How we collect it:</strong> Either auto-detected from your IP address OR manually entered by you</li>
                                <li><strong>Why we collect it:</strong> To provide personalized weather forecasts and pest alerts for your region</li>
                                <li><strong>Your control:</strong> You can change or delete your location at any time</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">3. How We Use Your Information</h2>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Provide personalized farm management insights</li>
                            <li>Generate AI-powered crop health analysis</li>
                            <li>Send location-based weather and pest forecasts</li>
                            <li>Improve our AI models (anonymized data only)</li>
                            <li>Communicate important service updates</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Data Sharing and Third Parties</h2>
                        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r">
                            <p className="font-bold text-green-800">We DO NOT sell your data.</p>
                            <p className="text-green-700 mt-2">
                                We only share data with:
                            </p>
                            <ul className="list-disc pl-5 space-y-1 mt-2 text-green-700">
                                <li><strong>Google (OAuth):</strong> For authentication only</li>
                                <li><strong>Google Gemini AI:</strong> For crop analysis (images and sensor data)</li>
                                <li><strong>OpenWeather API:</strong> To fetch weather data for your location (city name only)</li>
                            </ul>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">5. Your Rights (GDPR & CCPA Compliant)</h2>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Right to Access:</strong> View all your data at any time</li>
                            <li><strong>Right to Rectification:</strong> Update or correct your information</li>
                            <li><strong>Right to Erasure:</strong> Delete your account and all associated data</li>
                            <li><strong>Right to Data Portability:</strong> Export your data in JSON format</li>
                            <li><strong>Right to Object:</strong> Opt-out of location services</li>
                            <li><strong>Right to Withdraw Consent:</strong> Remove location consent at any time</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">6. Data Security</h2>
                        <p>We implement industry-standard security measures:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>HTTPS encryption for all data transmission</li>
                            <li>Secure database storage</li>
                            <li>Regular security audits</li>
                            <li>Access controls and authentication</li>
                            <li>No storage of exact GPS coordinates</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">7. Data Retention</h2>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Account data: Until you delete your account</li>
                            <li>Sensor data: Until you delete it or your account</li>
                            <li>Location data: Until you delete it or your account</li>
                            <li>Deleted data: Permanently removed within 30 days</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">8. Cookies and Tracking</h2>
                        <p>We use minimal cookies:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Authentication cookies:</strong> To keep you logged in (required)</li>
                            <li><strong>No advertising cookies:</strong> We don't track you for ads</li>
                            <li><strong>No third-party analytics:</strong> We don't use Google Analytics or similar services</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">9. Children's Privacy</h2>
                        <p>
                            Our service is not intended for children under 13 years of age.
                            We do not knowingly collect personal information from children under 13.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">10. International Users</h2>
                        <p>
                            If you are accessing our service from outside the United States, please be aware that
                            your information may be transferred to, stored, and processed in the United States.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">11. Changes to This Policy</h2>
                        <p>
                            We may update this Privacy Policy from time to time. We will notify you of any changes
                            by updating the "Last Updated" date at the top of this policy.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">12. Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy or want to exercise your rights,
                            please contact us at:
                        </p>
                        <div className="bg-gray-100 p-4 rounded mt-2">
                            <p className="font-mono text-sm">privacy@forhumanai.net</p>
                        </div>
                    </section>

                    <div className="pt-8 border-t mt-8 flex justify-between items-center">
                        <Link href="/" className="text-gray-500 hover:text-gray-900">
                            &larr; Back to Home
                        </Link>
                        <Link
                            href="/terms"
                            className="text-green-600 hover:underline"
                        >
                            View Terms of Service →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
