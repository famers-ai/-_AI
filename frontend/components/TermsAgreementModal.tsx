'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface TermsAgreementModalProps {
    isOpen: boolean;
    onAgree: () => void;
}

export default function TermsAgreementModal({ isOpen, onAgree }: TermsAgreementModalProps) {
    const [isAgreed, setIsAgreed] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    if (!isOpen) return null;

    const handleAgree = async () => {
        if (!isAgreed) return;

        setIsSubmitting(true);
        try {
            // API call to update user status
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/terms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agreed: true })
            });

            if (response.ok) {
                onAgree();
            }
        } catch (error) {
            console.error('Failed to update terms agreement', error);
            alert('Failed to process. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-black bg-opacity-70 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200">

                {/* Header */}
                <div className="bg-green-600 px-6 py-4">
                    <h2 className="text-xl font-bold text-white flex items-center">
                        📜 Important Legal Notice
                    </h2>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <p className="text-gray-700 font-medium">
                        Before using Smart Farm AI's advanced features (AI Analysis, Reporting), you must review and agree to our terms.
                    </p>

                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 text-sm text-yellow-800">
                        <strong>Disclaimer:</strong> Our AI provides insights for informational purposes only. It is NOT a substitute for professional advice. We do not recommend specific chemical brands.
                    </div>

                    <div className="text-sm text-gray-600 space-y-2">
                        <p>Please read our:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>
                                <Link href="/terms" className="text-blue-600 hover:underline target:_blank">
                                    Terms of Service
                                </Link>
                            </li>
                            <li>
                                <Link href="/privacy" className="text-blue-600 hover:underline target:_blank">
                                    Privacy Policy
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Checkbox */}
                    <div className="flex items-start pt-4">
                        <div className="flex items-center h-5">
                            <input
                                id="terms"
                                type="checkbox"
                                checked={isAgreed}
                                onChange={(e) => setIsAgreed(e.target.checked)}
                                className="w-5 h-5 border-gray-300 rounded text-green-600 focus:ring-green-500 cursor-pointer"
                            />
                        </div>
                        <label htmlFor="terms" className="ml-3 text-sm text-gray-700 cursor-pointer select-none">
                            I have read and agree to the Terms of Service and Privacy Policy. I understand that I am responsible for my own farming decisions.
                        </label>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 flex justify-end">
                    <button
                        onClick={handleAgree}
                        disabled={!isAgreed || isSubmitting}
                        className={`
              px-6 py-2.5 rounded-lg font-semibold text-white transition-all shadow-md
              ${isAgreed && !isSubmitting
                                ? 'bg-green-600 hover:bg-green-700 hover:shadow-lg transform hover:-translate-y-0.5'
                                : 'bg-gray-400 cursor-not-allowed'}
            `}
                    >
                        {isSubmitting ? 'Processing...' : 'Confirm & Continue'}
                    </button>
                </div>
            </div>
        </div>
    );
}
