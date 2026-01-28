'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function ErrorContent() {
    const searchParams = useSearchParams()
    const error = searchParams.get('error')

    const errorMessages: Record<string, string> = {
        Configuration: '서버 설정에 문제가 있습니다. 관리자에게 문의하세요.',
        AccessDenied: '접근이 거부되었습니다.',
        Verification: '인증 토큰이 만료되었거나 이미 사용되었습니다.',
        Default: '인증 중 오류가 발생했습니다.',
    }

    const errorMessage = error ? errorMessages[error] || errorMessages.Default : errorMessages.Default

    return (
        <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mb-2">
                로그인 오류
            </h1>

            <p className="text-slate-600 mb-6">
                {errorMessage}
            </p>

            {error && (
                <div className="w-full bg-slate-50 rounded-lg p-4 mb-6">
                    <p className="text-xs text-slate-500 font-mono">
                        Error Code: {error}
                    </p>
                </div>
            )}

            <Link
                href="/"
                className="w-full px-6 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
            >
                홈으로 돌아가기
            </Link>
        </div>
    )
}

export default function AuthError() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="max-w-md w-full mx-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
                    <Suspense fallback={
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                            </div>
                            <p className="text-slate-600">로딩 중...</p>
                        </div>
                    }>
                        <ErrorContent />
                    </Suspense>
                </div>
            </div>
        </div>
    )
}
