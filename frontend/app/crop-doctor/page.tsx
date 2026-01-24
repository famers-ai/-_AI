"use client";

import { useState } from "react";
import { UploadCloud, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { uploadImageForDiagnosis } from "@/lib/api";
import clsx from "clsx";

export default function CropDoctorPage() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [diagnosis, setDiagnosis] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setDiagnosis(null);
        }
    };

    const handleAnalyze = async () => {
        if (!selectedFile) return;

        setAnalyzing(true);
        setDiagnosis(null);

        try {
            const result = await uploadImageForDiagnosis(selectedFile);
            setDiagnosis(result.diagnosis);
        } catch (error) {
            console.error(error);
            setDiagnosis("Error analyzing image. Please try again.");
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                    AI Crop Doctor
                </h2>
                <p className="text-slate-500">Upload a photo of your crop for instant disease diagnosis.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Upload Section */}
                <div className="space-y-4">
                    <div className={clsx(
                        "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-colors h-80 relative bg-white",
                        previewUrl ? "border-emerald-200" : "border-slate-300 hover:border-emerald-400 hover:bg-slate-50"
                    )}>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />

                        {previewUrl ? (
                            <img src={previewUrl} alt="Preview" className="h-full object-contain rounded-lg" />
                        ) : (
                            <>
                                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                                    <UploadCloud size={32} />
                                </div>
                                <h3 className="font-semibold text-slate-700">Click to Upload</h3>
                                <p className="text-sm text-slate-400 mt-2">SVG, PNG, JPG or GIF (MAX. 5MB)</p>
                            </>
                        )}
                    </div>

                    <button
                        onClick={handleAnalyze}
                        disabled={!selectedFile || analyzing}
                        className={clsx(
                            "w-full py-3 rounded-xl font-medium shadow-lg transition-all flex items-center justify-center gap-2",
                            !selectedFile || analyzing
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 active:scale-95"
                        )}
                    >
                        {analyzing ? (
                            <><Loader2 className="animate-spin" /> Analyzing...</>
                        ) : (
                            <><CheckCircle size={18} /> Diagnose Crop</>
                        )}
                    </button>
                </div>

                {/* Results Section */}
                <div className="h-full">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-full min-h-[320px] flex flex-col">
                        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100">
                            <AlertTriangle className="text-yellow-500" />
                            <h3 className="font-semibold text-slate-800">Diagnosis Report</h3>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {diagnosis ? (
                                <div className="prose prose-sm prose-slate max-w-none">
                                    <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                                        {diagnosis}
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
                                    <p className="max-w-[200px]">Diagnosis results will appear here after AI analysis.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
