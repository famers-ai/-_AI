'use client';

import { useState } from 'react';

export default function AdminPage() {
    const [status, setStatus] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const handleReset = async () => {
        if (!confirm('경고: 모든 센서 데이터와 예보 데이터가 영구적으로 삭제됩니다. 계속하시겠습니까?')) {
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
                <h2 className="text-xl font-semibold mb-4">데이터베이스 초기화</h2>
                <p className="text-gray-600 mb-6">
                    이 작업은 복구할 수 없습니다. 서버의 모든 '센서 측정값'과 '병해충 예보' 데이터를 삭제합니다.
                    배포된 서버에 남아있는 가짜 데이터를 정리할 때 사용하세요.
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
                        {loading ? '처리 중...' : '데이터 초기화 실행'}
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
