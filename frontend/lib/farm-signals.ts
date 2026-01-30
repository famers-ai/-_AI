// Farm condition signals for intuitive farmer UX
import { getCropById, type Crop } from './crops';

export interface FarmCondition {
    status: 'excellent' | 'good' | 'caution' | 'warning' | 'unknown';
    emoji: string;
    message: string;
    color: string;
    bgColor: string;
    borderColor: string;
}

/**
 * Safe number conversion (null/undefined/NaN protection)
 */
function safeNumber(value: any, defaultValue: number = 0): number {
    if (value === null || value === undefined || isNaN(value)) {
        return defaultValue;
    }
    return Number(value);
}

/**
 * Get VPD signal based on crop-specific optimal ranges
 */
export function getVPDSignal(vpd: number | null | undefined, cropId: string = 'strawberries'): {
    color: string;
    emoji: string;
    message: string;
} {
    // null/undefined check
    if (vpd === null || vpd === undefined || isNaN(vpd)) {
        return {
            color: 'text-gray-600',
            emoji: '⚪',
            message: 'No Data'
        };
    }

    const safeVpd = safeNumber(vpd, 0);
    const crop = getCropById(cropId);
    const { min, max } = crop.optimalVPD;

    if (safeVpd < min * 0.5) {
        return {
            color: 'text-red-600',
            emoji: '🔴',
            message: 'Critical! High Mold Risk'
        };
    } else if (safeVpd < min) {
        return {
            color: 'text-yellow-600',
            emoji: '🟡',
            message: 'Too Humid - Caution'
        };
    } else if (safeVpd <= max) {
        return {
            color: 'text-green-600',
            emoji: '🟢',
            message: 'Optimal'
        };
    } else if (safeVpd <= max * 1.3) {
        return {
            color: 'text-yellow-600',
            emoji: '🟡',
            message: 'Slightly Dry'
        };
    } else {
        return {
            color: 'text-red-600',
            emoji: '🔴',
            message: 'Critical! High Pest Risk'
        };
    }
}

/**
 * Comprehensive farm condition assessment
 */
export function getFarmCondition(
    indoorVPD: number | null | undefined,
    temperature: number | null | undefined,
    humidity: number | null | undefined,
    rain: number | null | undefined,
    cropId: string = 'strawberries'
): FarmCondition {
    // Data validation
    if (indoorVPD === null || indoorVPD === undefined || isNaN(indoorVPD)) {
        return {
            status: 'unknown',
            emoji: '❓',
            message: 'Collecting Data...',
            color: 'text-gray-700',
            bgColor: 'bg-gray-50',
            borderColor: 'border-gray-200'
        };
    }

    const safeVpd = safeNumber(indoorVPD, 0);
    const safeTemp = safeNumber(temperature, 70);
    const safeHumidity = safeNumber(humidity, 50);
    const safeRain = safeNumber(rain, 0);

    const crop = getCropById(cropId);
    const vpdSignal = getVPDSignal(safeVpd, cropId);

    // Critical conditions check
    if (safeVpd < crop.optimalVPD.min * 0.5 || safeVpd > crop.optimalVPD.max * 1.5) {
        return {
            status: 'warning',
            emoji: '⚠️',
            message: `${vpdSignal.message} - Immediate Action Required`,
            color: 'text-red-700',
            bgColor: 'bg-red-50',
            borderColor: 'border-red-200'
        };
    }

    // Caution conditions
    if (safeVpd < crop.optimalVPD.min || safeVpd > crop.optimalVPD.max) {
        return {
            status: 'caution',
            emoji: '🟡',
            message: 'Caution - Environment Check Recommended',
            color: 'text-yellow-700',
            bgColor: 'bg-yellow-50',
            borderColor: 'border-yellow-200'
        };
    }

    // Heavy rain warning
    if (safeRain > 10) {
        return {
            status: 'caution',
            emoji: '🌧️',
            message: 'Rain Forecast - Check Drainage',
            color: 'text-blue-700',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200'
        };
    }

    // Temperature warnings
    if (safeTemp > crop.optimalTemp.max + 10 || safeTemp < crop.optimalTemp.min - 10) {
        return {
            status: 'caution',
            emoji: safeTemp > crop.optimalTemp.max + 10 ? '🔥' : '❄️',
            message: safeTemp > crop.optimalTemp.max + 10 ? 'High Temperature Alert' : 'Low Temperature Alert',
            color: 'text-orange-700',
            bgColor: 'bg-orange-50',
            borderColor: 'border-orange-200'
        };
    }

    // All conditions optimal
    return {
        status: 'excellent',
        emoji: '☀️',
        message: 'Perfect Growing Conditions',
        color: 'text-green-700',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
    };
}

/**
 * Temperature color coding
 */
export function getTemperatureColor(temp: number | null | undefined): string {
    const safeTemp = safeNumber(temp, 70);
    if (safeTemp < 50) return 'text-blue-600';
    if (safeTemp < 70) return 'text-green-600';
    if (safeTemp < 85) return 'text-yellow-600';
    return 'text-red-600';
}

/**
 * Humidity color coding
 */
export function getHumidityColor(humidity: number | null | undefined): string {
    const safeHumidity = safeNumber(humidity, 50);
    if (safeHumidity < 30) return 'text-red-600';
    if (safeHumidity < 50) return 'text-yellow-600';
    if (safeHumidity <= 70) return 'text-green-600';
    return 'text-blue-600';
}
