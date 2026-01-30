'use client';

import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Trash2, Calendar } from 'lucide-react';
import { fetchVoiceLogs, createVoiceLog, deleteVoiceLog } from '@/lib/api';

interface VoiceLog {
    id: number;
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

// AI parsing function - converts natural language to structured data
function parseVoiceInput(text: string): VoiceLog['parsedData'] {
    const lowerText = text.toLowerCase();

    // Crop detection (English only for simplicity)
    const cropPatterns = [
        { pattern: /pepper|peppers|bell pepper/i, name: 'Peppers' },
        { pattern: /tomato|tomatoes/i, name: 'Tomatoes' },
        { pattern: /strawberry|strawberries/i, name: 'Strawberries' },
        { pattern: /lettuce/i, name: 'Lettuce' },
        { pattern: /cucumber|cucumbers/i, name: 'Cucumbers' },
        { pattern: /spinach/i, name: 'Spinach' },
        { pattern: /carrot|carrots/i, name: 'Carrots' },
        { pattern: /broccoli/i, name: 'Broccoli' },
        { pattern: /potato|potatoes/i, name: 'Potatoes' },
    ];

    const detectedCrops = cropPatterns
        .filter(cp => cp.pattern.test(text))
        .map(cp => cp.name);
    const detectedCrop = detectedCrops.length > 0 ? detectedCrops.join(', ') : undefined;

    // Quantity detection
    const quantityPatterns = [
        /(\d+(?:\.\d+)?)\s*(kg|kilogram|kilograms)/i,
        /(\d+(?:\.\d+)?)\s*(lb|lbs|pound|pounds)/i,
        /(\d+(?:\.\d+)?)\s*(g|gram|grams)/i,
        /(\d+(?:\.\d+)?)\s*(ton|tons)/i,
        /(\d+(?:\.\d+)?)\s*(box|boxes|crate|crates)/i,
        /(\d+(?:\.\d+)?)\s*(plant|plants)/i,
    ];

    let quantity: number | undefined;
    let unit: string | undefined;

    for (const pattern of quantityPatterns) {
        const match = text.match(pattern);
        if (match) {
            quantity = parseFloat(match[1]);
            unit = match[2].toLowerCase();
            // Normalize units
            if (unit.match(/kilogram|kilograms/i)) unit = 'kg';
            if (unit.match(/pound|pounds|lbs/i)) unit = 'lb';
            if (unit.match(/gram|grams/i)) unit = 'g';
            if (unit.match(/box|boxes|crate|crates/i)) unit = 'box';
            if (unit.match(/plant|plants/i)) unit = 'plants';
            break;
        }
    }

    // Action detection
    let action = 'note';
    if (lowerText.match(/harvest|picked|collected/)) action = 'harvest';
    else if (lowerText.match(/plant|planted|seeded|sowed/)) action = 'planted';
    else if (lowerText.match(/water|watered|irrigate|irrigated/)) action = 'watered';
    else if (lowerText.match(/fertilize|fertilized|fed/)) action = 'fertilized';
    else if (lowerText.match(/pest|disease|bug|insect|mold|fungus/)) action = 'pest_issue';
    else if (lowerText.match(/prun|trimmed|cut/)) action = 'pruned';

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
    const [selectedLanguage, setSelectedLanguage] = useState<'en-US'>('en-US');
    const [browserSupported, setBrowserSupported] = useState(true);

    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        // Fetch logs on mount
        fetchVoiceLogs()
            .then(data => {
                // Parse timestamps
                const formatted = data.map((d: any) => ({
                    ...d,
                    timestamp: new Date(d.timestamp)
                }));
                setLogs(formatted);
            })
            .catch(err => console.error("Failed to fetch logs", err));
    }, []);

    useEffect(() => {
        // Check browser support
        if (typeof window !== 'undefined') {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

            if (!SpeechRecognition) {
                setBrowserSupported(false);
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

                if (finalTranscript) {
                    setCurrentTranscript(prev => prev + finalTranscript);
                } else {
                    setCurrentTranscript(prev => prev + interimTranscript);
                }
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                if (event.error === 'not-allowed') {
                    alert('Microphone access denied. Please enable microphone permissions.');
                }
                setIsRecording(false);
            };

            recognition.onend = () => {
                if (isRecording) {
                    recognition.start();
                }
            };

            recognitionRef.current = recognition;
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [selectedLanguage, isRecording]);

    const startRecording = () => {
        if (recognitionRef.current && !isRecording) {
            setCurrentTranscript('');
            recognitionRef.current.start();
            setIsRecording(true);
        }
    };

    const stopRecording = () => {
        if (recognitionRef.current && isRecording) {
            recognitionRef.current.stop();
            setIsRecording(false);

            if (currentTranscript.trim()) {
                // AI parsing
                const parsedData = parseVoiceInput(currentTranscript);

                // Auto-categorize based on action
                let autoCategory: VoiceLog['category'] = selectedCategory;
                if (parsedData?.action === 'harvest') autoCategory = 'harvest';
                else if (parsedData?.action === 'pest_issue') autoCategory = 'issue';
                else if (parsedData?.action === 'planted' || parsedData?.action === 'watered' || parsedData?.action === 'fertilized' || parsedData?.action === 'pruned') autoCategory = 'task';

                const newLogPayload = {
                    text: currentTranscript.trim(),
                    category: autoCategory,
                    parsedData
                };

                // Optimistic Update or Wait for Server? user experience is better with wait here as it confirms save
                createVoiceLog(newLogPayload).then(savedLog => {
                    setLogs(prev => [{
                        ...savedLog,
                        timestamp: new Date(savedLog.timestamp)
                    }, ...prev]);
                }).catch(err => alert("Failed to save log"));

                setCurrentTranscript('');
            }
        }
    };

    const deleteLog = async (id: number) => {
        try {
            await deleteVoiceLog(id);
            setLogs(prev => prev.filter(log => log.id !== id));
        } catch (e) {
            alert("Failed to delete log");
        }
    };

    const clearAllLogs = async () => {
        if (confirm('Are you sure you want to delete all logs? This cannot be undone.')) {
            // Sequential delete for now as we don't have bulk delete endpoint
            for (const log of logs) {
                await deleteVoiceLog(log.id).catch(console.error);
            }
            setLogs([]);
        }
    };

    const getCategoryColor = (category: VoiceLog['category']) => {
        switch (category) {
            case 'harvest': return 'bg-green-100 text-green-700 border-green-200';
            case 'task': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'issue': return 'bg-red-100 text-red-700 border-red-200';
            case 'observation': return 'bg-purple-100 text-purple-700 border-purple-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getCategoryIcon = (category: VoiceLog['category']) => {
        switch (category) {
            case 'harvest': return '🌾';
            case 'task': return '✅';
            case 'issue': return '⚠️';
            case 'observation': return '👁️';
            default: return '�';
        }
    };

    if (!browserSupported) {
        return (
            <div className="max-w-4xl mx-auto p-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <h2 className="text-xl font-bold text-red-800 mb-2">Browser Not Supported</h2>
                    <p className="text-red-600">
                        Your browser doesn't support speech recognition.
                        Please use Chrome, Edge, or Safari.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    Voice Log
                </h2>
                <p className="text-slate-500">Record farm activities using your voice</p>
            </div>

            {/* Recording Interface */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                <div className="text-center space-y-4">
                    {/* Microphone Button */}
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${isRecording
                            ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                            : 'bg-emerald-500 hover:bg-emerald-600'
                            } shadow-lg`}
                    >
                        {isRecording ? (
                            <MicOff size={40} className="text-white" />
                        ) : (
                            <Mic size={40} className="text-white" />
                        )}
                    </button>

                    <div>
                        <p className="text-sm font-medium text-slate-600">
                            {isRecording ? 'Recording... Click to stop' : 'Click to start recording'}
                        </p>
                    </div>

                    {/* Current Transcript */}
                    {currentTranscript && (
                        <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <p className="text-sm text-slate-600 mb-1 font-medium">Current transcript:</p>
                            <p className="text-slate-800">{currentTranscript}</p>
                        </div>
                    )}

                    {/* Category Selection */}
                    <div className="flex flex-wrap gap-2 justify-center mt-4">
                        {(['observation', 'task', 'issue', 'note', 'harvest'] as const).map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${selectedCategory === cat
                                    ? getCategoryColor(cat)
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                    }`}
                            >
                                {getCategoryIcon(cat)} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Logs List */}
            <div className="bg-white rounded-xl shadow-md border border-slate-200">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800">Recent Logs ({logs.length})</h3>
                    {logs.length > 0 && (
                        <button
                            onClick={clearAllLogs}
                            className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                        >
                            <Trash2 size={14} />
                            Clear All
                        </button>
                    )}
                </div>

                <div className="divide-y divide-slate-100">
                    {logs.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                            <Mic size={48} className="mx-auto mb-2 opacity-50" />
                            <p>No logs yet. Start recording to create your first log!</p>
                        </div>
                    ) : (
                        logs.map(log => (
                            <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(log.category)}`}>
                                                {getCategoryIcon(log.category)} {log.category}
                                            </span>
                                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                                <Calendar size={12} />
                                                {log.timestamp.toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-slate-800 mb-2">{log.text}</p>

                                        {/* Parsed Data */}
                                        {log.parsedData && (log.parsedData.crop || log.parsedData.quantity) && (
                                            <div className="flex flex-wrap gap-2 text-xs">
                                                {log.parsedData.crop && (
                                                    <span className="bg-emerald-50 text-emerald-700 px-2 py-1 rounded border border-emerald-200">
                                                        🌱 {log.parsedData.crop}
                                                    </span>
                                                )}
                                                {log.parsedData.quantity && (
                                                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200">
                                                        📊 {log.parsedData.quantity} {log.parsedData.unit}
                                                    </span>
                                                )}
                                                {log.parsedData.action && (
                                                    <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-200">
                                                        ⚡ {log.parsedData.action}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => deleteLog(log.id)}
                                        className="text-slate-400 hover:text-red-600 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">💡 Tips for better voice logging:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Speak clearly and mention the crop name (e.g., "tomatoes", "peppers")</li>
                    <li>• Include quantities with units (e.g., "5 kg", "10 boxes")</li>
                    <li>• Use action words like "harvested", "planted", "watered"</li>
                    <li>• Example: "Harvested 15 pounds of strawberries today"</li>
                </ul>
            </div>
        </div>
    );
}
