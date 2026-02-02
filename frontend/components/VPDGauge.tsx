"use client";

import { useEffect, useRef } from 'react';

interface VPDGaugeProps {
    value: number;
    min?: number;
    max?: number;
    optimal?: [number, number];
    size?: number;
}

export default function VPDGauge({
    value,
    min = 0,
    max = 2,
    optimal = [0.8, 1.2],
    size = 200
}: VPDGaugeProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        canvas.width = size;
        canvas.height = size;

        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size / 2 - 20;

        // Clear canvas
        ctx.clearRect(0, 0, size, size);

        // Draw background arc
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI * 0.75, Math.PI * 2.25);
        ctx.lineWidth = 20;
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineCap = 'round';
        ctx.stroke();

        // Draw optimal range
        const optimalStart = ((optimal[0] - min) / (max - min)) * 1.5 * Math.PI + Math.PI * 0.75;
        const optimalEnd = ((optimal[1] - min) / (max - min)) * 1.5 * Math.PI + Math.PI * 0.75;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, optimalStart, optimalEnd);
        ctx.lineWidth = 20;
        ctx.strokeStyle = '#10b981';
        ctx.stroke();

        // Draw value arc with gradient
        const valueAngle = ((value - min) / (max - min)) * 1.5 * Math.PI + Math.PI * 0.75;

        const gradient = ctx.createLinearGradient(0, 0, size, size);
        if (value < optimal[0]) {
            gradient.addColorStop(0, '#3b82f6');
            gradient.addColorStop(1, '#60a5fa');
        } else if (value > optimal[1]) {
            gradient.addColorStop(0, '#ef4444');
            gradient.addColorStop(1, '#f87171');
        } else {
            gradient.addColorStop(0, '#8b5cf6');
            gradient.addColorStop(1, '#a78bfa');
        }

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI * 0.75, valueAngle);
        ctx.lineWidth = 22;
        ctx.strokeStyle = gradient;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Draw center circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 40, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Draw value text
        ctx.fillStyle = '#1e293b';
        ctx.font = `bold ${size / 5}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(value.toFixed(2), centerX, centerY - 10);

        // Draw unit text
        ctx.fillStyle = '#64748b';
        ctx.font = `${size / 12}px Arial`;
        ctx.fillText('kPa', centerX, centerY + 20);

        // Draw min/max labels
        ctx.fillStyle = '#94a3b8';
        ctx.font = `${size / 16}px Arial`;
        ctx.textAlign = 'left';
        ctx.fillText(min.toString(), 20, size - 20);
        ctx.textAlign = 'right';
        ctx.fillText(max.toString(), size - 20, size - 20);

    }, [value, min, max, optimal, size]);

    const getStatus = () => {
        if (value < optimal[0]) return { text: 'Too Low', color: 'text-blue-600' };
        if (value > optimal[1]) return { text: 'Too High', color: 'text-red-600' };
        return { text: 'Optimal', color: 'text-green-600' };
    };

    const status = getStatus();

    return (
        <div className="flex flex-col items-center">
            <canvas ref={canvasRef} className="drop-shadow-lg" />
            <div className="mt-4 text-center">
                <p className={`text-lg font-bold ${status.color}`}>{status.text}</p>
                <p className="text-xs text-slate-500 mt-1">
                    Optimal: {optimal[0]} - {optimal[1]} kPa
                </p>
            </div>
        </div>
    );
}
