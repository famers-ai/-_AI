'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col h-[80vh] items-center justify-center text-slate-500 p-6">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Something went wrong</h2>
                    <p className="text-center mb-6 max-w-sm">
                        An error occurred in the application. Please try again later.
                        <br />
                        <span className="text-xs text-red-400 mt-2 block">{this.state.error?.message}</span>
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                    >
                        <RefreshCw size={16} />
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
