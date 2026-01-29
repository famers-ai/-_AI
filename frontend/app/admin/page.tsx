'use client';

import { useState } from 'react';

export default function AdminPage() {
    const [status, setStatus] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const handleReset = async () => {
        if (!confirm('테스트 데이터를 삭제하시겠습니까?\n\n실제 사용자 데이터는 안전하게 보존됩니다.')) {
            return;
        }

        setLoading(true);
        setStatus('초기화 중...');

        try {
            // Using the environment variable that the app already uses
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

            // We use the new admin endpoint
            const res = await fetch(`${API_BASE_URL}/admin/reset-data?confirm=true`, {
                method: 'DELETE',
            });

            if (res.ok) {
                const data = await res.json();
                setStatus(`성공: ${data.message}`);
                // Optional: Clear any local admin state if needed
            } else {
                const errorData = await res.json();
                setStatus(`오류: ${errorData.detail || '초기화 실패'}`);
            }
        } catch (error) {
            console.error(error);
            setStatus('네트워크 오류 또는 서버에 연결할 수 없습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto mt-10">
            <h1 className="text-3xl font-bold text-red-600 mb-6">⚠️ Admin Zone</h1>

            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <h2 className="text-xl font-semibold mb-4">테스트 데이터 정리</h2>
                <p className="text-gray-600 mb-6">
                    이 작업은 <strong>테스트 사용자(test_user_001)</strong>의 데이터만 삭제합니다.
                    <br />
                    Google 로그인으로 생성된 <strong>실제 사용자 데이터는 안전하게 보존</strong>됩니다.
                    <br /><br />
                    삭제 대상:
                    <ul className="list-disc ml-6 mt-2">
                        <li>테스트 사용자 계정</li>
                        <li>테스트 센서 측정값</li>
                        <li>테스트 병해충 예보</li>
                    </ul>
                </p>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleReset}
                        disabled={loading}
                        className={`px-6 py-3 rounded-lg text-white font-medium transition-colors ${loading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-red-600 hover:bg-red-700'
                            }`}
                    >
                        {loading ? '처리 중...' : '테스트 데이터 정리'}
                    </button>

                    {status && (
                        <div className={`text-sm ${status.startsWith('성공') ? 'text-green-600' : 'text-red-500'}`}>
                            {status}
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 text-center">
                <a href="/" className="text-blue-600 hover:underline">← 대시보드로 돌아가기</a>
            </div>
        </div>
    );
}
