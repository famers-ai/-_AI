import Link from 'next/link';

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6 border-b pb-4">Terms of Service (ToS)</h1>

                <div className="prose prose-green max-w-none text-gray-700 space-y-6">
                    <p className="text-sm text-gray-500">Last Updated: January 28, 2026</p>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">1. Acceptance of Terms</h2>
                        <p>
                            By accessing using Smart Farm AI ("the Service"), you agree to be bound by these Terms of Service.
                            If you do not agree, you may not use the Service.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">2. Disclaimer of Warranties (Important)</h2>
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r">
                            <p className="font-bold text-red-800">Please read carefully:</p>
                            <p className="text-red-700 mt-2">
                                Smart Farm AI provides information and insights based on artificial intelligence analysis.
                                <strong>The Service is NOT a substitute for professional agricultural advice.</strong>
                                We do NOT guarantee higher yields, pest prevention, or specific market prices.
                                Any action you take upon the information on this website is strictly at your own risk.
                                We are not liable for any crop loss, financial loss, or legal issues arising from the use of our AI recommendations.
                            </p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">3. User Responsibilities</h2>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>You are responsible for verifying all AI suggestions with local agricultural extension services.</li>
                            <li>You must comply with all local laws regarding pesticide and chemical usage. The AI might suggest treatments that are not registered in your specific region.</li>
                            <li>You are responsible for the accuracy of the data (sensors, images) you upload.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">4. Data Usage</h2>
                        <p>
                            We collect sensor data and farm images to improve our AI models.
                            Please refer to our <Link href="/privacy" className="text-green-600 hover:underline">Privacy Policy</Link> for details.
                        </p>
                    </section>

                    <div className="pt-8 border-t mt-8 flex justify-between items-center">
                        <Link href="/" className="text-gray-500 hover:text-gray-900">
                            &larr; Back to Home
                        </Link>
                        <button
                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
                            onClick={() => window.history.back()}
                        >
                            I Understand & Go Back
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
