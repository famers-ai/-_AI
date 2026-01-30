'use client';

import { useState } from 'react';
import { getAllCrops, type Crop } from '@/lib/crops';
import { Check } from 'lucide-react';
import clsx from 'clsx';

interface CropSelectorProps {
    selectedCropId: string;
    onCropChange: (cropId: string) => void;
}

export default function CropSelector({ selectedCropId, onCropChange }: CropSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const crops = getAllCrops();
    const selectedCrop = crops.find(c => c.id === selectedCropId) || crops[0];

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-slate-200 shadow-sm hover:border-emerald-300 transition-all"
            >
                <span className="text-2xl">{selectedCrop.icon}</span>
                <div className="text-left">
                    <div className="text-sm font-semibold text-slate-800">{selectedCrop.name}</div>
                    <div className="text-xs text-slate-500 italic">{selectedCrop.scientificName}</div>
                </div>
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute top-full mt-2 left-0 w-72 bg-white rounded-lg border border-slate-200 shadow-lg z-20 max-h-96 overflow-y-auto">
                        {crops.map((crop) => (
                            <button
                                key={crop.id}
                                onClick={() => {
                                    onCropChange(crop.id);
                                    setIsOpen(false);
                                }}
                                className={clsx(
                                    "w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors border-b border-slate-100 last:border-b-0",
                                    selectedCropId === crop.id && "bg-emerald-50"
                                )}
                            >
                                <span className="text-2xl">{crop.icon}</span>
                                <div className="flex-1 text-left">
                                    <div className="text-sm font-semibold text-slate-800">{crop.name}</div>
                                    <div className="text-xs text-slate-500 italic">{crop.scientificName}</div>
                                </div>
                                {selectedCropId === crop.id && (
                                    <Check size={18} className="text-emerald-600" />
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
