'use client';

import { useState, useEffect, useRef } from 'react';

interface VoiceLog {
    id: string;
    text: string;
    timestamp: Date;
    category: 'observation' | 'task' | 'issue' | 'note' | 'harvest';
    parsedData?: {
        crop?: string;
        quantity?: number;
        unit?: string;
        action?: string;
    };
}

// 🤖 AI 파싱 함수 - 자연어를 구조화된 데이터로 변환 (개선 버전)
function parseVoiceInput(text: string): VoiceLog['parsedData'] {
    const lowerText = text.toLowerCase();

    // 한글 숫자를 아라비아 숫자로 변환
    const koreanNumbers: { [key: string]: string } = {
        '일': '1', '이': '2', '삼': '3', '사': '4', '오': '5',
        '육': '6', '칠': '7', '팔': '8', '구': '9', '십': '10',
        '백': '100', '천': '1000', '만': '10000'
    };

    let processedText = text;
    Object.keys(koreanNumbers).forEach(korean => {
        processedText = processedText.replace(new RegExp(korean, 'g'), koreanNumbers[korean]);
    });

    // 작물 감지 (더 많은 작물 추가, 복수형 지원)
    const cropPatterns = [
        { pattern: /(고추|pepper|peppers|칠리)/i, name: '고추' },
        { pattern: /(토마토|tomato|tomatoes)/i, name: '토마토' },
        { pattern: /(딸기|strawberry|strawberries)/i, name: '딸기' },
        { pattern: /(상추|lettuce)/i, name: '상추' },
        { pattern: /(오이|cucumber|cucumbers)/i, name: '오이' },
        { pattern: /(호박|pumpkin|squash)/i, name: '호박' },
        { pattern: /(배추|cabbage)/i, name: '배추' },
        { pattern: /(무|radish)/i, name: '무' },
        { pattern: /(파|green onion|scallion)/i, name: '파' },
        { pattern: /(감자|potato|potatoes)/i, name: '감자' },
    ];

    const detectedCrops = cropPatterns
        .filter(cp => cp.pattern.test(text))
        .map(cp => cp.name);
    const detectedCrop = detectedCrops.length > 0 ? detectedCrops.join(', ') : undefined;

    // 수량 감지 (더 많은 패턴 지원)
    const quantityPatterns = [
        /(\d+(?:\.\d+)?)\s*(kg|킬로그램|킬로|키로)/i,
        /(\d+(?:\.\d+)?)\s*(개|box|박스|상자)/i,
        /(\d+(?:\.\d+)?)\s*(포기|그루|주)/i,
        /(\d+(?:\.\d+)?)\s*(톤|ton)/i,
        /(\d+(?:\.\d+)?)\s*(g|그램|gram)/i,
        /(\d+(?:\.\d+)?)\s*(lb|파운드|pound)/i,
    ];

    let quantity: number | undefined;
    let unit: string | undefined;

    for (const pattern of quantityPatterns) {
        const match = processedText.match(pattern);
        if (match) {
            quantity = parseFloat(match[1]);
            unit = match[2];
            // 단위 정규화
            if (unit.match(/킬로그램|킬로|키로/i)) unit = 'kg';
            if (unit.match(/그램/i)) unit = 'g';
            if (unit.match(/박스|상자/i)) unit = 'box';
            if (unit.match(/파운드/i)) unit = 'lb';
            break;
        }
    }

    // 행동 감지 (더 많은 패턴)
    let action = 'note';
    if (lowerText.match(/수확|harvest|땄|딴|캤|캐/)) action = 'harvest';
    else if (lowerText.match(/심었|심기|plant|파종|씨/)) action = 'planted';
    else if (lowerText.match(/물|water|관수|급수/)) action = 'watered';
    else if (lowerText.match(/비료|fertilize|거름|영양/)) action = 'fertilized';
    else if (lowerText.match(/병|pest|해충|벌레|곰팡이/)) action = 'pest_issue';
    else if (lowerText.match(/가지치기|pruning|정리/)) action = 'pruned';

    return {
        crop: detectedCrop,
        quantity,
        unit,
        action
    };
}

export default function VoiceLogPage() {
    const [isRecording, setIsRecording] = useState(false);
    const [logs, setLogs] = useState<VoiceLog[]>([]);
    const [currentTranscript, setCurrentTranscript] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<VoiceLog['category']>('observation');
    const [isSupported, setIsSupported] = useState(true);
    const [showParsedData, setShowParsedData] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState<'ko-KR' | 'en-US'>('ko-KR');
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        // 브라우저 언어 자동 감지
        const browserLang = navigator.language;
        if (browserLang.startsWith('ko')) {
            setSelectedLanguage('ko-KR');
        } else {
            setSelectedLanguage('en-US');
        }

        // Check if browser supports Web Speech API
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (!SpeechRecognition) {
                setIsSupported(false);
                return;
            }

            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = selectedLanguage;

            recognition.onresult = (event: any) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                    } else {
                        interimTranscript += transcript;
                    }
                }

                setCurrentTranscript(finalTranscript || interimTranscript);
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                setIsRecording(false);
            };

            recognition.onend = () => {
                if (isRecording) {
                    recognition.start();
                }
            };

            recognitionRef.current = recognition;
        }

        // Load logs from localStorage
        const savedLogs = localStorage.getItem('voiceLogs');
        if (savedLogs) {
            const parsed = JSON.parse(savedLogs);
            setLogs(parsed.map((log: any) => ({
                ...log,
                timestamp: new Date(log.timestamp),
            })));
        }
    }, [selectedLanguage]); // selectedLanguage 변경 시 재초기화

    const startRecording = () => {
        if (!recognitionRef.current) return;

        setCurrentTranscript('');
        setIsRecording(true);
        recognitionRef.current.start();
    };

    const stopRecording = () => {
        if (!recognitionRef.current) return;

        setIsRecording(false);
        recognitionRef.current.stop();

        if (currentTranscript.trim()) {
            addLog(currentTranscript.trim());
        }
    };

    const addLog = (text: string) => {
        // 🤖 AI 파싱 실행
        const parsedData = parseVoiceInput(text);

        // 자동 카테고리 설정
        let autoCategory = selectedCategory;
        if (parsedData?.action === 'harvest') autoCategory = 'harvest';

        const newLog: VoiceLog = {
            id: Date.now().toString(),
            text,
            timestamp: new Date(),
            category: autoCategory,
            parsedData: parsedData && Object.keys(parsedData).some(k => parsedData[k as keyof typeof parsedData] !== undefined)
                ? parsedData
                : undefined,
        };

        const updatedLogs = [newLog, ...logs];
        setLogs(updatedLogs);

        // Save to localStorage
        localStorage.setItem('voiceLogs', JSON.stringify(updatedLogs));

        setCurrentTranscript('');
        setShowParsedData(true);
        setTimeout(() => setShowParsedData(false), 3000);
    };

    const deleteLog = (id: string) => {
        const updatedLogs = logs.filter(log => log.id !== id);
        setLogs(updatedLogs);
        localStorage.setItem('voiceLogs', JSON.stringify(updatedLogs));
    };

    const getCategoryColor = (category: VoiceLog['category']) => {
        switch (category) {
            case 'observation':
                return 'bg-blue-100 text-blue-800';
            case 'task':
                return 'bg-green-100 text-green-800';
            case 'issue':
                return 'bg-red-100 text-red-800';
            case 'note':
                return 'bg-yellow-100 text-yellow-800';
            case 'harvest':
                return 'bg-emerald-100 text-emerald-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getCategoryIcon = (category: VoiceLog['category']) => {
        switch (category) {
            case 'observation':
                return '👁️';
            case 'task':
                return '✅';
            case 'issue':
                return '⚠️';
            case 'note':
                return '📝';
            case 'harvest':
                return '🌾';
            default:
                return '💬';
        }
    };

    const formatTimestamp = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    };

    if (!isSupported) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <h2 className="text-2xl font-bold text-red-800 mb-2">
                        Browser Not Supported
                    </h2>
                    <p className="text-red-600">
                        Your browser doesn't support the Web Speech API. Please use Chrome, Edge, or Safari.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Voice Log</h1>
                <p className="text-gray-600">
                    Record quick observations and notes about your farm using voice commands
                </p>
            </div>

            {/* Recording Interface */}
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg shadow-md p-8 mb-8">
                <div className="flex flex-col items-center">
                    {/* Recording Button */}
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`w-32 h-32 rounded-full flex items-center justify-center text-white text-4xl transition-all duration-300 shadow-lg ${isRecording
                            ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                            : 'bg-green-600 hover:bg-green-700'
                            }`}
                    >
                        {isRecording ? '⏹️' : '🎤'}
                    </button>

                    <p className="mt-4 text-lg font-medium text-gray-700">
                        {isRecording ? 'Recording... Click to stop' : 'Click to start recording'}
                    </p>

                    {/* 언어 선택 */}
                    <div className="mt-3 flex justify-center gap-2">
                        <button
                            onClick={() => setSelectedLanguage('ko-KR')}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${selectedLanguage === 'ko-KR'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            🇰🇷 한국어
                        </button>
                        <button
                            onClick={() => setSelectedLanguage('en-US')}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${selectedLanguage === 'en-US'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            🇺🇸 English
                        </button>
                    </div>

                    {/* Category Selection */}
                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                        {(['observation', 'task', 'issue', 'note', 'harvest'] as const).map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedCategory === category
                                    ? getCategoryColor(category)
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {getCategoryIcon(category)} {category.charAt(0).toUpperCase() + category.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Current Transcript */}
                    {currentTranscript && (
                        <div className="mt-6 w-full max-w-2xl bg-white rounded-lg shadow p-4">
                            <p className="text-gray-700 italic">"{currentTranscript}"</p>
                        </div>
                    )}

                    {/* 🤖 AI 파싱 결과 표시 */}
                    {showParsedData && logs.length > 0 && logs[0].parsedData && (
                        <div className="mt-4 w-full max-w-2xl bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg shadow-md p-4 border-2 border-emerald-200 animate-fade-in">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">🤖</span>
                                <h4 className="font-bold text-emerald-700">AI가 자동으로 인식했어요!</h4>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                                {logs[0].parsedData.crop && (
                                    <div className="bg-white rounded-lg p-2 text-center">
                                        <div className="text-xs text-gray-500">작물</div>
                                        <div className="font-bold text-emerald-600">{logs[0].parsedData.crop}</div>
                                    </div>
                                )}
                                {logs[0].parsedData.quantity && (
                                    <div className="bg-white rounded-lg p-2 text-center">
                                        <div className="text-xs text-gray-500">수량</div>
                                        <div className="font-bold text-blue-600">{logs[0].parsedData.quantity} {logs[0].parsedData.unit}</div>
                                    </div>
                                )}
                                {logs[0].parsedData.action && (
                                    <div className="bg-white rounded-lg p-2 text-center">
                                        <div className="text-xs text-gray-500">작업</div>
                                        <div className="font-bold text-purple-600">{logs[0].parsedData.action}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                <h3 className="font-semibold text-blue-900 mb-2">💡 Tips for Best Results</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Speak clearly and at a normal pace</li>
                    <li>• Minimize background noise</li>
                    <li>• Select the appropriate category before recording</li>
                    <li>• Logs are saved automatically to your browser</li>
                </ul>
            </div>

            {/* Logs List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">
                        Recent Logs ({logs.length})
                    </h2>
                    {logs.length > 0 && (
                        <button
                            onClick={() => {
                                if (confirm('Are you sure you want to delete all logs?')) {
                                    setLogs([]);
                                    localStorage.removeItem('voiceLogs');
                                }
                            }}
                            className="text-sm text-red-600 hover:text-red-700"
                        >
                            Clear All
                        </button>
                    )}
                </div>

                {logs.length === 0 ? (
                    <div className="bg-gray-50 rounded-lg p-12 text-center">
                        <p className="text-gray-500 text-lg">No voice logs yet</p>
                        <p className="text-gray-400 text-sm mt-2">
                            Click the microphone button above to start recording
                        </p>
                    </div>
                ) : (
                    logs.map((log) => (
                        <div
                            key={log.id}
                            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(log.category)}`}>
                                            {getCategoryIcon(log.category)} {log.category}
                                        </span>
                                        <span className="text-sm text-gray-500">
                                            {formatTimestamp(log.timestamp)}
                                        </span>
                                    </div>
                                    <p className="text-gray-700 leading-relaxed">{log.text}</p>
                                    <p className="text-xs text-gray-400 mt-2">
                                        {log.timestamp.toLocaleString()}
                                    </p>
                                </div>
                                <button
                                    onClick={() => deleteLog(log.id)}
                                    className="ml-4 text-gray-400 hover:text-red-600 transition-colors"
                                    title="Delete log"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Export Options */}
            {logs.length > 0 && (
                <div className="mt-8 flex justify-end space-x-4">
                    <button
                        onClick={() => {
                            const data = JSON.stringify(logs, null, 2);
                            const blob = new Blob([data], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `voice-logs-${new Date().toISOString().split('T')[0]}.json`;
                            a.click();
                        }}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Export as JSON
                    </button>
                    <button
                        onClick={() => {
                            const text = logs
                                .map(
                                    (log) =>
                                        `[${log.timestamp.toLocaleString()}] ${log.category.toUpperCase()}: ${log.text}`
                                )
                                .join('\n\n');
                            const blob = new Blob([text], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `voice-logs-${new Date().toISOString().split('T')[0]}.txt`;
                            a.click();
                        }}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        Export as Text
                    </button>
                </div>
            )}
        </div>
    );
}
